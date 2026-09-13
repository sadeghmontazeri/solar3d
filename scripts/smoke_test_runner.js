const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const htmlUrl = 'file:///C:/Users/11/Desktop/PC/shahrivar/solar-app/APP/17/index.html';
const tempProfile = 'C:\\Users\\11\\AppData\\Local\\Temp\\chrome-smoke-profile-' + Date.now();

const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9222',
  '--window-size=1920,1080',
  '--user-data-dir=' + tempProfile,
  htmlUrl
]);

console.log('Spawned Chrome with remote debugging on port 9222...');

setTimeout(async () => {
  try {
    const res = await fetch('http://127.0.0.1:9222/json');
    const tabs = await res.json();
    console.log('Tabs found:', tabs.length);
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

    const consoleLogs = [];
    const networkRequests = [];
    const exceptions = [];

    ws.onmessage = (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.id && callbacks.has(msg.id)) {
        const cb = callbacks.get(msg.id);
        callbacks.delete(msg.id);
        cb(msg.result);
      }
      if (msg.method === 'Console.messageAdded') {
        consoleLogs.push(msg.params.message);
      }
      if (msg.method === 'Runtime.consoleAPICalled') {
        const text = msg.params.args.map(a => a.value ?? a.description ?? JSON.stringify(a)).join(' ');
        consoleLogs.push({ type: msg.params.type, text });
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        exceptions.push(msg.params.exceptionDetails);
      }
      if (msg.method === 'Network.requestWillBeSent') {
        networkRequests.push(msg.params.request.url);
      }
    };

    ws.onopen = async () => {
      console.log('Connected to Chrome DevTools WebSocket.');
      await send('Page.enable');
      await send('Runtime.enable');
      await send('Console.enable');
      await send('Network.enable');

      // Wait 3 seconds for initial scene load
      await new Promise(r => setTimeout(r, 3000));

      // 1. Page load check
      const loadCheck = await send('Runtime.evaluate', {
        expression: `({
          title: document.title,
          canvasPresent: !!document.querySelector('canvas'),
          canvasWidth: document.querySelector('canvas')?.width,
          canvasHeight: document.querySelector('canvas')?.height,
          hasSceneInstance: !!window.sceneInstance,
          sceneChildrenCount: window.sceneInstance?.scene?.children?.length,
          glRenderer: (function() {
            try {
              const c = document.querySelector('canvas');
              const gl = c.getContext('webgl') || c.getContext('experimental-webgl');
              const ext = gl?.getExtension('WEBGL_debug_renderer_info');
              return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : 'unknown';
            } catch(e) { return e.message; }
          })()
        })`,
        returnByValue: true
      });
      console.log('=== CHECK 1: Page Load & WebGL ===', JSON.stringify(loadCheck?.result?.value, null, 2));

      // 2. Grid Telemetry Badge
      const gridBadge = await send('Runtime.evaluate', {
        expression: `({
          hudGridP: document.getElementById('hud-grid-p')?.textContent?.trim(),
          hudGridUnit: document.getElementById('hud-grid-p')?.parentElement?.querySelector('.unit')?.textContent?.trim(),
          stateGridP: window.state?.telemetry?.grid?.p
        })`,
        returnByValue: true
      });
      console.log('=== CHECK 2: Grid Telemetry Badge ===', JSON.stringify(gridBadge?.result?.value, null, 2));

      // 3. Battery SOC Badge vs Slider drift over 10 seconds
      const socInitial = await send('Runtime.evaluate', {
        expression: `({
          hudSoc: document.getElementById('hud-bat-soc')?.textContent?.trim(),
          sliderVal: document.getElementById('slider-soc')?.value,
          labelVal: document.getElementById('val-soc')?.textContent?.trim(),
          stateSOC: window.state?.batterySOC
        })`,
        returnByValue: true
      });
      console.log('=== CHECK 3 (t=0s): Battery SOC Initial ===', JSON.stringify(socInitial?.result?.value, null, 2));

      await new Promise(r => setTimeout(r, 10000));
      const socAfter10s = await send('Runtime.evaluate', {
        expression: `({
          hudSoc: document.getElementById('hud-bat-soc')?.textContent?.trim(),
          sliderVal: document.getElementById('slider-soc')?.value,
          labelVal: document.getElementById('val-soc')?.textContent?.trim(),
          stateSOC: window.state?.batterySOC
        })`,
        returnByValue: true
      });
      console.log('=== CHECK 3 (t=10s): Battery SOC After 10s ===', JSON.stringify(socAfter10s?.result?.value, null, 2));

      // Screenshot 1: Default View
      const shot1 = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync('evidence/step1/default_view.png', Buffer.from(shot1.data, 'base64'));
      console.log('Saved evidence/step1/default_view.png');

      // 4. Click Front View button
      const frontViewClick = await send('Runtime.evaluate', {
        expression: `(function() {
          const btn = document.getElementById('btn-camera-front');
          try {
            btn.click();
            return { clicked: true, error: null };
          } catch(err) {
            return { clicked: true, error: err.message, stack: err.stack };
          }
        })()`,
        returnByValue: true
      });
      console.log('=== CHECK 4: Front View Click Result ===', JSON.stringify(frontViewClick?.result?.value, null, 2));

      // 5. Click SBY switch dial in 3D
      const sbyClick = await send('Runtime.evaluate', {
        expression: `(function() {
          const sbyBefore = {
            stateSby: window.state?.sbyPosition,
            switchgearSby: window.sceneInstance?.switchgear['sby_switch']?.state
          };
          try {
            window.sceneInstance.toggleBreaker3D('sby_switch');
          } catch(e) {
            return { before: sbyBefore, error: e.message };
          }
          const sbyAfter = {
            stateSby: window.state?.sbyPosition,
            switchgearSby: window.sceneInstance?.switchgear['sby_switch']?.state
          };
          return { before: sbyBefore, after: sbyAfter };
        })()`,
        returnByValue: true
      });
      console.log('=== CHECK 5: SBY Click in 3D ===', JSON.stringify(sbyClick?.result?.value, null, 2));

      // 6. Open RCD switch (eps_rcd)
      const rcdToggle = await send('Runtime.evaluate', {
        expression: `(function() {
          const epsBefore = {
            hudEpsP: document.getElementById('hud-eps-p')?.textContent?.trim(),
            epsTelemetry: JSON.parse(JSON.stringify(window.state?.telemetry?.eps || {}))
          };
          window.AppOrchestrator?.onBreakerStateChanged('eps_rcd', false, 'user');
          const epsAfter = {
            hudEpsP: document.getElementById('hud-eps-p')?.textContent?.trim(),
            epsTelemetry: JSON.parse(JSON.stringify(window.state?.telemetry?.eps || {}))
          };
          return { before: epsBefore, after: epsAfter };
        })()`,
        returnByValue: true
      });
      console.log('=== CHECK 6: RCD Switch Open ===', JSON.stringify(rcdToggle?.result?.value, null, 2));

      // 7. Click 8 bottom filter buttons
      const filterClick = await send('Runtime.evaluate', {
        expression: `(function() {
          const buttons = Array.from(document.querySelectorAll('.flow-filter-btn'));
          const results = [];
          buttons.forEach(btn => {
            const filter = btn.getAttribute('data-filter');
            btn.click();
            results.push({
              filter,
              sldFilter: window.state?.currentFilter,
              particlesCount: window.sceneInstance?.animatedParticles?.length
            });
          });
          return results;
        })()`,
        returnByValue: true
      });
      console.log('=== CHECK 7: 8 Filter Buttons Clicked ===', JSON.stringify(filterClick?.result?.value, null, 2));

      // Open Cabinet Doors and take Screenshot 2: Opened Cabinet
      await send('Runtime.evaluate', {
        expression: `(function() {
          document.getElementById('btn-toggle-dc-door')?.click();
          document.getElementById('btn-toggle-mdb-door')?.click();
          document.getElementById('btn-toggle-eps-door')?.click();
        })()`
      });
      await new Promise(r => setTimeout(r, 1000));
      const shot2 = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync('evidence/step1/opened_cabinet.png', Buffer.from(shot2.data, 'base64'));
      console.log('Saved evidence/step1/opened_cabinet.png');

      // Screenshot 3: Console and HUD
      const shot3 = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync('evidence/step1/console_and_hud.png', Buffer.from(shot3.data, 'base64'));
      console.log('Saved evidence/step1/console_and_hud.png');

      // 8. Network requests summary
      console.log('=== CHECK 8: Network Requests ===', JSON.stringify(networkRequests, null, 2));
      console.log('=== CONSOLE LOGS ===', JSON.stringify(consoleLogs, null, 2));
      console.log('=== EXCEPTIONS THROWN ===', JSON.stringify(exceptions, null, 2));

      // Write full raw evidence to evidence/step1/raw_evidence.json
      fs.writeFileSync('evidence/step1/raw_evidence.json', JSON.stringify({
        loadCheck: loadCheck?.result?.value,
        gridBadge: gridBadge?.result?.value,
        socInitial: socInitial?.result?.value,
        socAfter10s: socAfter10s?.result?.value,
        frontViewClick: frontViewClick?.result?.value,
        sbyClick: sbyClick?.result?.value,
        rcdToggle: rcdToggle?.result?.value,
        filterClick: filterClick?.result?.value,
        networkRequests,
        consoleLogs,
        exceptions
      }, null, 2));

      console.log('All smoke test checks completed successfully!');
      ws.close();
      chrome.kill();
      process.exit(0);
    };
  } catch(err) {
    console.error('Smoke test runner error:', err);
    chrome.kill();
    process.exit(1);
  }
}, 2000);
