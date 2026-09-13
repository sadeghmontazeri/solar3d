const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const sourceHtml = path.join(__dirname, '..', 'dist', 'solar-app.html');
const tempDir = 'C:\\Users\\11\\Desktop\\test-dist-step4';
const destHtml = path.join(tempDir, 'solar-app.html');
const evidenceDir = path.join(__dirname, '..', 'evidence', 'step4');
const screenshotPath = path.join(evidenceDir, 'offline_verification.png');
const tempProfile = 'C:\\Users\\11\\AppData\\Local\\Temp\\chrome-step4-profile-' + Date.now();

// 1. Setup isolated directories
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}
if (!fs.existsSync(evidenceDir)) {
  fs.mkdirSync(evidenceDir, { recursive: true });
}
fs.copyFileSync(sourceHtml, destHtml);
console.log(`Copied bundle to isolated location: ${destHtml}`);

const htmlUrl = 'file:///' + destHtml.replace(/\\/g, '/');

const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9225',
  '--window-size=1920,1080',
  '--user-data-dir=' + tempProfile,
  htmlUrl
]);

console.log('Spawned Chrome for Step 4 offline verification on port 9225...');

setTimeout(async () => {
  try {
    const res = await fetch('http://127.0.0.1:9225/json');
    const tabs = await res.json();
    const tab = tabs.find(t => t.url.includes('solar-app.html'));
    if (!tab) {
      console.error('Target tab not found!');
      chrome.kill();
      process.exit(1);
    }

    const ws = new WebSocket(tab.webSocketDebuggerUrl);
    let msgId = 1;
    const callbacks = new Map();

    function send(method, params = {}) {
      return new Promise((resolve) => {
        const id = msgId++;
        callbacks.set(id, resolve);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    const networkRequests = [];
    const exceptions = [];

    ws.onmessage = (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.id && callbacks.has(msg.id)) {
        const cb = callbacks.get(msg.id);
        callbacks.delete(msg.id);
        cb(msg.result);
      }
      if (msg.method === 'Network.requestWillBeSent') {
        networkRequests.push({
          url: msg.params.request.url,
          type: msg.params.type
        });
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        exceptions.push(msg.params.exceptionDetails);
      }
    };

    ws.onopen = async () => {
      await send('Page.enable');
      await send('Runtime.enable');
      await send('Network.enable');

      // Emulate offline network conditions
      await send('Network.emulateNetworkConditions', {
        offline: true,
        latency: 0,
        downloadThroughput: 0,
        uploadThroughput: 0
      });

      // Reload under forced offline conditions
      await send('Page.reload');

      // Wait 3 seconds for rendering & font loading
      await new Promise(r => setTimeout(r, 3000));

      // Font & UI verification
      const evalRes = await send('Runtime.evaluate', {
        expression: `({
          fontVazirmatnRegular: document.fonts.check('16px Vazirmatn'),
          fontVazirmatnSemiBold: document.fonts.check('600 16px Vazirmatn'),
          fontVazirmatnBold: document.fonts.check('700 16px Vazirmatn'),
          fontVazirmatnExtraBold: document.fonts.check('800 16px Vazirmatn'),
          fontsStatus: document.fonts.status,
          bodyFontFamily: window.getComputedStyle(document.body).fontFamily,
          title: document.title,
          canvasPresent: !!document.querySelector('canvas'),
          gridBadge: document.getElementById('hud-grid-p')?.textContent
        })`,
        returnByValue: true
      });

      console.log('=== Step 4 Font & UI Evaluation (Offline Mode) ===');
      console.log(JSON.stringify(evalRes?.result?.value, null, 2));

      const externalRequests = networkRequests.filter(r => r.url.startsWith('http://') || r.url.startsWith('https://'));
      const dataUriRequests = networkRequests.filter(r => r.url.startsWith('data:'));
      const otherRequests = networkRequests.filter(r => !r.url.startsWith('http://') && !r.url.startsWith('https://') && !r.url.startsWith('data:'));

      console.log('=== Network Tab Summary (Offline) ===');
      console.log(`External HTTP/HTTPS Requests: ${externalRequests.length}`);
      if (externalRequests.length > 0) {
        console.log('External URLs:', externalRequests.map(r => r.url));
      } else {
        console.log('Zero external requests leave the machine! Completely offline.');
      }
      console.log(`Inline data URI font loads: ${dataUriRequests.length}`);
      console.log(`Other requests: ${otherRequests.length}`);

      console.log('=== Exceptions Thrown ===');
      if (exceptions.length === 0) {
        console.log('Zero runtime exceptions thrown!');
      } else {
        console.log('Found ' + exceptions.length + ' exceptions:');
        exceptions.forEach(e => console.error(' - [' + e.lineNumber + ':' + e.columnNumber + '] ' + e.text));
      }

      // Capture screenshot
      const screenshot = await send('Page.captureScreenshot', { format: 'png' });
      if (screenshot?.data) {
        fs.writeFileSync(screenshotPath, Buffer.from(screenshot.data, 'base64'));
        console.log(`Saved screenshot to ${screenshotPath}`);
      }

      ws.close();
      chrome.kill();

      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
        console.log('Cleaned up temporary isolated test directory.');
      } catch (e) {
        console.warn('Could not clean up temp dir:', e.message);
      }

      const pass = exceptions.length === 0 && externalRequests.length === 0;
      process.exit(pass ? 0 : 1);
    };
  } catch (err) {
    console.error('Test execution failed:', err);
    chrome.kill();
    process.exit(1);
  }
}, 2000);
