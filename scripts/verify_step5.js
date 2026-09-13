const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const htmlUrl = 'file:///C:/Users/11/Desktop/PC/shahrivar/solar-app/APP/17/index.html';
const tempProfile = 'C:\\Users\\11\\AppData\\Local\\Temp\\chrome-step5-profile-' + Date.now();

const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9226',
  '--window-size=1920,1080',
  '--user-data-dir=' + tempProfile,
  htmlUrl
]);

console.log('Spawned Chrome for Step 5 verification on port 9226...');

setTimeout(async () => {
  try {
    const res = await fetch('http://127.0.0.1:9226/json');
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

      // Wait 3 seconds for initial scene load
      await new Promise(r => setTimeout(r, 3000));

      const evaluate = async (expr) => {
        const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
        return r?.result?.value;
      };

      console.log('=== TEST 1: Click Front View (btn-camera-front) ===');
      const beforeCamPos = await evaluate(`({ x: window.sceneInstance.camera.position.x, y: window.sceneInstance.camera.position.y, z: window.sceneInstance.camera.position.z })`);
      console.log('Camera pos before:', beforeCamPos);

      const clickFrontResult = await evaluate(`(() => {
        const btn = document.getElementById('btn-camera-front');
        if (!btn) return 'btn-camera-front not found';
        btn.click();
        return {
          transitionActive: window.sceneInstance.cameraTransition.active,
          targetPos: window.sceneInstance.cameraTransition.targetPos,
          targetLookAt: window.sceneInstance.cameraTransition.targetLookAt,
          duration: window.sceneInstance.cameraTransition.duration
        };
      })()`);
      console.log('Front View click result:', JSON.stringify(clickFrontResult, null, 2));

      // Wait 1.2s for transition to complete
      await new Promise(r => setTimeout(r, 1200));
      const afterCamPos = await evaluate(`({ x: +window.sceneInstance.camera.position.x.toFixed(2), y: +window.sceneInstance.camera.position.y.toFixed(2), z: +window.sceneInstance.camera.position.z.toFixed(2) })`);
      console.log('Camera pos after transition:', afterCamPos);

      console.log('\n=== TEST 2: Click the other 5 buttons without data-viewpoint ===');
      const otherButtons = [
        'btn-camera-reset',
        'btn-toggle-enclosure-shell',
        'btn-toggle-dc-door',
        'btn-toggle-mdb-door',
        'btn-toggle-eps-door'
      ];
      for (const bId of otherButtons) {
        const res = await evaluate(`(() => {
          const btn = document.getElementById('${bId}');
          if (!btn) return 'not found';
          btn.click();
          return 'clicked';
        })()`);
        console.log(` - Button #${bId}: ${res}`);
        await new Promise(r => setTimeout(r, 100));
      }

      console.log('\n=== TEST 3: Click a real viewpoint preset (pv / آرایه خورشیدی) ===');
      const realPresetResult = await evaluate(`(() => {
        const btn = document.querySelector('.btn-viewpoint[data-viewpoint="pv"]');
        if (!btn) return 'pv button not found';
        btn.click();
        return {
          preset: 'pv',
          transitionActive: window.sceneInstance.cameraTransition.active,
          targetPos: window.sceneInstance.cameraTransition.targetPos
        };
      })()`);
      console.log('Real preset click result:', JSON.stringify(realPresetResult, null, 2));
      await new Promise(r => setTimeout(r, 1200));

      console.log('\n=== VERIFICATION RESULTS ===');
      const unknownPresetWarnings = consoleMessages.filter(m => m.text && m.text.includes('Unknown camera preset'));
      console.log(`Unknown camera preset warnings count: ${unknownPresetWarnings.length}`);
      if (unknownPresetWarnings.length > 0) {
        unknownPresetWarnings.forEach(w => console.warn(' - ' + w.text));
      }

      console.log(`Total console exceptions thrown: ${exceptions.length}`);
      if (exceptions.length > 0) {
        exceptions.forEach(e => console.error(' - [' + e.lineNumber + ':' + e.columnNumber + '] ' + e.text + ' ' + (e.exception?.description || '')));
      }

      ws.close();
      chrome.kill();

      const pass = exceptions.length === 0 && unknownPresetWarnings.length === 0;
      console.log(`\nOverall Verdict: ${pass ? 'ALL CHECKS PASSED!' : 'FAILED'}`);
      process.exit(pass ? 0 : 1);
    };
  } catch (err) {
    console.error('Test execution failed:', err);
    chrome.kill();
    process.exit(1);
  }
}, 2000);
