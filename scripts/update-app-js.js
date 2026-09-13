const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../js/app.js');
let code = fs.readFileSync(targetPath, 'utf8');

// 1. Add playSbySwitch to SynthesizedSoundEngine
if (!code.includes('playSbySwitch(pos)')) {
  const soundTarget = `    playBreakerSnap() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(150, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.09);
    }`;

  const soundReplacement = `    playBreakerSnap() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(150, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.09);
    }

    playSbySwitch(pos) {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      const f0 = pos === '0' ? 120 : (pos === 'II' ? 240 : 180);
      osc.frequency.setValueAtTime(f0, t);
      osc.frequency.exponentialRampToValueAtTime(30, t + 0.12);
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.13);
    }`;

  code = code.replace(soundTarget, soundReplacement);
}

// 2. Add sbyPosition and all breakers to state
if (!code.includes('sbyPosition:')) {
  const stateTarget = `    // Breakers State (Controlled via SLD, 3D Scene or UI)
    breakers: {
      dc_isolator: true,
      grid_mcb: true,
      eps_mcb: true,
      battery_ocpd: true
    },`;

  const stateReplacement = `    // Breakers & SBY Switch State (HYB-FA-001 SLD-01)
    sbyPosition: 'I', // 'I': Inverter EPS, '0': Fully Isolated / OFF, 'II': Grid Bypass
    breakers: {
      q0_mcb: true,
      grid_mcb: true,
      qn_mcb: true,
      qg_mcb: true,
      qbp_mcb: true,
      fspd_mcb: true,
      dc_isolator: true,
      qpv_isolator: true,
      battery_ocpd: true,
      battery_qb: true,
      eps_mcb: true,
      qe_mcb: true,
      qo_mcb: true
    },`;

  code = code.replace(stateTarget, stateReplacement);
}

// 3. Update computeElectricalState with SBY logic
if (!code.includes('// SBY 3-Position Routing Logic')) {
  const epsTarget = `    // EPS Power Status
    let epsPowered = b.eps_mcb && !rcdTripped && (criticalDemand <= 5200);
    let epsPower = epsPowered ? criticalDemand : 0;
    state.telemetry.eps = {
      v: epsPowered ? 230 : 0,
      p: Math.round(epsPower),
      isPowered: epsPowered
    };

    // Normal Loads Power Status (Only powered if Grid is available)
    let normalPowered = gridAvailable;
    let normalPower = normalPowered ? normalDemand : 0;
    state.telemetry.normalLoad = {
      p: Math.round(normalPower),
      isPowered: normalPowered
    };

    // 4. Battery Bank & Inverter Power Dispatch
    const batteryHealthy = b.battery_ocpd && !f.battery_thermal && state.batterySOC > 10;
    let batPower = 0; // Positive = Charging, Negative = Discharging
    let batVoltage = 48.0 + (state.batterySOC / 100.0) * 5.6; // 48.0V to 53.6V

    // Power available from Inverter after supplying critical load
    const totalLoadToInverter = epsPower + (gridAvailable ? normalPower : 0);`;

  const epsReplacement = `    // SBY 3-Position Routing Logic (HYB-FA-001 SLD-01)
    let epsPowered = false;
    let epsPower = 0;
    let bypassPower = 0;
    const qoClosed = b.qo_mcb !== false;

    if (qoClosed && !rcdTripped) {
      if (state.sbyPosition === 'I') {
        // Source I: Fed from Inverter EPS output (Normal Inverter Mode)
        const invEpsBreaker = (b.eps_mcb !== false) && (b.qe_mcb !== false);
        epsPowered = invEpsBreaker && (criticalDemand <= 5200);
        epsPower = epsPowered ? criticalDemand : 0;
      } else if (state.sbyPosition === 'II') {
        // Source II: Fed directly from Grid Bypass (Manual Bypass Mode)
        const qbpBreaker = b.qbp_mcb !== false;
        epsPowered = gridAvailable && qbpBreaker;
        epsPower = epsPowered ? criticalDemand : 0;
        bypassPower = epsPower; // Will be added directly to Grid demand
      } else {
        // Position 0: Fully isolated and de-energized
        epsPowered = false;
        epsPower = 0;
      }
    }

    state.telemetry.eps = {
      v: epsPowered ? 230 : 0,
      p: Math.round(epsPower),
      isPowered: epsPowered
    };

    // Normal Loads Power Status (Only powered if Grid is available and QN is closed)
    let normalPowered = gridAvailable && (b.qn_mcb !== false);
    let normalPower = normalPowered ? normalDemand : 0;
    state.telemetry.normalLoad = {
      p: Math.round(normalPower),
      isPowered: normalPowered
    };

    // 4. Battery Bank & Inverter Power Dispatch
    const batteryHealthy = (b.battery_ocpd || b.battery_qb) && !f.battery_thermal && state.batterySOC > 10;
    let batPower = 0; // Positive = Charging, Negative = Discharging
    let batVoltage = 48.0 + (state.batterySOC / 100.0) * 5.6; // 48.0V to 53.6V

    // Power demanded from Inverter (only in Pos I does inverter feed EPS!)
    const inverterEpsDemand = (state.sbyPosition === 'I') ? epsPower : 0;
    const totalLoadToInverter = inverterEpsDemand + (gridAvailable ? normalPower : 0);`;

  code = code.replace(epsTarget, epsReplacement);
}

