const { spawn } = require('child_process');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const htmlUrl = 'file:///C:/Users/11/Desktop/PC/shahrivar/solar-app/APP/17/index.html';
const tempProfile = 'C:\\Users\\11\\AppData\\Local\\Temp\\chrome-smoke-profile-1b-' + Date.now();

const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9223',
  '--window-size=1920,1080',
  '--user-data-dir=' + tempProfile,
  htmlUrl
]);

console.log('Spawned Chrome for Step 1b on port 9223...');

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

    ws.onmessage = (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.id && callbacks.has(msg.id)) {
        const cb = callbacks.get(msg.id);
        callbacks.delete(msg.id);
        cb(msg.result);
      }
    };

    ws.onopen = async () => {
      console.log('Connected to Chrome DevTools WebSocket for Step 1b.');
      await send('Page.enable');
      await send('Runtime.enable');

      // Wait 3 seconds for initial load
      await new Promise(r => setTimeout(r, 3000));

      // 1. RCD Check on CLEAN page load
      const rcdCleanCheck = await send('Runtime.evaluate', {
        expression: `(function() {
          const before = {
            sbyState: String(window.state?.sbyPosition),
            hudEpsP: document.getElementById('hud-eps-p')?.textContent?.trim(),
            epsIsPowered: String(window.state?.telemetry?.eps?.isPowered),
            epsWatts: String(window.state?.telemetry?.eps?.p),
            rcdBreakerState: String(window.state?.breakers?.eps_rcd)
          };

          // Open the RCD switch via orchestrator
          window.AppOrchestrator?.onBreakerStateChanged('eps_rcd', false, 'user');

          const after = {
            sbyState: String(window.state?.sbyPosition),
            hudEpsP: document.getElementById('hud-eps-p')?.textContent?.trim(),
            epsIsPowered: String(window.state?.telemetry?.eps?.isPowered),
            epsWatts: String(window.state?.telemetry?.eps?.p),
            rcdBreakerState: String(window.state?.breakers?.eps_rcd)
          };

          return { before, after };
        })()`,
        returnByValue: true
      });
      console.log('=== STEP 1b: RCD Check on Clean Load ===', JSON.stringify(rcdCleanCheck?.result?.value, null, 2));

      // 2. SOC Drift check measuring unrounded float and over time
      const socT0 = await send('Runtime.evaluate', {
        expression: `({
          time_s: 0,
          rawFloatSOC: window.state?.batterySOC,
          hudSocText: document.getElementById('hud-bat-soc')?.textContent?.trim(),
          sliderValue: document.getElementById('slider-soc')?.value,
          batPowerWatts: window.state?.telemetry?.battery?.p
        })`,
        returnByValue: true
      });

      // Wait 15 seconds to observe exact float integration
      await new Promise(r => setTimeout(r, 15000));

      const socT15 = await send('Runtime.evaluate', {
        expression: `({
          time_s: 15,
          rawFloatSOC: window.state?.batterySOC,
          hudSocText: document.getElementById('hud-bat-soc')?.textContent?.trim(),
          sliderValue: document.getElementById('slider-soc')?.value,
          batPowerWatts: window.state?.telemetry?.battery?.p,
          floatDelta: window.state?.batterySOC - ${socT0.result.value.rawFloatSOC}
        })`,
        returnByValue: true
      });
      console.log('=== STEP 1b: SOC Drift t=0s ===', JSON.stringify(socT0?.result?.value, null, 2));
      console.log('=== STEP 1b: SOC Drift t=15s ===', JSON.stringify(socT15?.result?.value, null, 2));

      // 3. Re-probe SBY click with String() preservation
      const sbyProbeString = await send('Runtime.evaluate', {
        expression: `(function() {
          const before = {
            stateSby: String(window.state?.sbyPosition),
            switchgearSby: String(window.sceneInstance?.switchgear['sby_switch']?.state)
          };
          try {
            window.sceneInstance.toggleBreaker3D('sby_switch');
          } catch(e) {
            return { before, error: e.message };
          }
          const after = {
            stateSby: String(window.state?.sbyPosition),
            switchgearSby: String(window.sceneInstance?.switchgear['sby_switch']?.state)
          };
          return { before, after };
        })()`,
        returnByValue: true
      });
      console.log('=== STEP 1b: SBY Click Probe (Stringified) ===', JSON.stringify(sbyProbeString?.result?.value, null, 2));

      // Save Step 1b evidence
      fs.writeFileSync('evidence/step1/step1b_evidence.json', JSON.stringify({
        rcdCleanCheck: rcdCleanCheck?.result?.value,
        socT0: socT0?.result?.value,
        socT15: socT15?.result?.value,
        sbyProbeString: sbyProbeString?.result?.value
      }, null, 2));

      ws.close();
      chrome.kill();
      process.exit(0);
    };
  } catch(err) {
    console.error('Step 1b error:', err);
    chrome.kill();
    process.exit(1);
  }
}, 2000);
