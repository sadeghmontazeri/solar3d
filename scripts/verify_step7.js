const { spawn } = require('child_process');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const htmlUrl = 'file:///C:/Users/11/Desktop/PC/shahrivar/solar-app/APP/17/index.html';
const tempProfile = 'C:\\Users\\11\\AppData\\Local\\Temp\\chrome-step7-profile-' + Date.now();

const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9228',
  '--window-size=1920,1080',
  '--user-data-dir=' + tempProfile,
  htmlUrl
]);

console.log('Spawned Chrome for Step 7 verification on port 9228...');

setTimeout(async () => {
  try {
    const res = await fetch('http://127.0.0.1:9228/json');
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

    const consoleMessages = [];
    const exceptions = [];

    ws.onmessage = (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.id && callbacks.has(msg.id)) {
        const cb = callbacks.get(msg.id);
        callbacks.delete(msg.id);
        cb(msg.result);
      }
      if (msg.method === 'Runtime.consoleAPICalled') {
        const text = msg.params.args.map(a => a.value ?? a.description ?? JSON.stringify(a)).join(' ');
        consoleMessages.push({ type: msg.params.type, text });
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        exceptions.push(msg.params.exceptionDetails);
      }
    };

    ws.onopen = async () => {
      await send('Page.enable');
      await send('Runtime.enable');
      await send('Console.enable');

      // Wait 3 seconds for initial load and multiple simulation ticks
      await new Promise(r => setTimeout(r, 3000));

      const evaluate = async (expr) => {
        const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
        return r?.result?.value;
      };

      const hudValues = await evaluate(`({
        hudGridP: document.getElementById('hud-grid-p')?.textContent,
        hudGridUnit: document.getElementById('hud-grid-unit')?.textContent,
        hudGridDirection: document.getElementById('hud-grid-direction')?.textContent,
        hudPvP: document.getElementById('hud-pv-p')?.textContent,
        hudBatP: document.getElementById('hud-bat-p')?.textContent,
        hudBatSoc: document.getElementById('hud-bat-soc')?.textContent,
        hudEpsP: document.getElementById('hud-eps-p')?.textContent,
        hudLoadP: document.getElementById('hud-load-p')?.textContent,
        gridDotClass: document.getElementById('hud-grid-dot')?.className
      })`);

      console.log('=== Step 7 HUD Telemetry in Live Chrome ===');
      console.log(JSON.stringify(hudValues, null, 2));

      console.log('\n=== Console Health ===');
      console.log('Exceptions count:', exceptions.length);
      if (exceptions.length > 0) {
        exceptions.forEach(e => console.error(' - ' + e.text));
      }

      ws.close();
      chrome.kill();

      const pVal = parseInt(hudValues.hudGridP, 10);
      const pass = pVal === 0 && exceptions.length === 0;
      console.log(`\nOverall Verdict: ${pass ? 'PASSED: Grid badge correctly reads 0 W' : 'FAILED'}`);
      process.exit(pass ? 0 : 1);
    };
  } catch (err) {
    console.error('Test execution failed:', err);
    chrome.kill();
    process.exit(1);
  }
}, 2000);
