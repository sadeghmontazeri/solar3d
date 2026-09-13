const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const sourceHtml = path.join(__dirname, '..', 'dist', 'solar-app.html');
const tempDir = 'C:\\Users\\11\\Desktop\\test-dist-step3';
const destHtml = path.join(tempDir, 'solar-app.html');
const tempProfile = 'C:\\Users\\11\\AppData\\Local\\Temp\\chrome-step3-profile-' + Date.now();

// 1. Ensure isolated folder
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}
fs.copyFileSync(sourceHtml, destHtml);
console.log(`Copied bundle to isolated location: ${destHtml}`);

const htmlUrl = 'file:///' + destHtml.replace(/\\/g, '/');

const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9224',
  '--window-size=1920,1080',
  '--user-data-dir=' + tempProfile,
  htmlUrl
]);

console.log('Spawned Chrome for Step 3 bundle verification on port 9224...');

setTimeout(async () => {
  try {
    const res = await fetch('http://127.0.0.1:9224/json');
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
    const failedRequests = [];
    const exceptions = [];
    const consoleLogs = [];

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
      if (msg.method === 'Network.loadingFailed') {
        failedRequests.push({
          url: msg.params.canceled ? msg.params.errorText : msg.params.errorText,
          requestId: msg.params.requestId
        });
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        exceptions.push(msg.params.exceptionDetails);
      }
      if (msg.method === 'Runtime.consoleAPICalled') {
        const text = msg.params.args.map(a => a.value ?? a.description ?? JSON.stringify(a)).join(' ');
        consoleLogs.push({ type: msg.params.type, text });
      }
    };

    ws.onopen = async () => {
      await send('Page.enable');
      await send('Runtime.enable');
      await send('Console.enable');
      await send('Network.enable');

      // Wait 3 seconds for bundle load & scene rendering
      await new Promise(r => setTimeout(r, 3000));

      const evalRes = await send('Runtime.evaluate', {
        expression: `({
          title: document.title,
          canvasPresent: !!document.querySelector('canvas'),
          canvasWidth: document.querySelector('canvas')?.width,
          canvasHeight: document.querySelector('canvas')?.height,
          hasSceneInstance: !!window.sceneInstance,
          sceneChildrenCount: window.sceneInstance?.scene?.children?.length,
          gridBadge: document.getElementById('hud-grid-p')?.textContent,
          pvBadge: document.getElementById('hud-pv-p')?.textContent,
          socBadge: document.getElementById('hud-bat-soc')?.textContent,
          epsBadge: document.getElementById('hud-eps-p')?.textContent
        })`,
        returnByValue: true
      });

      console.log('=== Step 3 Bundle Runtime Evaluation ===');
      console.log(JSON.stringify(evalRes?.result?.value, null, 2));

      console.log('=== Full Network Tab Requests ===');
      console.log(JSON.stringify(networkRequests, null, 2));

      console.log('=== Exceptions Thrown ===');
      if (exceptions.length === 0) {
        console.log('Zero runtime exceptions thrown!');
      } else {
        console.log('Found ' + exceptions.length + ' exceptions:');
        exceptions.forEach(e => console.error(' - [' + e.lineNumber + ':' + e.columnNumber + '] ' + e.text + ' ' + (e.exception?.description || '')));
      }

      ws.close();
      chrome.kill();

      // Clean up isolated test directory
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
        console.log('Cleaned up temporary isolated test directory.');
      } catch (e) {
        console.warn('Could not clean up temp dir:', e.message);
      }

      process.exit(exceptions.length > 0 ? 1 : 0);
    };
  } catch (err) {
    console.error('Test execution failed:', err);
    chrome.kill();
    process.exit(1);
  }
}, 2000);