// 4. Update Grid exchange in computeElectricalState
if (!code.includes('normalPower + bypassPower')) {
  const gridExchangeTarget = `    if (gridAvailable) {
      gridPower = (normalPower + epsPower + (batPower > 0 ? batPower : 0)) - (pvPower + (batPower < 0 ? -batPower : 0));
      if (f.ct_inverted) {
        gridPower = -gridPower;
      }
    }`;

  const gridExchangeReplacement = `    if (gridAvailable) {
      // In Pos II, bypassPower is drawn directly from grid
      const totalGridDemand = normalPower + bypassPower + (batPower > 0 ? batPower : 0);
      gridPower = totalGridDemand - (pvPower + (batPower < 0 ? -batPower : 0));
      if (f.ct_inverted) {
        gridPower = -gridPower;
      }
    }`;

  code = code.replace(gridExchangeTarget, gridExchangeReplacement);
}

// 5. Update HUD SBY badge in updateHUDView
if (!code.includes('hud-sby-pos')) {
  const hudUpdateTarget = `    // 6. Normal Loads
    setElText('hud-load-p', Math.round(t.normalLoad.p));
    setElText('hud-load-status', t.normalLoad.isPowered ? 'برق‌دار (عادی)' : 'بی‌برق (خاموش)');`;

  const hudUpdateReplacement = `    // 6. Normal Loads
    setElText('hud-load-p', Math.round(t.normalLoad.p));
    setElText('hud-load-status', t.normalLoad.isPowered ? 'برق‌دار (عادی)' : 'بی‌برق (خاموش)');

    // 7. SBY Changeover Switch Badge
    const sbyPosEl = document.getElementById('hud-sby-pos');
    const sbyDescEl = document.getElementById('hud-sby-desc');
    const sbyDotEl = document.getElementById('hud-sby-dot');
    const sbyTagEl = document.getElementById('sby-status-tag');
    if (sbyPosEl) {
      if (state.sbyPosition === 'I') {
        sbyPosEl.textContent = 'I (اینورتر)';
        sbyPosEl.style.color = 'var(--eps-magenta)';
        if (sbyDescEl) sbyDescEl.textContent = 'خروجی اینورتر EPS';
        if (sbyDotEl) sbyDotEl.className = 'badge-status-dot active';
        if (sbyTagEl) { sbyTagEl.textContent = 'وضعیت: I (اینورتر EPS)'; sbyTagEl.style.color = 'var(--eps-magenta)'; }
      } else if (state.sbyPosition === '0') {
        sbyPosEl.textContent = '0 (قطع)';
        sbyPosEl.style.color = 'var(--alert-red)';
        if (sbyDescEl) sbyDescEl.textContent = 'ایزولاسیون کامل / خاموش';
        if (sbyDotEl) sbyDotEl.className = 'badge-status-dot';
        if (sbyTagEl) { sbyTagEl.textContent = 'وضعیت: 0 (قطع کامل)'; sbyTagEl.style.color = 'var(--alert-red)'; }
      } else if (state.sbyPosition === 'II') {
        sbyPosEl.textContent = 'II (بای‌پاس)';
        sbyPosEl.style.color = 'var(--grid-blue)';
        if (sbyDescEl) sbyDescEl.textContent = 'تغذیه مستقیم از شبکه';
        if (sbyDotEl) sbyDotEl.className = 'badge-status-dot active';
        if (sbyTagEl) { sbyTagEl.textContent = 'وضعیت: II (بای‌پاس شبکه)'; sbyTagEl.style.color = 'var(--grid-blue)'; }
      }
    }
    document.querySelectorAll('.sby-pos-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-pos') === state.sbyPosition);
    });`;

  code = code.replace(hudUpdateTarget, hudUpdateReplacement);
}

