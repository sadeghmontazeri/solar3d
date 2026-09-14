/**
 * scripts/verify_step9.js
 * Automated browser verification test suite for Step 9:
 * 1. Decoupling 3D selection from operation (plain 3D clicks select and open drawer without toggling state).
 * 2. Operating breakers via the drawer's explicit action button (#drawer-op-container button) and animating 3D levers.
 * 3. Suppressing drag/orbit gestures (> 20px) so accidental panning never toggles switches or triggers selection.
 * 4. SBY rotary dial safety (clicking in 3D selects only; state remains valid 'I'; changes only via I / 0 / II controls).
 * 5. Screenshot evidence saved to evidence/step9/step9_interaction_safety.png.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const defaultHtmlUrl = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');
const htmlUrl = process.argv[2] || defaultHtmlUrl;
const port = 9235;
const tempProfile = path.join(process.env.TEMP || 'C:\\Windows\\Temp', 'chrome-step9-profile-' + Date.now());

const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=' + port,
  '--window-size=1920,1080',
  '--user-data-dir=' + tempProfile,
  htmlUrl
]);

console.log('[Step 9 CDP Verification] Spawning Chrome headless on port ' + port + '...');

const timeoutId = setTimeout(async () => {
  try {
    let tab = null;
    for (let retry = 0; retry < 25; retry++) {
      try {
        const res = await fetch('http://127.0.0.1:' + port + '/json');
        const tabs = await res.json();
        tab = tabs.find(t => t.url.includes('index.html') || t.url.startsWith('file://'));
        if (tab) break;
      } catch (e) {
        await new Promise(r => setTimeout(r, 400));
      }
    }

    if (!tab) {
      console.error('Target tab not found on port ' + port);
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
        const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
        if (r?.exceptionDetails) {
          console.error('Eval Exception:', r.exceptionDetails);
        }
        return r?.result?.value;
      };

      console.log('Waiting for AppOrchestrator and 3D scene ready state...');
      for (let i = 0; i < 40; i++) {
        const ready = await evaluate('!!(window.sceneInstance?.interactiveObjects?.length > 0 && window.AppOrchestrator?.getState)');
        if (ready) break;
        await new Promise(r => setTimeout(r, 500));
      }

      console.log('App and 3D Scene fully ready. Running 4 verification checks...\n');

      // =============================================================
      // CHECK 1: Click 3D breakers (q0_mcb, qo_mcb, qpv_isolator, eps_rcd)
      // Assert switch state DOES NOT toggle on plain 3D click, but drawer opens with class 'open'.
      // =============================================================
      console.log('=== CHECK 1: Click 3D Breakers (Selection Only, No State Toggle) ===');
      const check1Results = await evaluate(`(async () => {
        const drawer = document.getElementById('inspector-drawer');
        const breakersToTest = [
          { targetId: 'q0_mcb', aliases: ['grid_mcb', 'grid_incomer_mcb', 'q0_mcb'], name: 'Q0 MCB (Grid Main)' },
          { targetId: 'qo_mcb', aliases: ['eps_incomer_mcb', 'qo_mcb'], name: 'QO MCB (EPS Incomer)' },
          { targetId: 'qpv_isolator', aliases: ['dc_iso_1', 'dc_isolator', 'qpv_isolator'], name: 'QPV Isolator (DC)' },
          { targetId: 'eps_rcd', aliases: ['crit_rcbo_1', 'eps_rcd', 'rcd'], name: 'EPS RCD' }
        ];

        const results = [];

        for (const item of breakersToTest) {
          if (drawer) drawer.classList.remove('open');
          await new Promise(r => setTimeout(r, 60));

          const obj3d = window.sceneInstance.interactiveObjects.find(o => 
            item.aliases.includes(o.userData?.id) || item.aliases.includes(o.userData?.componentId)
          );

          if (!obj3d) {
            results.push({
              targetId: item.targetId,
              name: item.name,
              found3d: false,
              passed: false,
              error: '3D object not found in interactiveObjects'
            });
            continue;
          }

          const stateBefore = window.AppOrchestrator.getState().breakers[item.targetId] ??
                              window.AppOrchestrator.getState().breakers[item.aliases[0]];
          const swBefore = window.sceneInstance.switchgear[item.targetId] ||
                           window.sceneInstance.switchgear[item.aliases[0]] ||
                           window.sceneInstance.switchgear[obj3d.userData?.id];
          const angleBefore = swBefore?.currentAngle ?? swBefore?.targetAngle;

          // Dispatch 3D click on the object
          window.sceneInstance.hoveredObject = obj3d;
          const canvas = window.sceneInstance.renderer.domElement;
          canvas.dispatchEvent(new PointerEvent('pointerdown', { clientX: 200, clientY: 200, bubbles: true }));
          canvas.dispatchEvent(new MouseEvent('click', { clientX: 200, clientY: 200, bubbles: true }));
          await new Promise(r => setTimeout(r, 100));

          const stateAfter = window.AppOrchestrator.getState().breakers[item.targetId] ??
                             window.AppOrchestrator.getState().breakers[item.aliases[0]];
          const swAfter = window.sceneInstance.switchgear[item.targetId] ||
                          window.sceneInstance.switchgear[item.aliases[0]] ||
                          window.sceneInstance.switchgear[obj3d.userData?.id];
          const angleAfter = swAfter?.currentAngle ?? swAfter?.targetAngle;
          const drawerOpen = drawer?.classList.contains('open');

          const didNotToggle = (stateBefore === stateAfter) && (Math.abs(angleBefore - angleAfter) < 0.005);
          const drawerOpened = !!drawerOpen;

          results.push({
            targetId: item.targetId,
            name: item.name,
            objId: obj3d.userData?.id,
            stateBefore,
            stateAfter,
            angleBefore,
            angleAfter,
            didNotToggle,
            drawerOpened,
            passed: didNotToggle && drawerOpened
          });
        }

        return results;
      })()`);
      console.log(JSON.stringify(check1Results, null, 2));

      // =============================================================
      // CHECK 2: Press the drawer's action button (#drawer-op-container button)
      // Assert breaker toggles state, and 3D lever animates.
      // =============================================================
      console.log('\n=== CHECK 2: Press Drawer Action Button (Toggles State & Animates Lever) ===');
      const check2Results = await evaluate(`(async () => {
        const drawer = document.getElementById('inspector-drawer');
        const opContainer = document.getElementById('drawer-op-container');

        const testTargets = [
          { targetId: 'q0_mcb', aliases: ['grid_mcb', 'grid_incomer_mcb', 'q0_mcb'], name: 'Q0 MCB' },
          { targetId: 'qo_mcb', aliases: ['eps_incomer_mcb', 'qo_mcb'], name: 'QO MCB' },
          { targetId: 'qpv_isolator', aliases: ['dc_iso_1', 'dc_isolator', 'qpv_isolator'], name: 'QPV Isolator' },
          { targetId: 'eps_rcd', aliases: ['crit_rcbo_1', 'eps_rcd'], name: 'EPS RCD' }
        ];

        const results = [];

        for (const testTarget of testTargets) {
          // 1. Select object in 3D to open drawer and render operation button
          const obj3d = window.sceneInstance.interactiveObjects.find(o => 
            testTarget.aliases.includes(o.userData?.id)
          );
          if (!obj3d) {
            results.push({ targetId: testTarget.targetId, passed: false, error: '3D object not found' });
            continue;
          }

          window.sceneInstance.hoveredObject = obj3d;
          const canvas = window.sceneInstance.renderer.domElement;
          canvas.dispatchEvent(new PointerEvent('pointerdown', { clientX: 200, clientY: 200, bubbles: true }));
          canvas.dispatchEvent(new MouseEvent('click', { clientX: 200, clientY: 200, bubbles: true }));
          await new Promise(r => setTimeout(r, 120));

          const opBtn = opContainer?.querySelector('button') || opContainer?.querySelector('.btn-drawer-operate');
          if (!opBtn) {
            results.push({
              targetId: testTarget.targetId,
              passed: false,
              error: 'No button found in #drawer-op-container'
            });
            continue;
          }

          const swKey = window.sceneInstance.switchgear[testTarget.targetId] ? testTarget.targetId : testTarget.aliases[0];
          const stateBefore = window.AppOrchestrator.getState().breakers[testTarget.targetId] ??
                              window.AppOrchestrator.getState().breakers[testTarget.aliases[0]];
          const targetAngleBefore = window.sceneInstance.switchgear[swKey]?.targetAngle;

          // Press the drawer's action button
          opBtn.click();
          await new Promise(r => setTimeout(r, 150));

          const stateAfterToggle1 = window.AppOrchestrator.getState().breakers[testTarget.targetId] ??
                                    window.AppOrchestrator.getState().breakers[testTarget.aliases[0]];
          const targetAngleAfterToggle1 = window.sceneInstance.switchgear[swKey]?.targetAngle;

          // Toggle back to restore initial state
          const opBtnBack = opContainer?.querySelector('button') || opContainer?.querySelector('.btn-drawer-operate');
          if (opBtnBack) opBtnBack.click();
          await new Promise(r => setTimeout(r, 150));

          const stateAfterToggle2 = window.AppOrchestrator.getState().breakers[testTarget.targetId] ??
                                    window.AppOrchestrator.getState().breakers[testTarget.aliases[0]];
          const targetAngleAfterToggle2 = window.sceneInstance.switchgear[swKey]?.targetAngle;

          const toggledState1 = (stateAfterToggle1 === !stateBefore);
          const animatedLever1 = Math.abs(targetAngleAfterToggle1 - targetAngleBefore) > 0.05;
          const restoredState2 = (stateAfterToggle2 === stateBefore);
          const restoredAngle2 = Math.abs(targetAngleAfterToggle2 - targetAngleBefore) < 0.005;

          results.push({
            targetId: testTarget.targetId,
            name: testTarget.name,
            buttonText: opBtn.textContent.replace(/\\s+/g, ' ').trim(),
            stateBefore,
            stateAfterToggle1,
            targetAngleBefore,
            targetAngleAfterToggle1,
            stateAfterToggle2,
            targetAngleAfterToggle2,
            toggledState1,
            animatedLever1,
            restoredState2,
            restoredAngle2,
            passed: toggledState1 && animatedLever1 && restoredState2 && restoredAngle2
          });
        }

        return results;
      })()`);
      console.log(JSON.stringify(check2Results, null, 2));

      // =============================================================
      // CHECK 3: Drag / Orbit Across Breakers (pointerdown -> move > 20px -> pointerup)
      // Assert NO breaker toggles state, and no accidental selection.
      // =============================================================
      console.log('\n=== CHECK 3: Drag / Orbit Across Breakers (Suppression > 20px) ===');
      const check3Results = await evaluate(`(async () => {
        const drawer = document.getElementById('inspector-drawer');
        if (drawer) drawer.classList.remove('open');
        await new Promise(r => setTimeout(r, 60));

        const canvas = window.sceneInstance.renderer.domElement;
        const initialBreakers = JSON.parse(JSON.stringify(window.AppOrchestrator.getState().breakers));

        // Hover over grid_mcb while dragging across
        const obj3d = window.sceneInstance.interactiveObjects.find(o => o.userData?.id === 'grid_mcb');
        window.sceneInstance.hoveredObject = obj3d;

        // Perform drag / orbit gesture: pointerdown at (100, 100), move to (150, 150) (delta = 70.7px > 20px)
        canvas.dispatchEvent(new PointerEvent('pointerdown', { clientX: 100, clientY: 100, bubbles: true }));
        canvas.dispatchEvent(new PointerEvent('pointermove', { clientX: 150, clientY: 150, bubbles: true }));
        canvas.dispatchEvent(new PointerEvent('pointerup', { clientX: 150, clientY: 150, bubbles: true }));
        canvas.dispatchEvent(new MouseEvent('click', { clientX: 150, clientY: 150, bubbles: true }));

        await new Promise(r => setTimeout(r, 120));

        const finalBreakers = JSON.parse(JSON.stringify(window.AppOrchestrator.getState().breakers));
        const drawerOpen = drawer?.classList.contains('open');

        let breakerStateChanged = false;
        const diffs = {};
        for (const k in initialBreakers) {
          if (initialBreakers[k] !== finalBreakers[k]) {
            breakerStateChanged = true;
            diffs[k] = { before: initialBreakers[k], after: finalBreakers[k] };
          }
        }

        return {
          dragDistancePx: Math.hypot(150 - 100, 150 - 100),
          breakerStateChanged,
          diffs,
          drawerOpen,
          passed: (!breakerStateChanged && !drawerOpen)
        };
      })()`);
      console.log(JSON.stringify(check3Results, null, 2));

      // =============================================================
      // CHECK 4: Click SBY Rotary Dial in 3D (Selects Only, State Valid 'I', Changes Only via I/0/II)
      // =============================================================
      console.log('\n=== CHECK 4: Click SBY Rotary Dial in 3D (Safety & Explicit Transitions) ===');
      const check4Results = await evaluate(`(async () => {
        const drawer = document.getElementById('inspector-drawer');
        if (drawer) drawer.classList.remove('open');
        await new Promise(r => setTimeout(r, 60));

        const canvas = window.sceneInstance.renderer.domElement;
        const sbyObj = window.sceneInstance.interactiveObjects.find(o => o.userData?.id === 'sby_switch');

        // 1. Initial State
        const initialSbyState = String(window.AppOrchestrator.getState().sbyPosition);
        const initial3dState = String(window.sceneInstance?.switchgear?.['sby_switch']?.state);

        // 2. Click SBY Dial in 3D (delta 0px)
        window.sceneInstance.hoveredObject = sbyObj;
        canvas.dispatchEvent(new PointerEvent('pointerdown', { clientX: 200, clientY: 200, bubbles: true }));
        canvas.dispatchEvent(new MouseEvent('click', { clientX: 200, clientY: 200, bubbles: true }));
        await new Promise(r => setTimeout(r, 120));

        const sbyAfterClick = String(window.AppOrchestrator.getState().sbyPosition);
        const sby3dAfterClick = String(window.sceneInstance?.switchgear?.['sby_switch']?.state);
        const drawerOpen = drawer?.classList.contains('open');
        const sbyUnchanged = (sbyAfterClick === 'I' && sby3dAfterClick === 'I');

        // 3. Test explicit transitions using I / 0 / II controls
        window.AppOrchestrator.onSbyStateChanged('0');
        await new Promise(r => setTimeout(r, 150));
        const posAfter0 = String(window.AppOrchestrator.getState().sbyPosition);
        const pos3dAfter0 = String(window.sceneInstance?.switchgear?.['sby_switch']?.state);

        window.AppOrchestrator.onSbyStateChanged('II');
        await new Promise(r => setTimeout(r, 150));
        const posAfterII = String(window.AppOrchestrator.getState().sbyPosition);
        const pos3dAfterII = String(window.sceneInstance?.switchgear?.['sby_switch']?.state);

        window.AppOrchestrator.onSbyStateChanged('I');
        await new Promise(r => setTimeout(r, 200));
        const posAfterI = String(window.AppOrchestrator.getState().sbyPosition);
        const pos3dAfterI = String(window.sceneInstance?.switchgear?.['sby_switch']?.state);

        const transitionsOk = (posAfter0 === '0' && posAfterII === 'II' && posAfterI === 'I');

        return {
          initialSbyState,
          initial3dState,
          sbyAfterClick,
          sby3dAfterClick,
          drawerOpen,
          sbyUnchanged,
          transitions: {
            posAfter0,
            pos3dAfter0,
            posAfterII,
            pos3dAfterII,
            posAfterI,
            pos3dAfterI
          },
          transitionsOk,
          passed: sbyUnchanged && drawerOpen && transitionsOk
        };
      })()`);
      console.log(JSON.stringify(check4Results, null, 2));

      // =============================================================
      // Evidence Screenshot: step9_interaction_safety.png
      // =============================================================
      const shot = await send('Page.captureScreenshot', { format: 'png' });
      if (shot?.data) {
        const outDir = path.join(__dirname, '..', 'evidence', 'step9');
        if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
        const filePath = path.join(outDir, 'step9_interaction_safety.png');
        fs.writeFileSync(filePath, Buffer.from(shot.data, 'base64'));
        console.log('\n[Evidence] Captured screenshot saved to: evidence/step9/step9_interaction_safety.png');
      }

      console.log('\n=== Console Health ===');
      console.log('Exceptions count:', exceptions.length);
      if (exceptions.length > 0) {
        exceptions.forEach(e => console.error(' - ' + (e.text || JSON.stringify(e))));
      }

      ws.close();
      chrome.kill();

      const passCheck1 = Array.isArray(check1Results) && check1Results.length > 0 && check1Results.every(r => r.passed);
      const passCheck2 = Array.isArray(check2Results) && check2Results.length > 0 && check2Results.every(r => r.passed);
      const passCheck3 = !!check3Results?.passed;
      const passCheck4 = !!check4Results?.passed;

      console.log('\n========================================');
      console.log('      STEP 9 VERIFICATION SUMMARY       ');
      console.log('========================================');
      console.log('Check 1 (3D Click Selects Only, Does Not Toggle): ' + (passCheck1 ? 'PASS ✓' : 'FAIL ✗'));
      console.log('Check 2 (Drawer Action Button Operates Breaker):   ' + (passCheck2 ? 'PASS ✓' : 'FAIL ✗'));
      console.log('Check 3 (Drag/Orbit Suppression > 20px):          ' + (passCheck3 ? 'PASS ✓' : 'FAIL ✗'));
      console.log('Check 4 (SBY Rotary Dial Safety & BBM Buttons):   ' + (passCheck4 ? 'PASS ✓' : 'FAIL ✗'));
      console.log('Exceptions Count:                                ' + (exceptions.length === 0 ? 'PASS (0)' : 'FAIL (' + exceptions.length + ')'));

      const overall = passCheck1 && passCheck2 && passCheck3 && passCheck4 && exceptions.length === 0;
      console.log('\nOVERALL VERDICT: ' + (overall ? 'ALL STEP 9 VERIFICATIONS PASSED! ✓' : 'STEP 9 VERIFICATION FAILED ✗'));

      process.exit(overall ? 0 : 1);
    };
  } catch (err) {
    console.error('Test execution failed:', err);
    chrome.kill();
    process.exit(1);
  }
}, 2000);
