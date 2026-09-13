const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const htmlUrl = process.argv[2] || 'file:///C:/Users/11/Desktop/PC/shahrivar/solar-app/APP/17/index.html';
const tempProfile = 'C:\\Users\\11\\AppData\\Local\\Temp\\chrome-step8-profile-' + Date.now();

const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9232',
  '--window-size=1920,1080',
  '--user-data-dir=' + tempProfile,
  htmlUrl
]);

console.log('Spawned Chrome for Step 8 verification on port 9232...');

setTimeout(async () => {
  try {
    const res = await fetch('http://127.0.0.1:9232/json');
    const tabs = await res.json();
    const tab = tabs.find(t => t.url.startsWith('file://'));
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

      const evaluate = async (expr) => {
        const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
        if (r?.exceptionDetails) {
          console.error('Eval Exception:', r.exceptionDetails);
        }
        return r?.result?.value;
      };

      // Poll until sceneInstance and AppOrchestrator are initialized
      for (let i = 0; i < 30; i++) {
        const ready = await evaluate(`!!(window.sceneInstance?.interactiveObjects?.length > 0 && window.AppOrchestrator?.getState)`);
        if (ready) break;
        await new Promise(r => setTimeout(r, 500));
      }

      // 1. Initial State Check (RCD Closed)
      const initialData = await evaluate(`(() => {
        const state = window.AppOrchestrator.getState();
        return {
          hudEpsP: document.getElementById('hud-eps-p')?.textContent,
          hudEpsUnit: document.getElementById('hud-eps-unit')?.textContent,
          epsTelemetry: state.telemetry?.eps,
          rcdBreakerState: state.breakers?.eps_rcd
        };
      })()`);

      console.log('=== 1. Initial State (RCD Closed) ===');
      console.log(JSON.stringify(initialData, null, 2));

      // 2. Open eps_rcd breaker
      await evaluate(`(() => {
        window.AppOrchestrator.onBreakerStateChanged('eps_rcd', false);
      })()`);

      await new Promise(r => setTimeout(r, 1000));

      const rcdOpenData = await evaluate(`(() => {
        const state = window.AppOrchestrator.getState();
        return {
          hudEpsP: document.getElementById('hud-eps-p')?.textContent,
          hudEpsUnit: document.getElementById('hud-eps-unit')?.textContent,
          epsTelemetry: state.telemetry?.eps,
          rcdBreakerState: state.breakers?.eps_rcd
        };
      })()`);

      console.log('\n=== 2. State After eps_rcd Opened ===');
      console.log(JSON.stringify(rcdOpenData, null, 2));

      // Capture screenshot
      const shot = await send('Page.captureScreenshot', { format: 'png' });
      if (shot?.data) {
        const outDir = path.join(__dirname, '..', 'evidence', 'step8');
        if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
        fs.writeFileSync(path.join(outDir, 'eps_rcd_open.png'), Buffer.from(shot.data, 'base64'));
        console.log('Captured evidence screenshot: evidence/step8/eps_rcd_open.png');
      }

      // 3. Check fspd_mcb label/title
      // Trigger SLD init by clicking openBtn or calling directly
      const fspdCheck = await evaluate(`(() => {
        const btnSld = document.getElementById('btn-open-sld');
        if (btnSld) btnSld.click();
        const sldEl = document.getElementById('sld-fspd-mcb');
        const sldTitle = sldEl?.getAttribute('title');

        const obj3d = window.sceneInstance?.interactiveObjects?.find(o => o.userData?.id === 'spd_backup_mcb');
        const obj3dTitle = obj3d?.userData?.title;

        return {
          sldTitle,
          obj3dTitle
        };
      })()`);

      console.log('\n=== 3. fspd_mcb Honesty Titles ===');
      console.log(JSON.stringify(fspdCheck, null, 2));

      console.log('\n=== Console Health ===');
      console.log('Exceptions count:', exceptions.length);
      if (exceptions.length > 0) {
        exceptions.forEach(e => console.error(' - ' + e.text));
      }

      ws.close();
      chrome.kill();

      const passInitial = parseInt(initialData.hudEpsP, 10) === 1500 && initialData.epsTelemetry?.p === 1500;
      const passRcdOpen = parseInt(rcdOpenData.hudEpsP, 10) === 0 && rcdOpenData.epsTelemetry?.p === 0 && rcdOpenData.epsTelemetry?.v === 0;
      const passFspdTitle = fspdCheck.sldTitle === 'نمایشی — در مدل شبیه‌سازی نشده' && fspdCheck.obj3dTitle === 'نمایشی — در مدل شبیه‌سازی نشده';

      console.log('\n=== Verification Summary ===');
      console.log(`Initial EPS powered (1500 W): ${passInitial ? 'PASS' : 'FAIL'}`);
      console.log(`RCD open drops EPS to 0 W and 0 V: ${passRcdOpen ? 'PASS' : 'FAIL'}`);
      console.log(`fspd_mcb has illustrative title: ${passFspdTitle ? 'PASS' : 'FAIL'}`);

      const overall = passInitial && passRcdOpen && passFspdTitle && exceptions.length === 0;
      console.log(`\nOverall Verdict: ${overall ? 'ALL STEP 8 VERIFICATIONS PASSED! ✓' : 'FAILED ✗'}`);
      process.exit(overall ? 0 : 1);
    };
  } catch (err) {
    console.error('Test execution failed:', err);
    chrome.kill();
    process.exit(1);
  }
}, 2000);