// 6. Add setSbyPosition and wire SBY controls in setupCockpitControls
if (!code.includes('setSbyPosition(pos)')) {
  const cockpitTarget = `    // Reset Cockpit Button
    const btnReset = document.getElementById('btn-reset-cockpit');`;

  const cockpitReplacement = `    // SBY 3-Position Changeover Switch Controls
    function setSbyPosition(pos) {
      if (!['I', '0', 'II'].includes(pos)) return;
      state.sbyPosition = pos;
      sound.playSbySwitch(pos);
      if (window.SLDSchematic?.setSbyPosition) {
        window.SLDSchematic.setSbyPosition(pos);
      }
      if (window.sceneInstance?.setSbyPosition3D) {
        window.sceneInstance.setSbyPosition3D(pos);
      }
      if (window.simulationEngine?.setSbyPosition) {
        window.simulationEngine.setSbyPosition(pos);
      }
      computeElectricalState();
      updateHUDView();
    }
    window.setSbyPosition = setSbyPosition;

    document.querySelectorAll('.sby-pos-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const pos = btn.getAttribute('data-pos');
        setSbyPosition(pos);
      });
    });

    const hudSbyBadge = document.getElementById('hud-sby-badge');
    if (hudSbyBadge) {
      hudSbyBadge.addEventListener('click', () => {
        const cur = state.sbyPosition;
        const next = cur === 'I' ? '0' : (cur === '0' ? 'II' : 'I');
        setSbyPosition(next);
      });
    }

    // Reset Cockpit Button
    const btnReset = document.getElementById('btn-reset-cockpit');`;

  code = code.replace(cockpitTarget, cockpitReplacement);
}

// 7. Add Troubleshooting Modal & FAT/SAT Modal setup functions
if (!code.includes('setupTroubleshootingModal()')) {
  const modalFunctions = `
  // ============================================================================
  // 14. TROUBLESHOOTING MATRIX MODAL (SECTION 21)
  // ============================================================================
  function setupTroubleshootingModal() {
    const modal = document.getElementById('modal-troubleshoot');
    const openBtn = document.getElementById('btn-open-troubleshooting');
    const closeBtn = modal?.querySelector('[data-close="modal-troubleshoot"]');
    const container = document.getElementById('troubleshoot-cards-container');
    const searchInput = document.getElementById('troubleshoot-search-input');

    if (openBtn && modal) {
      openBtn.addEventListener('click', () => {
        sound.playClick();
        renderTroubleshootingCards();
        modal.classList.add('open');
      });
    }

    if (closeBtn && modal) {
      closeBtn.addEventListener('click', () => {
        sound.playClick();
        modal.classList.remove('open');
      });
    }

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('open');
      });
    }

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim().toLowerCase();
        renderTroubleshootingCards(query);
      });
    }

    function renderTroubleshootingCards(query = '') {
      if (!container) return;
      const list = window.PERSIAN_ELECTRICAL_DB?.troubleshooting_matrix || [];
      const filtered = query
        ? list.filter(item =>
            item.fault_symptom.toLowerCase().includes(query) ||
            item.root_causes.toLowerCase().includes(query) ||
            item.corrective_action.toLowerCase().includes(query)
          )
        : list;

      if (filtered.length === 0) {
        container.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:40px; color:#94a3b8;">هیچ موردی مطابق با عبارت جستجو یافت نشد.</div>';
        return;
      }

      container.innerHTML = filtered.map((item, idx) => \`
        <div class="troubleshoot-card">
          <div class="fault-header">
            <span class="fault-num-badge">خطای \${idx + 1}</span>
            <div class="fault-title">\${item.fault_symptom}</div>
          </div>
          <div class="fault-section">
            <span class="fault-label">علل و ریشه‌های محتمل:</span>
            <div class="fault-causes">\${item.root_causes}</div>
          </div>
          <div class="fault-section">
            <span class="fault-label">اقدام اصلاحی و راه‌حل مهندسی:</span>
            <div class="fault-action">\${item.corrective_action}</div>
          </div>
          <div class="fault-section">
            <span class="fault-label">هشدار ایمنی:</span>
            <div class="fault-warning">⚠️ \${item.safety_warning}</div>
          </div>
        </div>
      \`).join('');
    }
  }

  // ============================================================================
  // 15. 22-POINT FAT/SAT COMMISSIONING MODAL (SECTION 19)
  // ============================================================================
  function setupFatSatModal() {
    const modal = document.getElementById('modal-fatsat');
    const openBtn = document.getElementById('btn-open-fatsat');
    const closeBtn = modal?.querySelector('[data-close="modal-fatsat"]');
    const tbody = document.getElementById('fatsat-tbody');

    if (openBtn && modal) {
      openBtn.addEventListener('click', () => {
        sound.playClick();
        renderFatSatRows();
        modal.classList.add('open');
      });
    }

    if (closeBtn && modal) {
      closeBtn.addEventListener('click', () => {
        sound.playClick();
        modal.classList.remove('open');
      });
    }

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('open');
      });
    }

    function renderFatSatRows() {
      if (!tbody) return;
      const tests = window.PERSIAN_ELECTRICAL_DB?.fat_sat_tests || [];
      tbody.innerHTML = tests.map((t, idx) => {
        const isChecked = !!state.checklistChecked[t.id];
        return \`
          <tr>
            <td style="font-weight:700; color:#94a3b8; text-align:center;">\${idx + 1}</td>
            <td>
              <div class="fatsat-test-title">\${t.name}</div>
              <span class="fatsat-std-badge">\${t.standard_ref}</span>
            </td>
            <td style="color:#cbd5e1;">\${t.records}</td>
            <td style="color:#38bdf8;">\${t.criteria_limits}</td>
            <td style="text-align:center;">
              <input type="checkbox" class="fatsat-chk" data-testid="\${t.id}" \${isChecked ? 'checked' : ''} style="cursor:pointer; width:16px; height:16px;">
            </td>
          </tr>
        \`;
      }).join('');

      tbody.querySelectorAll('.fatsat-chk').forEach(chk => {
        chk.addEventListener('change', (e) => {
          const testId = e.target.getAttribute('data-testid');
          state.checklistChecked[testId] = e.target.checked;
          sound.playClick();
        });
      });
    }
  }
`;

  code = code.replace('  // ============================================================================', modalFunctions + '\n  // ============================================================================');
}

