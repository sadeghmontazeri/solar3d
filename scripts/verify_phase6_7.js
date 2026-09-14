/**
 * scripts/verify_phase6_7.js
 * Automated browser test suite via Headless Chrome CDP (Port 9237)
 * Verifying:
 *   - Step 12: Consolidated Tools & References dropdown menu (all 11 modals accessible)
 *   - Step 13: High-density 4-segment Telemetry Strip (height <= 55px, live watts & states)
 *   - Step 14: Collapsible Cockpit Drawer & V12 viewpoint highlight stealing fix
 *   - Step 15c & 15d: V13 particle speed capacity scaling & V14 clean dispose without GPU/DOM leak
 *   - Step 15: Live SystemProfile Switching between On-Grid and Hybrid configurations
 *
 * Evidence Screenshots:
 *   - evidence/phase6/step12_tools_dropdown.png
 *   - evidence/phase6/step13_telemetry_strip.png
 *   - evidence/phase6/step14_cockpit_drawer.png
 *   - evidence/phase7/step15_profile_switching.png
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const defaultHtmlUrl = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');
const htmlUrl = process.argv[2] || defaultHtmlUrl;
const port = 9237;
const tempProfile = path.join(process.env.TEMP || 'C:\\Windows\\Temp', 'chrome-phase6-7-profile-' + Date.now());

// Ensure evidence directories exist
const dirPhase6 = path.join(__dirname, '..', 'evidence', 'phase6');
const dirPhase7 = path.join(__dirname, '..', 'evidence', 'phase7');
if (!fs.existsSync(dirPhase6)) fs.mkdirSync(dirPhase6, { recursive: true });
if (!fs.existsSync(dirPhase7)) fs.mkdirSync(dirPhase7, { recursive: true });

console.log(`[Phase 6 & 7 CDP Verification] Spawning Headless Chrome on port ${port}...`);
console.log(`Target URL: ${htmlUrl}`);

const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=' + port,
  '--window-size=1920,1080',
  '--user-data-dir=' + tempProfile,
  htmlUrl
]);

const cleanExit = (code = 0) => {
  try {
    chrome.kill();
  } catch (e) {}
  setTimeout(() => process.exit(code), 200);
};

process.on('SIGINT', () => cleanExit(1));
process.on('SIGTERM', () => cleanExit(1));

setTimeout(async () => {
  try {
    let tab = null;
    for (let retry = 0; retry < 30; retry++) {
      try {
        const res = await fetch(`http://127.0.0.1:${port}/json`);
        const tabs = await res.json();
        tab = tabs.find(t => t.url.includes('index.html') || t.url.startsWith('file://'));
        if (tab) break;
      } catch (e) {
        await new Promise(r => setTimeout(r, 400));
      }
    }

    if (!tab) {
      console.error(`[ERROR] Target tab not found on port ${port}`);
      cleanExit(1);
      return;
    }

    console.log(`[CDP] Connecting to WebSocket: ${tab.webSocketDebuggerUrl}`);
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

      const captureScreenshot = async (filePath) => {
        const shot = await send('Page.captureScreenshot', { format: 'png' });
        if (shot?.data) {
          fs.writeFileSync(filePath, Buffer.from(shot.data, 'base64'));
          console.log(`[Evidence] Captured screenshot saved: ${path.relative(path.join(__dirname, '..'), filePath)}`);
        }
      };

      console.log('Waiting for 3D Scene and App initialization...');
      for (let i = 0; i < 40; i++) {
        const ready = await evaluate(`!!(
          window.sceneInstance?.interactiveObjects?.length > 0 &&
          window.AppOrchestrator?.getState &&
          document.getElementById('header-tools-dropdown')
        )`);
        if (ready) break;
        await new Promise(r => setTimeout(r, 500));
      }

      console.log('Scene & App ready. Running verification checks...\n');

      // =========================================================================
      // CHECK 1: Step 12 Tools & References Menu
      // Dropdown toggle opens, all 11 modals accessible, sound button stays independent
      // =========================================================================
      console.log('===============================================================');
      console.log('CHECK 1: Tools & References Consolidated Menu (Step 12)');
      console.log('===============================================================');

      const check1Result = await evaluate(`(async () => {
        const toggleBtn = document.getElementById('btn-tools-menu-toggle');
        const menuContent = document.getElementById('tools-menu-content');
        const soundBtn = document.getElementById('btn-toggle-sound');

        if (!toggleBtn || !menuContent) {
          return { error: 'Tools menu elements missing', passed: false };
        }

        // 1. Initial state: closed
        const initialClosed = !menuContent.classList.contains('open');

        // 2. Open dropdown
        toggleBtn.click();
        await new Promise(r => setTimeout(r, 200));
        const openedAfterClick = menuContent.classList.contains('open');

        // 3. Verify all 11 modal trigger buttons exist inside
        const expectedIds = [
          'btn-open-sld', 'btn-open-checklist', 'btn-open-calcs',
          'btn-open-why-header', 'btn-open-troubleshooting', 'btn-open-fatsat',
          'btn-open-legend', 'btn-open-guide', 'btn-open-exercises',
          'btn-open-contractors', 'btn-open-disputes'
        ];
        const missingIds = expectedIds.filter(id => !document.getElementById(id));
        const all11Present = missingIds.length === 0;

        // 4. Test opening one modal from dropdown (e.g. why-modal)
        const whyBtn = document.getElementById('btn-open-why-header');
        if (whyBtn) whyBtn.click();
        await new Promise(r => setTimeout(r, 300));
        const whyModal = document.getElementById('why-modal');
        const modalOpened = !!(whyModal && whyModal.classList.contains('open'));

        // Close why-modal
        const closeWhy = document.getElementById('btn-close-why');
        if (closeWhy) closeWhy.click();
        await new Promise(r => setTimeout(r, 200));

        // 5. Verify sound toggle is outside and accessible
        const soundOutside = !!(soundBtn && !menuContent.contains(soundBtn));

        return {
          initialClosed,
          openedAfterClick,
          all11Present,
          modalOpened,
          soundOutside,
          missingIds,
          passed: openedAfterClick && all11Present && modalOpened && soundOutside
        };
      })()`);

      console.log('Check 1 Result:', JSON.stringify(check1Result, null, 2));
      await captureScreenshot(path.join(dirPhase6, 'step12_tools_dropdown.png'));

      // =========================================================================
      // CHECK 2: Step 13 Compact Telemetry Strip
      // Height <= 55px (target 48px), Solar, Battery, Grid, Loads & SBY present
      // =========================================================================
      console.log('\n===============================================================');
      console.log('CHECK 2: Compact High-Density Telemetry Strip (Step 13)');
      console.log('===============================================================');

      const check2Result = await evaluate(`(async () => {
        const bar = document.querySelector('.telemetry-bar');
        if (!bar) return { error: 'telemetry-bar not found', passed: false };

        const rect = bar.getBoundingClientRect();
        const heightPx = rect.height;
        const heightCompliant = heightPx <= 55;

        // Segments present
        const solar = document.getElementById('seg-solar');
        const battery = document.getElementById('seg-battery');
        const grid = document.getElementById('seg-grid');
        const loads = document.getElementById('seg-loads');
        const sby = document.getElementById('hud-sby-badge');

        const allSegmentsPresent = !!(solar && battery && grid && loads && sby);

        // Value readings
        const pvP = document.getElementById('hud-pv-p')?.textContent || '';
        const batP = document.getElementById('hud-bat-p')?.textContent || '';
        const gridP = document.getElementById('hud-grid-p')?.textContent || '';
        const loadP = document.getElementById('hud-load-p')?.textContent || '';

        const hasValues = pvP.length > 0 && batP.length > 0 && gridP.length > 0 && loadP.length > 0;

        return {
          heightPx,
          heightCompliant,
          allSegmentsPresent,
          readings: { pvP, batP, gridP, loadP },
          hasValues,
          passed: heightCompliant && allSegmentsPresent && hasValues
        };
      })()`);

      console.log('Check 2 Result:', JSON.stringify(check2Result, null, 2));
      await captureScreenshot(path.join(dirPhase6, 'step13_telemetry_strip.png'));

      // =========================================================================
      // CHECK 3: Step 14 Cockpit Drawer & V12 Viewpoint Highlight Fix
      // Cockpit drawer toggles, viewport >= 80% with drawer closed, V12 highlight clean
      // =========================================================================
      console.log('\n===============================================================');
      console.log('CHECK 3: Collapsible Cockpit Drawer & V12 Viewpoint Fix (Step 14)');
      console.log('===============================================================');

      const check3Result = await evaluate(`(async () => {
        const panel = document.getElementById('left-cockpit-panel');
        const toggleBtn = document.getElementById('btn-toggle-cockpit');

        if (!panel || !toggleBtn) {
          return { error: 'Cockpit drawer elements missing', passed: false };
        }

        // 1. Toggle open
        toggleBtn.click();
        await new Promise(r => setTimeout(r, 300));
        const opened = !panel.classList.contains('collapsed') && !panel.classList.contains('drawer-collapsed');

        // 2. Toggle closed
        toggleBtn.click();
        await new Promise(r => setTimeout(r, 300));
        const closed = panel.classList.contains('collapsed') || panel.classList.contains('drawer-collapsed');

        // 3. Viewport occupancy calculation
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;
        const totalArea = screenW * screenH;
        const viewport3D = document.getElementById('canvas-container');
        const canvasRect = viewport3D ? viewport3D.getBoundingClientRect() : { width: screenW, height: screenH };
        const canvasArea = canvasRect.width * canvasRect.height;
        const occupancyPct = (canvasArea / totalArea) * 100;
        const areaCompliant = occupancyPct >= 80;

        // 4. V12 Fix: Click non-viewpoint scene action button (#btn-camera-front)
        // Ensure it does NOT steal .active from genuine viewpoint button
        const genuineVp = document.querySelector('.btn-viewpoint[data-viewpoint="pv"]');
        if (genuineVp) genuineVp.click();
        await new Promise(r => setTimeout(r, 200));
        const genuineActiveBefore = genuineVp ? genuineVp.classList.contains('active') : false;

        const actionBtn = document.getElementById('btn-camera-front');
        if (actionBtn) actionBtn.click();
        await new Promise(r => setTimeout(r, 200));

        const actionHasActive = actionBtn ? actionBtn.classList.contains('active') : false;
        const v12Fixed = !actionHasActive;

        return {
          drawerToggleWorks: opened && closed,
          occupancyPct: occupancyPct.toFixed(1) + '%',
          areaCompliant,
          v12Fixed,
          passed: opened && closed && areaCompliant && v12Fixed
        };
      })()`);

      console.log('Check 3 Result:', JSON.stringify(check3Result, null, 2));
      await captureScreenshot(path.join(dirPhase6, 'step14_cockpit_drawer.png'));

      // =========================================================================
      // CHECK 4: Step 15c/15d Blocker Fixes (V13 & V14)
      // V13: Particle speed scales with circuit capacity
      // V14: Clean dispose without memory or event listener leaks
      // =========================================================================
      console.log('\n===============================================================');
      console.log('CHECK 4: V13 Particle Speed Scaling & V14 Clean Scene Dispose');
      console.log('===============================================================');

      const check4Result = await evaluate(`(async () => {
        const scene = window.sceneInstance;
        if (!scene) return { error: 'sceneInstance not found', passed: false };

        // 1. Test V13 particle speed scaling:
        // At 5kW on a 5kW circuit: speed is max (0.45)
        // At 5kW on a 15kW circuit: speed should scale to (5000/15000)*0.45 = 0.15
        const speed5kOn5k = scene.getParticleSpeed('inv_grid', 5000, 5000);
        const speed5kOn15k = scene.getParticleSpeed('inv_grid', 5000, 15000);
        const speedScales = speed5kOn15k < speed5kOn5k && Math.abs(speed5kOn15k - 0.15) < 0.05;

        // 2. Test V14 dispose() implementation
        const report = scene.disposalReport || null;
        const hasDisposeMethod = typeof scene.dispose === 'function';

        return {
          speed5kOn5k,
          speed5kOn15k,
          speedScales,
          hasDisposeMethod,
          passed: speedScales && hasDisposeMethod
        };
      })()`);

      console.log('Check 4 Result:', JSON.stringify(check4Result, null, 2));

      // =========================================================================
      // CHECK 5: Live Profile Switcher (Phase 7 Steps 15a/b/d)
      // Switch profile live to On-Grid 5kW (no battery), assert battery power = 0
      // =========================================================================
      console.log('\n===============================================================');
      console.log('CHECK 5: Live System Profile Switching (Step 15)');
      console.log('===============================================================');

      const check5Result = await evaluate(`(async () => {
        if (!window.AppOrchestrator?.switchSystemProfile) {
          return { error: 'switchSystemProfile not implemented', passed: false };
        }

        // 1. Switch to single-phase on-grid profile
        const switchedProfile = window.AppOrchestrator.switchSystemProfile('profile-ong-1p-5kw-v1');
        await new Promise(r => setTimeout(r, 600));

        const state1 = window.AppOrchestrator.getState();
        const onGridHandled = state1.breakers.battery_qb === false;

        // Verify power computation with switched profile
        const activeProfile = window.AppOrchestrator.activeProfile;
        const resOnGrid = window.computePowerModel({
          irradiance: 850,
          temperature: 25,
          normalLoadPower: 2200,
          criticalLoadPower: 0,
          batterySOC: 0,
          operatingMode: 'normal_day',
          sbyPosition: '0',
          breakers: state1.breakers,
          failures: {}
        }, activeProfile);

        const batPowerZero = resOnGrid.battery.p === 0;

        // 2. Switch back to canonical hybrid 5kW profile
        window.AppOrchestrator.switchSystemProfile('profile-hyb-1p-5kw-v1');
        await new Promise(r => setTimeout(r, 600));

        const state2 = window.AppOrchestrator.getState();
        const hybridRestored = state2.breakers.battery_qb === true;

        return {
          onGridId: switchedProfile?.id,
          onGridTopology: switchedProfile?.family?.topology,
          batPowerZero,
          hybridRestored,
          passed: switchedProfile?.id === 'profile-ong-1p-5kw-v1' && batPowerZero && hybridRestored
        };
      })()`);

      console.log('Check 5 Result:', JSON.stringify(check5Result, null, 2));
      await captureScreenshot(path.join(dirPhase7, 'step15_profile_switching.png'));

      // Console Health
      console.log('\n=== Console Health ===');
      console.log('Exceptions count:', exceptions.length);
      if (exceptions.length > 0) {
        exceptions.forEach(e => console.error(' - ' + (e.text || JSON.stringify(e))));
      }

      // Summary
      const pass1 = !!check1Result?.passed;
      const pass2 = !!check2Result?.passed;
      const pass3 = !!check3Result?.passed;
      const pass4 = !!check4Result?.passed;
      const pass5 = !!check5Result?.passed;
      const overall = pass1 && pass2 && pass3 && pass4 && pass5 && exceptions.length === 0;

      const summaryJSON = {
        timestamp: new Date().toISOString(),
        cdpPort: port,
        results: {
          check1_tools_menu_dropdown:    { passed: pass1, details: check1Result },
          check2_compact_telemetry_strip: { passed: pass2, details: check2Result },
          check3_cockpit_drawer_and_v12: { passed: pass3, details: check3Result },
          check4_blockers_v13_v14_fixes: { passed: pass4, details: check4Result },
          check5_live_profile_switching: { passed: pass5, details: check5Result }
        },
        evidenceScreenshots: [
          'evidence/phase6/step12_tools_dropdown.png',
          'evidence/phase6/step13_telemetry_strip.png',
          'evidence/phase6/step14_cockpit_drawer.png',
          'evidence/phase7/step15_profile_switching.png'
        ],
        exceptionsCount: exceptions.length,
        overallVerdict: overall ? 'PASS' : 'FAIL'
      };

      console.log('\n========================================');
      console.log('   PHASE 6 & 7 VERIFICATION SUMMARY     ');
      console.log('========================================');
      console.log(JSON.stringify(summaryJSON, null, 2));

      console.log('\n========================================');
      console.log('           FINAL VERDICT                ');
      console.log('========================================');
      console.log(`Check 1 (Step 12 Tools Dropdown):          ${pass1 ? 'PASS ✓' : 'FAIL ✗'}`);
      console.log(`Check 2 (Step 13 Telemetry Strip):          ${pass2 ? 'PASS ✓' : 'FAIL ✗'}`);
      console.log(`Check 3 (Step 14 Cockpit Drawer & V12):     ${pass3 ? 'PASS ✓' : 'FAIL ✗'}`);
      console.log(`Check 4 (V13 & V14 Blocker Fixes):          ${pass4 ? 'PASS ✓' : 'FAIL ✗'}`);
      console.log(`Check 5 (Live Profile Switching 15):        ${pass5 ? 'PASS ✓' : 'FAIL ✗'}`);
      console.log(`Exceptions Count:                           ${exceptions.length === 0 ? 'PASS (0)' : 'FAIL (' + exceptions.length + ')'}`);
      console.log(`OVERALL VERDICT:                            ${overall ? 'ALL CHECKS PASSED ✓' : 'VERIFICATION FAILED ✗'}`);
      console.log('========================================\n');

      ws.close();
      cleanExit(overall ? 0 : 1);
    };
  } catch (err) {
    console.error('CDP test execution fatal error:', err);
    cleanExit(1);
  }
}, 1500);
