/**
 * scripts/verify_step10_11.js
 * Automated browser test suite via Headless Chrome CDP (Port 9236)
 * Verifying:
 *   - Step 10: Safe isolateSubsystem('mdb') and isolateSubsystem('all') with material cloning & transparency preservation
 *   - Step 10: 5x isolation/reset drift and visual stability check
 *   - Step 11: MDB cabinet focus, auto door open, inspector feed summary banner (energized / de-energized), previous camera return
 *   - Step 15b: Pure power-model profile parameterization in browser
 * 
 * Evidence Screenshots:
 *   - evidence/step10/step10_isolation_mdb.png
 *   - evidence/step10/step10_reset_all.png
 *   - evidence/step11/step11_mdb_cabinet_focused.png
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const defaultHtmlUrl = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');
const htmlUrl = process.argv[2] || defaultHtmlUrl;
const port = 9245;
const tempProfile = path.join(process.env.TEMP || 'C:\\Windows\\Temp', 'chrome-step10-11-profile-' + Date.now());

// Ensure evidence directories exist
const dirStep10 = path.join(__dirname, '..', 'evidence', 'step10');
const dirStep11 = path.join(__dirname, '..', 'evidence', 'step11');
if (!fs.existsSync(dirStep10)) fs.mkdirSync(dirStep10, { recursive: true });
if (!fs.existsSync(dirStep11)) fs.mkdirSync(dirStep11, { recursive: true });

console.log(`[Step 10/11/15b CDP Verification] Spawning Headless Chrome on port ${port}...`);
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
    for (let retry = 0; retry < 40; retry++) {
      try {
        const res = await fetch(`http://127.0.0.1:${port}/json`);
        const tabs = await res.json();
        tab = tabs.find(t => (t.type === 'page' || !t.type) && (t.url.includes('index.html') || t.url.startsWith('file://')));
        if (tab) break;
      } catch (e) {
        // Chrome CDP endpoint not ready yet
      }
      await new Promise(r => setTimeout(r, 400));
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
          window.sceneInstance?.isolateSubsystem
        )`);
        if (ready) break;
        await new Promise(r => setTimeout(r, 500));
      }

      console.log('Scene & App ready. Running verification checks...\n');

      // =========================================================================
      // CHECK 1: Test sceneInstance.isolateSubsystem('mdb')
      // MDB meshes stay visible/bright (opacity >= 0.8), external meshes dimmed (opacity <= 0.2)
      // =========================================================================
      console.log('===============================================================');
      console.log('CHECK 1: Test sceneInstance.isolateSubsystem("mdb")');
      console.log('===============================================================');

      const check1Result = await evaluate(`(async () => {
        window.sceneInstance.isolateSubsystem('mdb');
        await new Promise(r => setTimeout(r, 250));

        const mdbGroup = window.sceneInstance.mdbGroup;
        const roofGroup = window.sceneInstance.roofGroup;
        const bessGroup = window.sceneInstance.bessGroup;
        const inverterGroup = window.sceneInstance.inverterGroup;

        const mdbOpaqueMeshes = [];
        const mdbTransparentMeshes = [];
        if (mdbGroup) {
          mdbGroup.traverse(c => {
            if (c.isMesh && c.material && c !== window.sceneInstance.groundMesh) {
              const op = Array.isArray(c.material) ? c.material[0].opacity : c.material.opacity;
              const orig = c.userData?._origMat;
              const isTrans = orig ? orig.transparent : (Array.isArray(c.material) ? c.material[0].transparent : c.material.transparent);
              if (isTrans || (orig && orig.opacity < 0.8)) {
                mdbTransparentMeshes.push({ name: c.name || c.userData?.id || 'mdb_trans_mesh', opacity: op });
              } else {
                mdbOpaqueMeshes.push({ name: c.name || c.userData?.id || 'mdb_mesh', opacity: op });
              }
            }
          });
        }

        const externalMeshes = [];
        [roofGroup, bessGroup, inverterGroup].forEach(g => {
          if (g) {
            g.traverse(c => {
              if (c.isMesh && c.material && c !== window.sceneInstance.groundMesh) {
                const op = Array.isArray(c.material) ? c.material[0].opacity : c.material.opacity;
                externalMeshes.push({ name: c.name || c.userData?.id || 'ext_mesh', opacity: op });
              }
            });
          }
        });

        const mdbBright = mdbOpaqueMeshes.length > 0 && mdbOpaqueMeshes.every(m => m.opacity >= 0.8);
        const extDimmed = externalMeshes.length > 0 && externalMeshes.every(m => m.opacity <= 0.2);

        return {
          mdbOpaqueMeshCount: mdbOpaqueMeshes.length,
          mdbOpaqueMinOpacity: mdbOpaqueMeshes.length > 0 ? Math.min(...mdbOpaqueMeshes.map(m => m.opacity)) : 0,
          mdbTransMeshCount: mdbTransparentMeshes.length,
          extMeshCount: externalMeshes.length,
          extMaxOpacity: externalMeshes.length > 0 ? Math.max(...externalMeshes.map(m => m.opacity)) : 1,
          mdbBright,
          extDimmed,
          sampleMdb: mdbOpaqueMeshes.slice(0, 3),
          sampleExt: externalMeshes.slice(0, 3),
          passed: mdbBright && extDimmed
        };
      })()`);

      console.log('Check 1 Result:', JSON.stringify(check1Result, null, 2));

      // Evidence screenshot for Check 1
      const shot1Path = path.join(dirStep10, 'step10_isolation_mdb.png');
      await captureScreenshot(shot1Path);

      // =========================================================================
      // CHECK 2: Test sceneInstance.isolateSubsystem('all')
      // Meshes return to original opacity (_origMat.opacity), transparent meshes retain transparent === true
      // =========================================================================
      console.log('\n===============================================================');
      console.log('CHECK 2: Test sceneInstance.isolateSubsystem("all") & Transparency Retention');
      console.log('===============================================================');

      const check2Result = await evaluate(`(async () => {
        window.sceneInstance.isolateSubsystem('all');
        await new Promise(r => setTimeout(r, 250));

        let totalMeshes = 0;
        let restoredCount = 0;
        let transparentChecked = 0;
        let transparentPreserved = 0;
        const failedRestores = [];
        const failedTransparents = [];

        window.sceneInstance.scene.traverse(c => {
          if (c.isMesh && c.material && c !== window.sceneInstance.groundMesh) {
            const mat = Array.isArray(c.material) ? c.material[0] : c.material;
            const orig = c.userData?._origMat;
            if (orig) {
              totalMeshes++;
              const opacityMatch = Math.abs(mat.opacity - orig.opacity) < 0.05;
              if (opacityMatch) {
                restoredCount++;
              } else {
                failedRestores.push({ name: c.name, cur: mat.opacity, orig: orig.opacity });
              }

              if (orig.transparent === true) {
                transparentChecked++;
                if (mat.transparent === true) {
                  transparentPreserved++;
                } else {
                  failedTransparents.push({ name: c.name, matTransparent: mat.transparent, origTransparent: orig.transparent });
                }
              }
            }
          }
        });

        const allRestored = totalMeshes > 0 && restoredCount === totalMeshes;
        const glassPreserved = transparentChecked > 0 && transparentPreserved === transparentChecked;

        return {
          totalMeshes,
          restoredCount,
          allRestored,
          transparentChecked,
          transparentPreserved,
          glassPreserved,
          failedRestores: failedRestores.slice(0, 3),
          failedTransparents: failedTransparents.slice(0, 3),
          passed: allRestored && glassPreserved
        };
      })()`);

      console.log('Check 2 Result:', JSON.stringify(check2Result, null, 2));

      // Evidence screenshot for Check 2
      const shot2Path = path.join(dirStep10, 'step10_reset_all.png');
      await captureScreenshot(shot2Path);

      // =========================================================================
      // CHECK 3: 5x Isolation & Reset Repeated Stress Test
      // No visual drift, no progressive darkening, opacity values remain identical to run 1
      // =========================================================================
      console.log('\n===============================================================');
      console.log('CHECK 3: Repeat isolation and reset 5 times in a row (Drift Test)');
      console.log('===============================================================');

      const check3Result = await evaluate(`(async () => {
        // Capture baseline opacity of meshes after run 1
        const run1Opacities = new Map();
        window.sceneInstance.scene.traverse(c => {
          if (c.isMesh && c.material && c !== window.sceneInstance.groundMesh) {
            const mat = Array.isArray(c.material) ? c.material[0] : c.material;
            run1Opacities.set(c.id, mat.opacity);
          }
        });

        const perCycleMaxDrift = [];

        for (let cycle = 1; cycle <= 5; cycle++) {
          window.sceneInstance.isolateSubsystem('mdb');
          await new Promise(r => setTimeout(r, 60));
          window.sceneInstance.isolateSubsystem('all');
          await new Promise(r => setTimeout(r, 60));

          let cycleMaxDrift = 0;
          window.sceneInstance.scene.traverse(c => {
            if (c.isMesh && c.material && c !== window.sceneInstance.groundMesh && run1Opacities.has(c.id)) {
              const mat = Array.isArray(c.material) ? c.material[0] : c.material;
              const diff = Math.abs(mat.opacity - run1Opacities.get(c.id));
              if (diff > cycleMaxDrift) cycleMaxDrift = diff;
            }
          });
          perCycleMaxDrift.push({ cycle, maxDrift: cycleMaxDrift });
        }

        const totalMaxDrift = Math.max(...perCycleMaxDrift.map(d => d.maxDrift));
        const passed = totalMaxDrift < 0.001;

        return {
          cyclesTested: 5,
          perCycleMaxDrift,
          totalMaxDrift,
          driftFree: passed,
          passed
        };
      })()`);

      console.log('Check 3 Result:', JSON.stringify(check3Result, null, 2));

      // =========================================================================
      // CHECK 4: Test MDB Cabinet Focus & Return
      // - Call sceneInstance.focusMDB() or click MDB enclosure in 3D
      //   - Verify MDB door opens (mdbDoorOpen === true or angle changes)
      //   - Verify #btn-camera-prev becomes visible
      //   - Verify #drawer-feed-summary banner appears with «BUS-G» or «برق‌دار»
      // - Toggle Q0 breaker to open:
      //   - Verify #drawer-feed-summary dynamically updates to de-energized / «بی‌برق»
      // - Click #btn-camera-prev:
      //   - Verify camera glides back to previous position
      // =========================================================================
      console.log('\n===============================================================');
      console.log('CHECK 4: MDB Cabinet Focus, Dynamic Feed Summary & Camera Return');
      console.log('===============================================================');

      // Record pre-focus camera position
      const preCamera = await evaluate(`(() => {
        const cam = window.sceneInstance.camera;
        const tgt = window.sceneInstance.controls ? window.sceneInstance.controls.target : { x: 0, y: 0, z: 0 };
        return {
          pos: { x: cam.position.x, y: cam.position.y, z: cam.position.z },
          tgt: { x: tgt.x, y: tgt.y, z: tgt.z }
        };
      })()`);

      // Focus MDB and inspect UI + 3D
      const focusResult = await evaluate(`(async () => {
        // Ensure Q0 is closed initially
        if (window.AppOrchestrator?.setBreaker) {
          window.AppOrchestrator.setBreaker('q0_mcb', true);
        }

        // Open MDB inspector and focus
        if (typeof window.sceneInstance.focusMDB === 'function') {
          window.sceneInstance.focusMDB(800);
        } else if (typeof window.sceneInstance.focusSubsystem === 'function') {
          window.sceneInstance.focusSubsystem('mdb', 800);
        }

        // Trigger inspector drawer for MDB if not opened
        if (window.AppOrchestrator?.openInspectorForComponent) {
          window.AppOrchestrator.openInspectorForComponent('bus_g');
        } else {
          const mdbObj = window.sceneInstance.interactiveObjects.find(o => 
            o.userData?.id?.includes('mdb') || o.userData?.componentId?.includes('mdb') || o.userData?.id === 'q0_mcb'
          );
          if (mdbObj && window.sceneInstance.selectObject) {
            window.sceneInstance.selectObject(mdbObj);
          }
        }

        // Allow animation & HUD refresh
        await new Promise(r => setTimeout(r, 1200));

        // 1. Verify MDB Door open
        const doorOpen = window.sceneInstance.mdbDoorOpen === true ||
          (window.sceneInstance.mdbDoorGroup && Math.abs(window.sceneInstance.mdbDoorGroup.rotation.y) > 0.2) ||
          (window.sceneInstance.mdbDoorMesh && Math.abs(window.sceneInstance.mdbDoorMesh.rotation.y) > 0.2);

        // 2. Verify #btn-camera-prev visible
        const prevBtn = document.getElementById('btn-camera-prev');
        const btnVisible = !!(prevBtn && !prevBtn.hidden && window.getComputedStyle(prevBtn).display !== 'none');

        // 3. Verify #drawer-feed-summary banner text
        const banner = document.getElementById('drawer-feed-summary');
        const bannerVisible = !!(banner && window.getComputedStyle(banner).display !== 'none');
        const bannerText = banner ? (banner.textContent || '') : '';
        const bannerContainsEnergized = /(BUS-G|برق[\s\u200c]*دار|تغذیه)/.test(bannerText);

        return {
          doorOpen,
          btnVisible,
          bannerVisible,
          bannerText,
          bannerContainsEnergized,
          passed: doorOpen && btnVisible && bannerContainsEnergized
        };
      })()`);

      console.log('Focus MDB Result:', JSON.stringify(focusResult, null, 2));

      // Capture screenshot of focused MDB cabinet
      const shot3Path = path.join(dirStep11, 'step11_mdb_cabinet_focused.png');
      await captureScreenshot(shot3Path);

      // Toggle Q0 breaker to open and verify dynamic banner update
      console.log('Toggling Q0 breaker to OPEN (simulating de-energized)...');
      const toggleQ0Result = await evaluate(`(async () => {
        if (window.AppOrchestrator?.setBreaker) {
          window.AppOrchestrator.setBreaker('q0_mcb', false);
        } else if (window.AppOrchestrator?.onBreakerStateChanged) {
          window.AppOrchestrator.onBreakerStateChanged('q0_mcb', false, 'orchestrator');
        }
        await new Promise(r => setTimeout(r, 400));

        const banner = document.getElementById('drawer-feed-summary');
        const bannerText = banner ? (banner.textContent || '') : '';
        const bannerContainsDeenergized = /(بی[\s\u200c]*برق|خاموش|قطع|بدون تغذیه)/.test(bannerText);

        return {
          bannerText,
          bannerContainsDeenergized,
          passed: bannerContainsDeenergized
        };
      })()`);

      console.log('Q0 Open Banner Result:', JSON.stringify(toggleQ0Result, null, 2));

      // Click #btn-camera-prev and verify camera glides back
      console.log('Clicking #btn-camera-prev to return to previous viewpoint...');
      const returnCameraResult = await evaluate(`(async () => {
        const prevBtn = document.getElementById('btn-camera-prev');
        if (prevBtn) {
          prevBtn.click();
        } else if (typeof window.sceneInstance.popCameraState === 'function') {
          window.sceneInstance.popCameraState(800);
        }

        await new Promise(r => setTimeout(r, 1200));

        const cam = window.sceneInstance.camera;
        return {
          pos: { x: cam.position.x, y: cam.position.y, z: cam.position.z }
        };
      })()`);

      const returnDist = Math.hypot(
        returnCameraResult.pos.x - preCamera.pos.x,
        returnCameraResult.pos.y - preCamera.pos.y,
        returnCameraResult.pos.z - preCamera.pos.z
      );

      const cameraReturned = returnDist < 0.6;
      console.log(`Camera return glide distance: ${returnDist.toFixed(4)} (threshold < 0.6)`);

      const check4Result = {
        preCameraPos: preCamera.pos,
        postReturnCamPos: returnCameraResult.pos,
        returnDistance: returnDist,
        cameraGlidedBack: cameraReturned,
        focusMdb: focusResult,
        toggleQ0: toggleQ0Result,
        passed: focusResult.passed && toggleQ0Result.passed && cameraReturned
      };

      console.log('Check 4 Full Result:', JSON.stringify(check4Result, null, 2));

      // Restore Q0 breaker for downstream integrity
      await evaluate(`(() => {
        if (window.AppOrchestrator?.setBreaker) {
          window.AppOrchestrator.setBreaker('q0_mcb', true);
        }
      })()`);

      // =========================================================================
      // CHECK 5: Verify profile parameterization (Step 15b)
      // Assert window.computePowerModel accepts profile and computes correctly in browser
      // =========================================================================
      console.log('\n===============================================================');
      console.log('CHECK 5: Pure Power Model Profile Parameterization (Step 15b)');
      console.log('===============================================================');

      const check5Result = await evaluate(`(async () => {
        if (typeof window.computePowerModel !== 'function') {
          return { error: 'window.computePowerModel is not defined', passed: false };
        }

        const baseInput = {
          irradiance: 850,
          temperature: 25,
          normalLoadPower: 2200,
          criticalLoadPower: 1500,
          batterySOC: 75,
          operatingMode: 'normal_day',
          sbyPosition: 'I',
          breakers: {
            q0_mcb: true, grid_mcb: true, qn_mcb: true, qg_mcb: true, inv_grid_mcb: true,
            qbp_mcb: true, fspd_mcb: true, dc_isolator: true, qpv_isolator: true,
            dc_iso_1: true, dc_iso_2: true, battery_ocpd: true, battery_qb: true,
            eps_mcb: true, qe_mcb: true, qo_mcb: true, eps_rcd: true
          },
          failures: {}
        };

        // 1. Baseline compute with canonical profile
        const activeProfile = window.SystemProfiles?.get('profile-hyb-1p-5kw-v1') || null;
        const resBaseline = window.computePowerModel(baseInput, activeProfile);
        const baselineValid = resBaseline && resBaseline.pv.p > 0 && !isNaN(resBaseline.grid.p);

        // 2. Compute with profile where batteryBank is absent
        const noBatProfile = activeProfile ? JSON.parse(JSON.stringify(activeProfile)) : { equipment: {}, systemRatings: {}, connectivity: { buses: {} } };
        if (!noBatProfile.equipment) noBatProfile.equipment = {};
        noBatProfile.equipment.batteryBank = { present: false, capacity_Wh: 0 };
        if (!noBatProfile.systemRatings) noBatProfile.systemRatings = {};
        noBatProfile.systemRatings.batteryPresent = false;

        const resNoBat = window.computePowerModel(baseInput, noBatProfile);
        const noBatHandled = resNoBat && resNoBat.battery.p === 0 && !isNaN(resNoBat.grid.p);

        // 3. Compute with customized string ratings (e.g. 4000W vs default 2800W)
        const customProfile = activeProfile ? JSON.parse(JSON.stringify(activeProfile)) : { equipment: {}, systemRatings: {}, connectivity: { buses: {} } };
        if (!customProfile.equipment) customProfile.equipment = {};
        customProfile.equipment.pvArray = {
          strings: [{ ratedPower_W: 4000 }, { ratedPower_W: 4000 }]
        };

        const resCustom = window.computePowerModel(baseInput, customProfile);
        const customScales = resCustom && resCustom.pv.p > resBaseline.pv.p;

        return {
          baselineValid,
          baselinePvP: resBaseline?.pv?.p,
          baselineGridP: resBaseline?.grid?.p,
          noBatHandled,
          noBatBatteryP: resNoBat?.battery?.p,
          customScales,
          customPvP: resCustom?.pv?.p,
          passed: baselineValid && noBatHandled && customScales
        };
      })()`);

      console.log('Check 5 Result:', JSON.stringify(check5Result, null, 2));

      // Console health check
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
          check1_isolateSubsystem_mdb: { passed: pass1, details: check1Result },
          check2_isolateSubsystem_all: { passed: pass2, details: check2Result },
          check3_drift_stability_5x:   { passed: pass3, details: check3Result },
          check4_mdb_focus_and_return: { passed: pass4, details: check4Result },
          check5_power_model_profile:  { passed: pass5, details: check5Result }
        },
        evidenceScreenshots: [
          'evidence/step10/step10_isolation_mdb.png',
          'evidence/step10/step10_reset_all.png',
          'evidence/step11/step11_mdb_cabinet_focused.png'
        ],
        exceptionsCount: exceptions.length,
        overallVerdict: overall ? 'PASS' : 'FAIL'
      };

      console.log('\n========================================');
      console.log('   STEP 10, 11 & 15b VERIFICATION JSON  ');
      console.log('========================================');
      console.log(JSON.stringify(summaryJSON, null, 2));

      console.log('\n========================================');
      console.log('           FINAL VERDICT                ');
      console.log('========================================');
      console.log(`Check 1 (isolateSubsystem MDB):             ${pass1 ? 'PASS ✓' : 'FAIL ✗'}`);
      console.log(`Check 2 (isolateSubsystem All & Glass):      ${pass2 ? 'PASS ✓' : 'FAIL ✗'}`);
      console.log(`Check 3 (5x Isolation/Reset Drift):         ${pass3 ? 'PASS ✓' : 'FAIL ✗'}`);
      console.log(`Check 4 (MDB Focus, Feed Banner & Return):   ${pass4 ? 'PASS ✓' : 'FAIL ✗'}`);
      console.log(`Check 5 (Profile Parameterization 15b):      ${pass5 ? 'PASS ✓' : 'FAIL ✗'}`);
      console.log(`Exceptions Count:                           ${exceptions.length === 0 ? 'PASS (0)' : 'FAIL (' + exceptions.length + ')'}`);
      console.log(`OVERALL VERDICT:                            ${overall ? 'ALL CHECKS PASSED ✓' : 'VERIFICATION FAILED ✗'}`);
      console.log('========================================\n');

      ws.close();
      cleanExit(overall ? 0 : 1);
    };
  } catch (err) {
    console.error('CDP test execution encountered fatal error:', err);
    cleanExit(1);
  }
}, 1500);
