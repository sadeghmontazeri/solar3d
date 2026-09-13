const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const htmlUrl = 'file:///C:/Users/11/Desktop/PC/shahrivar/solar-app/APP/17/index.html';
const tempProfile = 'C:\\Users\\11\\AppData\\Local\\Temp\\chrome-step6-profile-' + Date.now();

const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9227',
  '--window-size=1920,1080',
  '--user-data-dir=' + tempProfile,
  htmlUrl
]);

console.log('Spawned Chrome for Step 6 verification on port 9227...');

setTimeout(async () => {
  try {
    const res = await fetch('http://127.0.0.1:9227/json');
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

      // Wait 3 seconds for initial load
      await new Promise(r => setTimeout(r, 3000));

      const evaluate = async (expr) => {
        const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
        return r?.result?.value;
      };

      console.log('=== TEST 1: SBY Dial Click in 3D (Invalid Input Guard) ===');
      const test1 = await evaluate(`(() => {
        const sw = window.sceneInstance?.switchgear?.['sby_switch'];
        const beforeState = String(sw?.state);

        // Click the 3D switch directly (simulates raycaster toggleBreaker3D)
        window.sceneInstance.toggleBreaker3D('sby_switch');

        const afterState = String(sw?.state);

        // Verify normal valid transitions still work
        window.sceneInstance.setSbyPosition3D('0');
        const state0 = String(sw?.state);

        window.sceneInstance.setSbyPosition3D('II');
        const stateII = String(sw?.state);

        window.sceneInstance.setSbyPosition3D('I');
        const stateI = String(sw?.state);

        return {
          beforeState,
          afterState,
          guardPreservedState: (beforeState === afterState),
          normalTransitions: { state0, stateII, stateI }
        };
      })()`);
      console.log('Test 1 Results:', JSON.stringify(test1, null, 2));

      console.log('\n=== TEST 2: Rapid SBY Transfer Cancellation (Stale Callback Invalidation) ===');
      // Sequence: I -> II -> (within 20ms < 80ms BBM timeout) -> 0
      const test2 = await evaluate(`(async () => {
        // 1. Ensure starting at I
        window.AppOrchestrator.onSbyStateChanged('I');
        await new Promise(r => setTimeout(r, 100));

        // 2. Trigger I -> II (schedules 80ms BBM transition)
        window.AppOrchestrator.onSbyStateChanged('II');

        // 3. Within 20ms, user issues 0
        await new Promise(r => setTimeout(r, 20));
        window.AppOrchestrator.onSbyStateChanged('0');

        // 4. Wait 200ms for all timeouts (including the 80ms) to elapse
        await new Promise(r => setTimeout(r, 200));

        const final3dState = String(window.sceneInstance?.switchgear?.['sby_switch']?.state);

        return {
          final3dState,
          cancelledStaleTransfer: (final3dState === '0')
        };
      })()`);
      console.log('Test 2 Results:', JSON.stringify(test2, null, 2));

      console.log('\n=== CONSOLE WARNINGS CHECK ===');
      const sbyWarnings = consoleMessages.filter(m => m.text && m.text.includes('setSbyPosition3D: invalid position'));
      console.log('SBY invalid position warnings captured:', sbyWarnings.length);
      sbyWarnings.forEach(w => console.log(' - ' + w.text));

      console.log('Exceptions thrown count:', exceptions.length);

      ws.close();
      chrome.kill();

      const pass = test1.guardPreservedState &&
                   test1.afterState === 'I' &&
                   test1.normalTransitions.state0 === '0' &&
                   test1.normalTransitions.stateII === 'II' &&
                   test1.normalTransitions.stateI === 'I' &&
                   test2.final3dState === '0' &&
                   sbyWarnings.length > 0 &&
                   exceptions.length === 0;

      console.log(`\nOverall Verdict: ${pass ? 'ALL CHECKS PASSED!' : 'FAILED'}`);
      process.exit(pass ? 0 : 1);
    };
  } catch (err) {
    console.error('Test execution failed:', err);
    chrome.kill();
    process.exit(1);
  }
}, 2000);
