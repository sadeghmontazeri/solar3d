const { spawn } = require('child_process');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const htmlUrl = 'file:///C:/Users/11/Desktop/PC/shahrivar/solar-app/APP/17/index.html';
const tempProfile = 'C:\\Users\\11\\AppData\\Local\\Temp\\chrome-step2-profile-' + Date.now();

const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9223',
  '--window-size=1920,1080',
  '--user-data-dir=' + tempProfile,
  htmlUrl
]);

console.log('Spawned Chrome for Step 2 browser verification on port 9223...');

setTimeout(async () => {
  try {
    const res = await fetch('http://127.0.0.1:9223/json');
    const tabs = await res.json();
    const tab = tabs.find(t => t.url.includes('index.html'));
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

    const exceptions = [];
    const consoleLogs = [];

    ws.onmessage = (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.id && callbacks.has(msg.id)) {
        const cb = callbacks.get(msg.id);
        callbacks.delete(msg.id);
        cb(msg.result);
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

      // Wait 3 seconds for page and simulation loop to execute several frames
      await new Promise(r => setTimeout(r, 3000));

      const evalRes = await send('Runtime.evaluate', {
        expression: `({
          computePowerModelType: typeof window.computePowerModel,
          gridBadge: document.getElementById('hud-grid-p')?.textContent,
          gridUnit: document.getElementById('hud-grid-unit')?.textContent,
          pvBadge: document.getElementById('hud-pv-p')?.textContent,
          batBadge: document.getElementById('hud-bat-p')?.textContent,
          socBadge: document.getElementById('hud-bat-soc')?.textContent,
          epsBadge: document.getElementById('hud-eps-p')?.textContent,
          invBadge: document.getElementById('hud-inv-p')?.textContent,
          telemetry: window.hybridApp?.state?.telemetry
        })`,
        returnByValue: true
      });

      console.log('=== Step 2 Runtime Evaluation ===');
      console.log(JSON.stringify(evalRes?.result?.value, null, 2));

      console.log('=== Exceptions Thrown ===');
      if (exceptions.length === 0) {
        console.log('Zero exceptions thrown! Clean runtime execution.');
      } else {
        console.log('Found ' + exceptions.length + ' exceptions:');
        exceptions.forEach(e => console.error(' - [' + e.lineNumber + ':' + e.columnNumber + '] ' + e.text + ' ' + (e.exception?.description || '')));
      }

      ws.close();
      chrome.kill();
      process.exit(exceptions.length > 0 ? 1 : 0);
    };
  } catch (err) {
    console.error('Test execution failed:', err);
    chrome.kill();
    process.exit(1);
  }
}, 2000);