// 8. Call setups in initApp
if (!code.includes('setupTroubleshootingModal();')) {
  const initTarget = `    setupWhyModal();
    setupChecklistModal();
    setupCalculatorsModal();
    setupSLDModal();`;

  const initReplacement = `    setupWhyModal();
    setupChecklistModal();
    setupCalculatorsModal();
    setupSLDModal();
    setupTroubleshootingModal();
    setupFatSatModal();`;

  code = code.replace(initTarget, initReplacement);
}

// 9. Update window.AppOrchestrator
if (!code.includes('onSbyStateChanged')) {
  const orchTarget = `    onBreakerStateChanged: (breakerId, stateBool) => {
      state.breakers[breakerId] = stateBool;
      if (window.sceneInstance && typeof window.sceneInstance.toggleBreaker3D === 'function') {
        window.sceneInstance.toggleBreaker3D(breakerId);
      }
      computeElectricalState();
      updateHUDView();
    },`;

  const orchReplacement = `    onSbyStateChanged: (pos) => {
      state.sbyPosition = pos;
      sound.playSbySwitch(pos);
      computeElectricalState();
      updateHUDView();
      if (window.sceneInstance?.setSbyPosition3D) {
        window.sceneInstance.setSbyPosition3D(pos);
      }
      if (window.simulationEngine?.setSbyPosition) {
        window.simulationEngine.setSbyPosition(pos);
      }
    },
    onBreakerStateChanged: (breakerId, stateBool) => {
      state.breakers[breakerId] = stateBool;
      // Sync aliases
      if (breakerId === 'dc_isolator') state.breakers.qpv_isolator = stateBool;
      if (breakerId === 'qpv_isolator') state.breakers.dc_isolator = stateBool;
      if (breakerId === 'battery_ocpd') state.breakers.battery_qb = stateBool;
      if (breakerId === 'battery_qb') state.breakers.battery_ocpd = stateBool;
      if (breakerId === 'eps_mcb') state.breakers.qe_mcb = stateBool;
      if (breakerId === 'qe_mcb') state.breakers.eps_mcb = stateBool;
      if (breakerId === 'grid_mcb') state.breakers.q0_mcb = stateBool;
      if (breakerId === 'q0_mcb') state.breakers.grid_mcb = stateBool;

      if (window.sceneInstance && typeof window.sceneInstance.toggleBreaker3D === 'function') {
        window.sceneInstance.toggleBreaker3D(breakerId);
      }
      computeElectricalState();
      updateHUDView();
    },`;

  code = code.replace(orchTarget, orchReplacement);
}

fs.writeFileSync(targetPath, code, 'utf8');
console.log('Successfully updated app.js');
