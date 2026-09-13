const { spawn } = require('child_process');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const htmlUrl = process.argv[2] || 'file:///C:/Users/11/Desktop/PC/shahrivar/solar-app/APP/17/index.html';
const tempProfile = 'C:\\Users\\11\\AppData\\Local\\Temp\\chrome-step7b-profile-' + Date.now();

const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9229',
  '--window-size=1920,1080',
  '--user-data-dir=' + tempProfile,
  htmlUrl
]);

console.log('Spawned Chrome for Step 7b verification on port 9229...');

setTimeout(async () => {
  try {
    const res = await fetch('http://127.0.0.1:9229/json');
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
        const ready = await evaluate(`!!(window.sceneInstance?.animatedParticles?.length > 0 && window.AppOrchestrator?.getState)`);
        if (ready) break;
        await new Promise(r => setTimeout(r, 500));
      }

      // Hook updatePowerFlows to capture incoming watts
      await evaluate(`(() => {
        if (window.sceneInstance && !window.sceneInstance._hookedFlows) {
          window.sceneInstance._hookedFlows = true;
          window.sceneInstance.lastFlows = {};
          const orig = window.sceneInstance.updatePowerFlows.bind(window.sceneInstance);
          window.sceneInstance.updatePowerFlows = function(flows) {
            window.sceneInstance.lastFlows = flows;
            return orig(flows);
          };
        }
      })()`);

      // Wait 500ms for at least one simulation tick
      await new Promise(r => setTimeout(r, 500));

      // 1. Check defaults scenario
      const defaultsData = await evaluate(`(() => {
        const pInvGrid = window.sceneInstance.animatedParticles.find(p => p.id === 'inv_grid');
        const pBat = window.sceneInstance.animatedParticles.find(p => p.id === 'battery');
        const flows = window.sceneInstance.lastFlows || {};
        const state = window.AppOrchestrator.getState();
        return {
          inv_grid: {
            active: pInvGrid?.active,
            direction: pInvGrid?.direction,
            watts: flows.inv_grid?.watts,
            speed: pInvGrid?.speed
          },
          battery: {
            active: pBat?.active,
            direction: pBat?.direction,
            watts: flows.battery?.watts,
            speed: pBat?.speed
          },
          telemetry: {
            batP: state.telemetry?.battery?.p,
            gridP: state.telemetry?.grid?.p,
            loadP: state.telemetry?.load?.p
          }
        };
      })()`);

      console.log('=== 1. Defaults Scenario ===');
      console.log(JSON.stringify(defaultsData, null, 2));

      // Capture screenshot of defaults particle flow
      const fs = require('fs');
      const shot = await send('Page.captureScreenshot', { format: 'png' });
      if (shot?.data) {
        const outDir = path.join(__dirname, '..', 'evidence', 'step7b');
        if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
        fs.writeFileSync(path.join(outDir, 'step7b_particle_flows.png'), Buffer.from(shot.data, 'base64'));
        console.log('Captured evidence screenshot: evidence/step7b/step7b_particle_flows.png');
      }

      // 2. Switch to evening_peak
      await evaluate(`(() => {
        const btn = document.querySelector('.mode-btn[data-mode="evening_peak"]');
        if (btn) btn.click();
      })()`);

      await new Promise(r => setTimeout(r, 1000));

      const eveningData = await evaluate(`(() => {
        const pBat = window.sceneInstance.animatedParticles.find(p => p.id === 'battery');
        const flows = window.sceneInstance.lastFlows || {};
        const state = window.AppOrchestrator.getState();
        return {
          battery: {
            active: pBat?.active,
            direction: pBat?.direction,
            watts: flows.battery?.watts,
            speed: pBat?.speed
          },
          telemetry: {
            batP: state.telemetry.battery.p,
            gridP: state.telemetry.grid.p
          }
        };
      })()`);

      console.log('=== 2. Evening Peak Scenario ===');
      console.log(JSON.stringify(eveningData, null, 2));

      // 3. Reset to normal_day and open QG
      await evaluate(`(() => {
        const btn = document.querySelector('.mode-btn[data-mode="normal_day"]');
        if (btn) btn.click();
        window.AppOrchestrator.onBreakerStateChanged('qg_mcb', false);
        window.AppOrchestrator.onBreakerStateChanged('q0_mcb', false);
      })()`);

      await new Promise(r => setTimeout(r, 1000));

      const qgOpenData = await evaluate(`(() => {
        const pInvGrid = window.sceneInstance.animatedParticles.find(p => p.id === 'inv_grid');
        const flows = window.sceneInstance.lastFlows || {};
        const state = window.AppOrchestrator.getState();
        return {
          inv_grid: {
            active: pInvGrid?.active,
            direction: pInvGrid?.direction,
            watts: flows.inv_grid?.watts,
            speed: pInvGrid?.speed
          },
          telemetry: {
            gridP: state.telemetry.grid.p
          }
        };
      })()`);

      console.log('=== 3. QG Open Scenario ===');
      console.log(JSON.stringify(qgOpenData, null, 2));

      console.log('\\n=== Console Health ===');
      console.log('Exceptions count:', exceptions.length);
      if (exceptions.length > 0) {
        exceptions.forEach(e => console.error(' - ' + e.text));
      }

      ws.close();
      chrome.kill();

      const passDefaultsInv = defaultsData.inv_grid.active === true && defaultsData.inv_grid.direction === 1;
      const passDefaultsBat = defaultsData.battery.active === true && defaultsData.battery.direction === -1;
      const passEveningBat = eveningData.battery.active === true && eveningData.battery.direction === 1;
      const passQgOpen = qgOpenData.inv_grid.active === false;

      console.log('\\n=== Verification Summary ===');
      console.log('defaults inv_grid forward (+1): ' + (passDefaultsInv ? 'PASS' : 'FAIL'));
      console.log('defaults battery reverse (-1): ' + (passDefaultsBat ? 'PASS' : 'FAIL'));
      console.log('evening_peak battery forward (+1): ' + (passEveningBat ? 'PASS' : 'FAIL'));
      console.log('qg_open inv_grid inactive (false): ' + (passQgOpen ? 'PASS' : 'FAIL'));

      const overall = passDefaultsInv && passDefaultsBat && passEveningBat && passQgOpen && exceptions.length === 0;
      console.log('\\nOverall Verdict: ' + (overall ? 'ALL STEP 7b TESTS PASSED! ✓' : 'FAILED ✗'));
      process.exit(overall ? 0 : 1);
    };
  } catch (err) {
    console.error('Test execution failed:', err);
    chrome.kill();
    process.exit(1);
  }
}, 2000);
