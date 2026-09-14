/**
 * ==============================================================================
 * 5kW Single-Phase Hybrid Solar PV 3D Simulator
 * Application Orchestrator & Persian Engineering Interface (app.js)
 * Standards: IEC 60364-7-712, IEC 62109-1/2, IEC 62477, IEC 61643, IEC 62619
 * ==============================================================================
 */

(function () {
  'use strict';


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

      container.innerHTML = filtered.map((item, idx) => `
        <div class="troubleshoot-card">
          <div class="fault-header">
            <span class="fault-num-badge">خطای ${idx + 1}</span>
            <div class="fault-title">${item.fault_symptom}</div>
          </div>
          <div class="fault-section">
            <span class="fault-label">علل و ریشه‌های محتمل:</span>
            <div class="fault-causes">${item.root_causes}</div>
          </div>
          <div class="fault-section">
            <span class="fault-label">اقدام اصلاحی و راه‌حل مهندسی:</span>
            <div class="fault-action">${item.corrective_action}</div>
          </div>
          <div class="fault-section">
            <span class="fault-label">هشدار ایمنی:</span>
            <div class="fault-warning">⚠️ ${item.safety_warning}</div>
          </div>
        </div>
      `).join('');
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
        return `
          <tr>
            <td style="font-weight:700; color:#94a3b8; text-align:center;">${idx + 1}</td>
            <td>
              <div class="fatsat-test-title">${t.name}</div>
              <span class="fatsat-std-badge">${t.standard_ref}</span>
            </td>
            <td style="color:#cbd5e1;">${t.records}</td>
            <td style="color:#38bdf8;">${t.criteria_limits}</td>
            <td style="text-align:center;">
              <input type="checkbox" class="fatsat-chk" data-testid="${t.id}" ${isChecked ? 'checked' : ''} style="cursor:pointer; width:16px; height:16px;">
            </td>
          </tr>
        `;
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

  // ============================================================================
  // 1. BUILT-IN SOUND SYNTHESIZER (Web Audio API)
  // ============================================================================
  class SynthesizedSoundEngine {
    constructor() {
      this.ctx = null;
      this.muted = false;
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    toggleMute() {
      this.muted = !this.muted;
      return this.muted;
    }

    playClick() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    }

    playBreakerSnap() {
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
    }

    playAlarm() {
      if (this.muted) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(950, now);
      osc.frequency.setValueAtTime(750, now + 0.12);
      osc.frequency.setValueAtTime(950, now + 0.24);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(now + 0.36);
    }
  }

  // ============================================================================
  // 2. SIMULATION ELECTRICAL STATE & POWER BALANCE MODEL
  // ============================================================================
  let sbyTransferGeneration = 0;
  const state = {
    activeProfileId: 'profile-hyb-1p-5kw-v1',
    activeProfile: null,

    // Environmental & System Inputs
    irradiance: 850,       // W/m2 (0 - 1200)
    temperature: 25,       // °C (-20 to 50)
    normalLoadPower: 2200, // W (0 - 6000)
    criticalLoadPower: 1500, // W (0 - 5000)
    batterySOC: 75,        // % (10 - 100)
    operatingMode: 'normal_day', // 'normal_day', 'evening_peak', 'grid_outage', 'emergency_backup', 'night_charge'

    // Breakers & SBY Switch State (HYB-FA-001 SLD-01)
    sbyPosition: 'I', // 'I': Inverter EPS, '0': Fully Isolated / OFF, 'II': Grid Bypass
    breakers: {
      q0_mcb: true,
      grid_mcb: true,
      qn_mcb: true,
      qg_mcb: true,
      inv_grid_mcb: true,
      qbp_mcb: true,
      fspd_mcb: true,
      dc_isolator: true,
      qpv_isolator: true,
      dc_iso_1: true,
      dc_iso_2: true,
      battery_ocpd: true,
      battery_qb: true,
      eps_mcb: true,
      qe_mcb: true,
      qo_mcb: true,
      eps_rcd: true
    },

    // 9 Active Fault Injections
    failures: {
      dc_arc_fault: false,
      surge_overvoltage: false,
      grid_blackout: false,
      grid_brownout: false,
      ground_fault: false,
      battery_thermal: false,
      eps_overload: false,
      blown_pv_fuse: false,
      ct_inverted: false
    },

    // Dynamic Live Telemetry Metrics
    telemetry: {
      pv: { v: 385, i: 9.8, p: 3770 },
      battery: { v: 51.8, i: 16.4, p: 850, soc: 75, state: 'charging' },
      inverter: { pOut: 3700, efficiency: 97.4, freq: 50.0, status: 'Grid-Connected' },
      grid: { v: 230, p: -720, pf: 0.99, isBlackout: false },
      eps: { v: 230, p: 1500, isPowered: true },
      normalLoad: { p: 2200, isPowered: true }
    },

    currentFilter: 'all',
    activeInspectorComponent: 'hybrid_inverter',
    checklistChecked: {}
  };

  const sound = new SynthesizedSoundEngine();
  window.soundEngine = sound;

  // ============================================================================
  // 3. CORE ELECTRICAL SIMULATION ENGINE CALCULATION LOOP
  // ============================================================================
  function computeElectricalState() {
    const input = {
      irradiance: state.irradiance,
      temperature: state.temperature,
      normalLoadPower: state.normalLoadPower,
      criticalLoadPower: state.criticalLoadPower,
      batterySOC: state.batterySOC,
      operatingMode: state.operatingMode,
      sbyPosition: state.sbyPosition,
      breakers: state.breakers,
      failures: state.failures
    };

    const activeProfile = state.activeProfile || (window.SystemProfiles?.get(state.activeProfileId || 'profile-hyb-1p-5kw-v1'));
    const result = (typeof computePowerModel === 'function')
      ? computePowerModel(input, activeProfile)
      : (window.computePowerModel ? window.computePowerModel(input, activeProfile) : null);

    if (result) {
      state.telemetry.pv = result.pv;
      state.telemetry.battery = result.battery;
      state.telemetry.inverter = result.inverter;
      state.telemetry.grid = result.grid;
      state.telemetry.eps = result.eps;
      state.telemetry.normalLoad = result.normalLoad;
    }

    const batPower = result ? result._internals.batPower : 0;
    const pv1Healthy = result ? result._internals.pv1Healthy : false;
    const pv2Healthy = result ? result._internals.pv2Healthy : false;
    const pv1Power = result ? result._internals.pv1Power : 0;
    const pv2Power = result ? result._internals.pv2Power : 0;
    const pv1Voltage = result ? result.pv.pv1Voltage : 0;
    const pv2Voltage = result ? result.pv.pv2Voltage : 0;
    const batteryHealthy = result ? result._internals.batteryHealthy : false;
    const busGAlive = result ? result._internals.busGAlive : false;
    const gridPower = result ? result.grid.p : 0;
    const inverterGridAvailable = result ? result._internals.inverterGridAvailable : false;
    const normalPower = result ? result._internals.normalPower : 0;
    const bypassPower = result ? result._internals.bypassPower : 0;
    const b = state.breakers;
    const f = state.failures;
    const epsPowered = result ? result._internals.epsPowered : false;
    const inverterPowered = result ? result._internals.inverterPowered : false;
    const epsPower = result ? result._internals.epsPower : 0;
    const normalPowered = result ? result._internals.normalPowered : false;
    const groundFaultActive = f.ground_fault;

    // Update battery SOC integration
    if (batPower !== 0) {
      const batWh = activeProfile?.equipment?.batteryBank?.capacity_Wh
        ?? activeProfile?.equipment?.batteryStorage?.bankRatings?.energyTotal_Wh
        ?? activeProfile?.systemRatings?.batteryNominalCapacity_Wh
        ?? 5120;
      const deltaSOC = (batPower / (batWh * 3600)) * 100 * 0.1;
      state.batterySOC = Math.max(10, Math.min(100, state.batterySOC + deltaSOC));
    }

    // Relay telemetry to SLD
    if (window.SLDSchematic && typeof window.SLDSchematic.updateTelemetry === 'function') {
      window.SLDSchematic.updateTelemetry({
        ...state.telemetry,
        string1: { voltage_V: state.telemetry.pv?.v || 0, power_W: pv1Power },
        string2: { voltage_V: state.telemetry.pv?.v || 0, power_W: pv2Power },
        batteryVoltage_V: state.telemetry.battery?.v || 0,
        batteryPower_W: state.telemetry.battery?.p || 0,
        gridVoltage_V: state.telemetry.grid?.v || 0,
        gridPortPower_W: state.telemetry.grid?.p || 0,
        epsVoltage_V: state.telemetry.eps?.v || 0,
        epsPortPower_W: state.telemetry.eps?.p || 0
      });
    }

    // Relay to 3D Scene instance
    if (window.sceneInstance) {
      // 1. Power flows along animated cables with canonical IDs
      if (typeof window.sceneInstance.updatePowerFlows === 'function') {
        const pv1Active = pv1Healthy && pv1Power > 20;
        const pv2Active = pv2Healthy && pv2Power > 20;
        const batActive = batteryHealthy && Math.abs(batPower) > 20;
        const gridInActive = busGAlive && gridPower > 20;
        const invGridActive = inverterGridAvailable && Math.abs(gridPower - normalPower - bypassPower) > 20;
        const bypassActive = busGAlive && (b.qbp_mcb !== false) && (state.sbyPosition === 'II') && epsPowered;
        const invEpsActive = inverterPowered && (b.qe_mcb !== false && b.eps_mcb !== false) && (state.sbyPosition === 'I') && epsPowered;
        const critActive = epsPowered && epsPower > 10;
        const nonCritActive = normalPowered && normalPower > 10;
        const groundFaultActive = f.ground_fault;

        window.sceneInstance.updatePowerFlows({
          pv1: { active: pv1Active, watts: pv1Power },
          pv2: { active: pv2Active, watts: pv2Power },
          battery: { active: batActive, watts: -batPower },
          grid_in: { active: gridInActive, watts: Math.max(0, gridPower) },
          inv_grid: { active: invGridActive, watts: inverterGridAvailable ? (normalPower + bypassPower - gridPower) : 0 },
          grid_bypass: { active: bypassActive, watts: bypassPower },
          inv_eps: { active: invEpsActive, watts: epsPower },
          load_critical: { active: critActive, watts: epsPower },
          load_non_critical: { active: nonCritActive, watts: normalPower },
          earthing: { active: groundFaultActive, watts: groundFaultActive ? 500 : 0 }
        });
      }

      // 2. Dynamic OLED display on the 3D Inverter
      if (typeof window.sceneInstance.updateOLED === 'function') {
        window.sceneInstance.updateOLED({
          pv1Power: Math.round(pv1Power),
          pv2Power: Math.round(pv2Power),
          pv1Volt: pv1Voltage,
          pv2Volt: pv2Voltage,
          batSoc: Math.round(state.batterySOC),
          batVolt: state.telemetry.battery.v,
          batPower: state.telemetry.battery.p,
          gridVolt: state.telemetry.grid.v,
          gridFreq: state.telemetry.inverter.freq,
          gridPower: state.telemetry.grid.p,
          epsPower: state.telemetry.eps.p,
          mode: !inverterPowered ? 'OFF' : (inverterGridAvailable ? 'GRID' : 'EPS')
        });
      }
    }
  }

  // ============================================================================
  // 4. UI DOM BINDINGS & CONTROLLER
  // ============================================================================
  function updateHUDView() {
    // 1. Solar (خورشیدی) Segment
    const pvP = document.getElementById('hud-pv-p');
    const pvV = document.getElementById('hud-pv-v');
    const pvI = document.getElementById('hud-pv-i');
    const pvDot = document.getElementById('hud-pv-dot');
    if (pvP) pvP.textContent = Math.round(state.telemetry.pv.p);
    if (pvV) pvV.textContent = (state.telemetry.pv.v || 0) + ' V';
    if (pvI) pvI.textContent = (state.telemetry.pv.i || 0) + ' A';
    if (pvDot) {
      if (state.failures.pv_string_open) {
        pvDot.className = 'badge-status-dot danger';
      } else if (state.telemetry.pv.p > 50) {
        pvDot.className = 'badge-status-dot active';
      } else {
        pvDot.className = 'badge-status-dot offline';
      }
    }

    // 2. Battery (ذخیره‌ساز) Segment
    const batP = document.getElementById('hud-bat-p');
    const batSoc = document.getElementById('hud-bat-soc');
    const batV = document.getElementById('hud-bat-v');
    const batState = document.getElementById('hud-bat-state');
    const batDot = document.getElementById('hud-bat-dot');
    const bp = Math.round(state.telemetry.battery.p);
    if (batP) {
      batP.textContent = (bp >= 0 ? '+' : '') + bp;
    }
    const socRound = Math.round(state.batterySOC);
    if (batSoc) batSoc.textContent = socRound + '%';
    if (batV) batV.textContent = (state.telemetry.battery.v || 0) + ' V';
    if (batState) {
      let stateLabel = 'آماده‌به‌کار';
      if (socRound <= 10 && bp <= 0) {
        stateLabel = 'تخلیه کامل';
      } else if (bp > 50) {
        stateLabel = 'در حال شارژ';
      } else if (bp < -50) {
        stateLabel = 'در حال دشارژ';
      } else if (state.failures.battery_thermal || state.failures.bms_comm_fault) {
        stateLabel = 'خطای BMS';
      } else if (state.breakers.qb_battery === false) {
        stateLabel = 'قطع کلید QB';
      }
      batState.textContent = stateLabel;
    }
    if (batDot) {
      if (state.failures.battery_thermal || state.failures.bms_comm_fault) {
        batDot.className = 'badge-status-dot danger';
      } else if (socRound <= 15) {
        batDot.className = 'badge-status-dot warning';
      } else if (Math.abs(bp) > 50) {
        batDot.className = 'badge-status-dot active';
      } else {
        batDot.className = 'badge-status-dot';
      }
    }

    // 3. Grid (شبکه سراسری) Segment
    const gridP = document.getElementById('hud-grid-p');
    const gridV = document.getElementById('hud-grid-v');
    const gridDirection = document.getElementById('hud-grid-direction');
    const gridDot = document.getElementById('hud-grid-dot');
    const gp = Math.round(state.telemetry.grid.p);
    if (gridP) {
      gridP.textContent = (gp >= 0 ? '+' : '') + gp;
    }
    if (gridV) gridV.textContent = (state.telemetry.grid.v || 0) + ' V';
    if (gridDirection) {
      if (state.telemetry.grid.isBlackout || state.breakers.q_grid === false) {
        gridDirection.textContent = 'قطع شبکه';
      } else if (gp > 50) {
        gridDirection.textContent = 'واردات از شبکه';
      } else if (gp < -50) {
        gridDirection.textContent = 'صادرات به شبکه';
      } else {
        gridDirection.textContent = 'شناور (تزریق صفر)';
      }
    }
    if (gridDot) {
      if (state.telemetry.grid.isBlackout || state.breakers.q_grid === false) {
        gridDot.className = 'badge-status-dot danger';
      } else if (Math.abs(gp) > 50) {
        gridDot.className = 'badge-status-dot active';
      } else {
        gridDot.className = 'badge-status-dot';
      }
    }

    // 4. Loads (بارهای مصرفی) Segment
    const loadP = document.getElementById('hud-load-p');
    const epsP = document.getElementById('hud-eps-p');
    const epsV = document.getElementById('hud-eps-v');
    const epsStatus = document.getElementById('hud-eps-status');
    const epsDot = document.getElementById('hud-eps-dot');
    const loadStatus = document.getElementById('hud-load-status');
    const normalP = Math.round(state.telemetry.normalLoad.p || 0);
    const epsPVal = Math.round(state.telemetry.eps.p || 0);
    const totalLoadP = normalP + epsPVal;

    if (loadP) loadP.textContent = totalLoadP;
    if (epsP) epsP.textContent = epsPVal;
    if (epsV) epsV.textContent = (state.telemetry.eps.v || 230) + ' V';
    if (loadStatus) {
      loadStatus.textContent = state.telemetry.normalLoad.isPowered ? 'عادی: برق‌دار' : 'عادی: بی‌برق';
    }
    if (epsStatus) {
      epsStatus.textContent = state.telemetry.eps.isPowered ? 'پایدار' : 'قطع';
    }
    if (epsDot) {
      epsDot.className = 'badge-status-dot ' + (state.telemetry.eps.isPowered ? 'active' : 'danger');
    }
    const segLoads = document.getElementById('seg-loads');
    if (segLoads) {
      segLoads.title = `مجموع بار مصرفی: ${totalLoadP} وات (عادی: ${normalP}W | اضطراری EPS: ${epsPVal}W) — کلیک برای جزئیات`;
    }

    // 5. SBY Changeover Switch Badge
    const sbyPosEl = document.getElementById('hud-sby-pos');
    const sbyDescEl = document.getElementById('hud-sby-desc');
    const sbyDotEl = document.getElementById('hud-sby-dot');
    if (sbyPosEl) {
      if (state.sbyPosition === 'I') {
        sbyPosEl.textContent = 'I (اینورتر)';
        sbyPosEl.style.color = 'var(--eps-magenta)';
        if (sbyDescEl) sbyDescEl.textContent = 'خروجی اینورتر EPS';
        if (sbyDotEl) sbyDotEl.className = 'badge-status-dot active';
      } else if (state.sbyPosition === '0') {
        sbyPosEl.textContent = '0 (قطع)';
        sbyPosEl.style.color = 'var(--alert-red)';
        if (sbyDescEl) sbyDescEl.textContent = 'ایزولاسیون کامل / خاموش';
        if (sbyDotEl) sbyDotEl.className = 'badge-status-dot danger';
      } else if (state.sbyPosition === 'II') {
        sbyPosEl.textContent = 'II (بای‌پاس)';
        sbyPosEl.style.color = 'var(--grid-blue)';
        if (sbyDescEl) sbyDescEl.textContent = 'تغذیه مستقیم از شبکه';
        if (sbyDotEl) sbyDotEl.className = 'badge-status-dot active';
      }
    }

    // 6. Inverter Telemetry (Backward Compatibility)
    const invP = document.getElementById('hud-inv-p');
    const invFreq = document.getElementById('hud-inv-freq');
    const invEff = document.getElementById('hud-inv-eff');
    const invStatus = document.getElementById('hud-inv-status');
    const invDot = document.getElementById('hud-inv-dot');
    if (invP) invP.textContent = state.telemetry.inverter.pOut;
    if (invFreq) invFreq.textContent = state.telemetry.inverter.freq.toFixed(1) + ' Hz';
    if (invEff) invEff.textContent = state.telemetry.inverter.efficiency + '%';
    if (invStatus) invStatus.textContent = state.telemetry.inverter.status;
    if (invDot) {
      invDot.className = 'badge-status-dot ' + (state.telemetry.inverter.freq > 0 ? 'active' : 'offline');
    }

    // 7. Dynamic Inspector Feed Summary
    if (state.activeInspectorComponent) {
      updateInspectorFeedSummary(state.activeInspectorComponent);
    }
  }

  // ============================================================================
  // Return-to-previous-view camera history stack (Step 11)
  // ============================================================================
  function pushCameraHistory() {
    if (window.sceneInstance) {
      if (typeof window.sceneInstance.pushCameraState === 'function') {
        window.sceneInstance.pushCameraState();
      } else {
        if (!window.sceneInstance._cameraStack) window.sceneInstance._cameraStack = [];
        if (window.sceneInstance.camera && window.sceneInstance.controls) {
          window.sceneInstance._cameraStack.push({
            pos: window.sceneInstance.camera.position.clone(),
            target: window.sceneInstance.controls.target.clone()
          });
          if (window.sceneInstance._cameraStack.length > 10) {
            window.sceneInstance._cameraStack.shift();
          }
        }
      }
    }
    const btnPrev = document.getElementById('btn-camera-prev');
    if (btnPrev) btnPrev.style.display = 'inline-flex';
  }

  function popCameraHistory() {
    let hasMore = false;
    if (window.sceneInstance) {
      if (typeof window.sceneInstance.popCameraState === 'function') {
        const res = window.sceneInstance.popCameraState();
        if (typeof res === 'boolean') {
          hasMore = res;
        } else if (typeof res === 'number') {
          hasMore = res > 0;
        } else if (typeof window.sceneInstance.hasCameraHistory === 'function') {
          hasMore = window.sceneInstance.hasCameraHistory();
        } else {
          hasMore = false;
        }
      } else if (window.sceneInstance._cameraStack && window.sceneInstance._cameraStack.length > 0) {
        const prev = window.sceneInstance._cameraStack.pop();
        if (prev) {
          if (typeof window.sceneInstance._animateCamera === 'function') {
            window.sceneInstance._animateCamera(prev.pos, prev.target, 900);
          } else if (window.sceneInstance.camera && window.sceneInstance.controls) {
            if (typeof window.sceneInstance.camera.position?.copy === 'function') {
              window.sceneInstance.camera.position.copy(prev.pos);
            }
            if (typeof window.sceneInstance.controls.target?.copy === 'function') {
              window.sceneInstance.controls.target.copy(prev.target);
            }
            if (typeof window.sceneInstance.controls.update === 'function') {
              window.sceneInstance.controls.update();
            }
          }
        }
        hasMore = window.sceneInstance._cameraStack.length > 0;
      }
    }
    const btnPrev = document.getElementById('btn-camera-prev');
    if (btnPrev && !hasMore) {
      btnPrev.style.display = 'none';
    }
    return hasMore;
  }

  // ============================================================================
  // 5. SLIDERS, OPERATING MODES & CAMERA PRESETS
  // ============================================================================
  function setupCockpitControls() {
    // Environmental & Load Sliders
    bindSlider('slider-irradiance', 'val-irradiance', (val) => {
      state.irradiance = parseFloat(val);
      return val + ' W/m²';
    });

    bindSlider('slider-temp', 'val-temp', (val) => {
      state.temperature = parseFloat(val);
      return val + ' °C';
    });

    bindSlider('slider-normal-load', 'val-normal-load', (val) => {
      state.normalLoadPower = parseFloat(val);
      return val + ' W';
    });

    bindSlider('slider-critical-load', 'val-critical-load', (val) => {
      state.criticalLoadPower = parseFloat(val);
      return val + ' W';
    });

    bindSlider('slider-soc', 'val-soc', (val) => {
      state.batterySOC = parseFloat(val);
      return val + '%';
    });

    // Reset Cockpit Button
    const btnResetCockpit = document.getElementById('btn-reset-cockpit');
    if (btnResetCockpit) {
      btnResetCockpit.addEventListener('click', () => {
        sound.playClick();
        resetCockpitDefaults();
      });
    }

    // Mode Toggle Buttons
    const modeButtons = document.querySelectorAll('.mode-btn');
    modeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        sound.playClick();
        modeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const mode = btn.getAttribute('data-mode');
        setOperatingMode(mode);
      });
    });

    // Camera Viewpoint Buttons (V12 Fix: genuine viewpoints only)
    const camButtons = document.querySelectorAll('.btn-viewpoint[data-viewpoint]');
    const presetMap = {
      overview: 'OVERVIEW',
      pv: 'ROOFTOP',
      dc_box: 'DC_BOX',
      dc: 'DC_BOX',
      inverter: 'INVERTER',
      battery: 'BATTERY',
      main_board: 'MDB_GRID',
      eps_board: 'EPS_BACKUP',
      ac_interior: 'AC_PANEL_INTERIOR',
      ac_wiring: 'AC_PANEL_WIRING',
      ac_terminals: 'AC_TERMINALS',
      eps_interior: 'EPS_PANEL_INTERIOR'
    };

    // Wire return to previous view button
    const btnCameraPrev = document.getElementById('btn-camera-prev');
    if (btnCameraPrev) {
      btnCameraPrev.addEventListener('click', () => {
        sound.playClick();
        popCameraHistory();
      });
    }

    camButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        sound.playClick();
        camButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const viewpoint = btn.getAttribute('data-viewpoint');
        if (!viewpoint) return; // button shares the class but is not a viewpoint
        const mappedPreset = presetMap[viewpoint] || viewpoint;

        pushCameraHistory();

        if (window.sceneInstance && typeof window.sceneInstance.setCameraPreset === 'function') {
          window.sceneInstance.setCameraPreset(mappedPreset);
        }
      });
    });

    // 3D Viewport Quick Action Toolbar Bindings
    const quickDcBox = document.getElementById('quick-btn-dc-box');
    const quickDcDoor = document.getElementById('quick-btn-dc-door');
    const quickMdb = document.getElementById('quick-btn-mdb');
    const quickWiring = document.getElementById('quick-btn-wiring');
    const quickTerminals = document.getElementById('quick-btn-terminals');
    const quickEps = document.getElementById('quick-btn-eps');
    const quickDoor = document.getElementById('quick-btn-door');
    const quickOverview = document.getElementById('quick-btn-overview');

    const triggerViewpoint = (vp) => {
      sound.playClick();
      const targetBtn = document.querySelector(`.btn-viewpoint[data-viewpoint="${vp}"]`);
      if (targetBtn) {
        targetBtn.click();
      } else if (window.sceneInstance) {
        pushCameraHistory();
        window.sceneInstance.setCameraPreset(presetMap[vp] || vp);
      }
    };

    if (quickDcBox) {
      quickDcBox.addEventListener('click', () => {
        triggerViewpoint('dc_box');
        if (window.sceneInstance && typeof window.sceneInstance.openDCDoor === 'function') {
          window.sceneInstance.openDCDoor(true);
        }
      });
    }
    if (quickDcDoor) {
      quickDcDoor.addEventListener('click', () => {
        sound.playClick();
        if (window.sceneInstance && typeof window.sceneInstance.toggleDCDoor === 'function') {
          window.sceneInstance.toggleDCDoor();
        }
      });
    }
    if (quickMdb) quickMdb.addEventListener('click', () => triggerViewpoint('ac_interior'));
    if (quickWiring) quickWiring.addEventListener('click', () => triggerViewpoint('ac_wiring'));
    if (quickTerminals) quickTerminals.addEventListener('click', () => triggerViewpoint('ac_terminals'));
    if (quickEps) quickEps.addEventListener('click', () => triggerViewpoint('eps_interior'));
    if (quickOverview) quickOverview.addEventListener('click', () => triggerViewpoint('overview'));

    if (quickDoor) {
      quickDoor.addEventListener('click', () => {
        sound.playClick();
        if (window.sceneInstance) {
          window.sceneInstance.toggleMDBDoor();
          window.sceneInstance.toggleEPSDoor();
        }
      });
    }

    // Door toggle buttons in left panel
    const btnToggleDcDoor = document.getElementById('btn-toggle-dc-door');
    if (btnToggleDcDoor) {
      btnToggleDcDoor.addEventListener('click', () => {
        sound.playClick();
        if (window.sceneInstance && typeof window.sceneInstance.toggleDCDoor === 'function') {
          window.sceneInstance.toggleDCDoor();
        }
      });
    }

    const btnToggleMdbDoor = document.getElementById('btn-toggle-mdb-door');
    if (btnToggleMdbDoor) {
      btnToggleMdbDoor.addEventListener('click', () => {
        sound.playClick();
        if (window.sceneInstance && typeof window.sceneInstance.toggleMDBDoor === 'function') {
          window.sceneInstance.toggleMDBDoor();
        }
      });
    }

    const btnToggleEpsDoor = document.getElementById('btn-toggle-eps-door');
    if (btnToggleEpsDoor) {
      btnToggleEpsDoor.addEventListener('click', () => {
        sound.playClick();
        if (window.sceneInstance && typeof window.sceneInstance.toggleEPSDoor === 'function') {
          window.sceneInstance.toggleEPSDoor();
        }
      });
    }

    // Listen for doorChange events from 3D scene
    if (window.sceneInstance && typeof window.sceneInstance.on === 'function') {
      window.sceneInstance.on('doorChange', (data) => {
        if (data.panel === 'dc') {
          if (btnToggleDcDoor) {
            btnToggleDcDoor.textContent = data.isOpen ? '🚪 بستن درب کمباینر DC' : '🚪 درب کمباینر DC';
          }
          if (quickDcDoor) {
            quickDcDoor.textContent = data.isOpen ? '🚪 بستن درب کمباینر' : '🚪 درب کمباینر DC';
          }
        } else if (data.panel === 'mdb') {
          if (btnToggleMdbDoor) {
            btnToggleMdbDoor.textContent = data.isOpen ? '🚪 بستن درب MDB' : '🚪 درب تابلو MDB';
          }
          if (quickDoor) {
            quickDoor.textContent = data.isOpen ? '🚪 بستن درب تابلو' : '🚪 باز کردن درب تابلو';
          }
        } else if (data.panel === 'eps') {
          if (btnToggleEpsDoor) {
            btnToggleEpsDoor.textContent = data.isOpen ? '🚪 بستن درب EPS' : '🚪 درب تابلو EPS';
          }
        }
        if (typeof refreshDrawerOperationState === 'function') {
          refreshDrawerOperationState();
        }
      });
    }

    // 8 Bottom Filter Bar Buttons
    const filterButtons = document.querySelectorAll('.flow-filter-btn');
    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        sound.playClick();
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filter = btn.getAttribute('data-filter');
        state.currentFilter = filter;
        if (window.SLDSchematic) {
          window.SLDSchematic.setFlowFilter(filter);
        }
      });
    });

    // Telemetry Strip Segment & SBY Pill Interactions (Step 13)
    const hudSbyBadge = document.getElementById('hud-sby-badge');
    if (hudSbyBadge && !hudSbyBadge._bound) {
      hudSbyBadge._bound = true;
      hudSbyBadge.addEventListener('click', () => {
        const cur = state.sbyPosition || 'I';
        const next = cur === 'I' ? '0' : (cur === '0' ? 'II' : 'I');
        if (window.AppOrchestrator?.onSbyStateChanged) {
          window.AppOrchestrator.onSbyStateChanged(next, 'hud');
        } else {
          state.sbyPosition = next;
          sound.playSbySwitch(next);
          computeElectricalState();
          updateHUDView();
        }
      });
      hudSbyBadge.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          hudSbyBadge.click();
        }
      });
    }

    const segMap = {
      'seg-solar': 'solar_arrays',
      'seg-battery': 'battery_bank',
      'seg-grid': 'main_distribution_board',
      'seg-loads': 'essential_db'
    };
    Object.entries(segMap).forEach(([id, compId]) => {
      const el = document.getElementById(id);
      if (el && !el._bound) {
        el._bound = true;
        el.addEventListener('click', () => {
          sound.playClick();
          if (typeof renderInspectorComponent === 'function') {
            renderInspectorComponent(compId, true);
          }
        });
        el.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            el.click();
          }
        });
      }
    });

    // Cockpit Drawer Collapse/Expand (Step 14)
    const cockpitPanel = document.getElementById('left-cockpit-panel');
    const btnToggleCockpit = document.getElementById('btn-toggle-cockpit');
    const btnToggleCockpitHeader = document.getElementById('btn-toggle-cockpit-header');
    const btnCloseCockpit = document.getElementById('btn-close-cockpit');

    const toggleCockpit = (forceState) => {
      sound.playClick();
      if (!cockpitPanel) return;
      const isCurrentlyCollapsed = cockpitPanel.classList.contains('collapsed') || cockpitPanel.classList.contains('drawer-collapsed');
      const targetCollapsed = forceState !== undefined ? !forceState : !isCurrentlyCollapsed;
      if (targetCollapsed) {
        cockpitPanel.classList.add('collapsed');
        cockpitPanel.classList.add('drawer-collapsed');
        if (btnToggleCockpit) btnToggleCockpit.classList.remove('active');
        if (btnToggleCockpitHeader) btnToggleCockpitHeader.classList.remove('active');
      } else {
        cockpitPanel.classList.remove('collapsed');
        cockpitPanel.classList.remove('drawer-collapsed');
        if (btnToggleCockpit) btnToggleCockpit.classList.add('active');
        if (btnToggleCockpitHeader) btnToggleCockpitHeader.classList.add('active');
      }
    };

    if (btnToggleCockpit) btnToggleCockpit.addEventListener('click', () => toggleCockpit());
    if (btnToggleCockpitHeader) btnToggleCockpitHeader.addEventListener('click', () => toggleCockpit());
    if (btnCloseCockpit) btnCloseCockpit.addEventListener('click', () => toggleCockpit(false));

    // Cockpit Accordion Sections (Scenario, Switching, Faults)
    const accordionHeaders = document.querySelectorAll('.cockpit-accordion-header');
    accordionHeaders.forEach(header => {
      header.addEventListener('click', () => {
        sound.playClick();
        const item = header.closest('.cockpit-accordion-item');
        if (item) {
          item.classList.toggle('active');
        }
      });
    });
  }

  function bindSlider(sliderId, labelId, formatter) {
    const slider = document.getElementById(sliderId);
    const label = document.getElementById(labelId);
    if (!slider || !label) return;

    slider.addEventListener('input', (e) => {
      label.textContent = formatter(e.target.value);
      computeElectricalState();
      updateHUDView();
    });
  }

  function resetCockpitDefaults() {
    updateSlider('slider-irradiance', 'val-irradiance', 850, '850 W/m²');
    updateSlider('slider-temp', 'val-temp', 25, '25 °C');
    updateSlider('slider-normal-load', 'val-normal-load', 2200, '2200 W');
    updateSlider('slider-critical-load', 'val-critical-load', 1500, '1500 W');
    updateSlider('slider-soc', 'val-soc', 75, '75%');
    state.irradiance = 850;
    state.temperature = 25;
    state.normalLoadPower = 2200;
    state.criticalLoadPower = 1500;
    state.batterySOC = 75;
  }

  function updateSlider(id, labelId, val, formattedText) {
    const slider = document.getElementById(id);
    const label = document.getElementById(labelId);
    if (slider) slider.value = val;
    if (label) label.textContent = formattedText;
  }

  function setOperatingMode(mode) {
    state.operatingMode = mode;
    if (mode === 'normal_day') {
      updateSlider('slider-irradiance', 'val-irradiance', 850, '850 W/m²');
      state.irradiance = 850;
      showScenarioBanner('حالت روز آفتابی: تولید خورشیدی، تأمین بارهای ساختمان، شارژ باتری و صادرات مازاد.');
    } else if (mode === 'evening_peak') {
      updateSlider('slider-irradiance', 'val-irradiance', 0, '0 W/m²');
      state.irradiance = 0;
      showScenarioBanner('پیک مصرف عصر: خورشید غروب کرده، باتری تخلیه شده و کسری از شبکه تأمین می‌شود.');
    } else if (mode === 'grid_outage') {
      showScenarioBanner('قطع شبکه سراسری (جزیره‌ای): اینورتر ظرف ۲۰ms بارهای بحرانی (EPS) را از باتری تغذیه می‌کند.');
    } else if (mode === 'emergency_backup') {
      showScenarioBanner('حالت پشتیبان اضطراری: ذخیره باتری در بالاترین سطح نگه داشته می‌شود.');
    } else if (mode === 'night_charge') {
      updateSlider('slider-irradiance', 'val-irradiance', 0, '0 W/m²');
      state.irradiance = 0;
      showScenarioBanner('شارژ شبانه با تعرفه کم: شارژ اقتصادی بانک باتری در ساعات کم‌باری شبکه.');
    }
    computeElectricalState();
    updateHUDView();
  }

  // ============================================================================
  // 6. 9 FAILURE SIMULATOR CONTROLS
  // ============================================================================
  function setupFailureSimulator() {
    const failureToggles = document.querySelectorAll('.failure-toggle-input');
    failureToggles.forEach(input => {
      input.addEventListener('change', (e) => {
        const failureKey = e.target.getAttribute('data-failure');
        const isActive = e.target.checked;
        state.failures[failureKey] = isActive;

        if (isActive) {
          sound.playAlarm();
          handleFailureTriggered(failureKey);
        } else {
          sound.playClick();
          hideScenarioBanner();
        }

        computeElectricalState();
        updateHUDView();
      });
    });
  }

  function handleFailureTriggered(failureKey) {
    const messages = {
      dc_arc_fault: 'هشدار خطای قوس الکتریکی DC: سیستم AFCI اینورتر استرینگ را قطع کرد!',
      surge_overvoltage: 'اضافه ولتاژ صاعقه گذرا: سرج ارستر DC تریپ خورد و انرژی را به زمین تخلیه کرد.',
      grid_blackout: 'خاموشی کامل شبکه توزیع سراسری: اینورتر به حالت اضطراری EPS شیفت پیدا کرد.',
      grid_brownout: 'افت شدید ولتاژ شبکه (Brownout به ۱۶۵ ولت): افت راندمان و حفاظت کیفیت توان.',
      ground_fault: 'خطای نشتی زمین (RCD Trip): کلید محافظ جان خروجی اضطراری بلافاصله قطع شد.',
      battery_thermal: 'افزایش دمای بحرانی باتری / خطای BMS: کلید OCPD باتری برای حفاظت قطع گردید.',
      eps_overload: 'اضافه بار خروجی بارهای بحرانی (>5000W): کلید EPS MCB جهت حفاظت تریپ خورد.',
      blown_pv_fuse: 'سوختن فیوز استرینگ gPV: جریان مدار ورودی خورشیدی به صفر کاهش یافت.',
      ct_inverted: 'نصب معکوس ترانسفورمر جریان (CT): اینورتر مصرف را صادرات تلقی می‌کند!'
    };

    showScenarioBanner(messages[failureKey] || 'خطای فنی در سیستم شبیه‌سازی شد.');
  }

  function showScenarioBanner(msg) {
    const banner = document.getElementById('scenario-banner');
    const textEl = document.getElementById('scenario-text');
    if (!banner || !textEl) return;

    textEl.textContent = msg;
    banner.classList.remove('hidden');
  }

  function hideScenarioBanner() {
    const banner = document.getElementById('scenario-banner');
    if (banner) banner.classList.add('hidden');
  }

  // ============================================================================
  // 7. RIGHT INSPECTOR DRAWER (12 Standard Engineering Fields & Operations)
  // ============================================================================
  let activeSelectedObjectData = null;

  function resolveSwitchgearTargetId(id) {
    if (!id) return id;
    if (id === 'dc_isolator' || id === 'qpv_isolator' || id === 'sld-dc-iso-1') return 'dc_iso_1';
    if (id === 'sld-dc-iso-2') return 'dc_iso_2';
    if (id === 'battery_ocpd' || id === 'battery_qb' || id === 'sld-bat-fuse') return 'bat_breaker';
    if (id === 'grid_mcb' || id === 'q0_mcb' || id === 'grid_incomer_mcb' || id === 'sld-q0') return 'grid_mcb';
    if (id === 'eps_mcb' || id === 'qe_mcb' || id === 'sld-qe') return 'eps_mcb';
    if (id === 'qo_mcb' || id === 'eps_incomer_mcb' || id === 'sld-qo') return 'qo_mcb';
    if (id === 'qbp_mcb' || id === 'grid_bypass_mcb' || id === 'sld-qbp') return 'qbp_mcb';
    if (id === 'eps_rcd' || id === 'sld-rcd') return 'eps_rcd';
    return id;
  }

  function getBreakerCurrentState(id) {
    if (!id) return undefined;
    const targetId = resolveSwitchgearTargetId(id);
    if (window.sceneInstance?.switchgear) {
      const sw = window.sceneInstance.switchgear[targetId] || window.sceneInstance.switchgear[id];
      if (sw && sw.state !== undefined) {
        return sw.state;
      }
    }
    if (state.breakers) {
      if (state.breakers[id] !== undefined) return state.breakers[id];
      if (state.breakers[targetId] !== undefined) return state.breakers[targetId];
    }
    return undefined;
  }

  function manageDrawerOpContainer(data) {
    const opContainer = document.getElementById('drawer-op-container');
    if (!opContainer) return;

    if (!data || !data.action) {
      opContainer.style.display = 'none';
      opContainer.innerHTML = '';
      activeSelectedObjectData = null;
      return;
    }

    activeSelectedObjectData = data;

    if (data.action === 'toggle') {
      if (data.id === 'sby_switch') {
        opContainer.style.display = 'flex';
        opContainer.innerHTML = `
          <div class="drawer-op-info">
            <span class="op-info-icon">ℹ️</span>
            <span>موقعیت کلید تبدیل SBY صرفاً از طریق دکمه‌های پنل فرمان (I / 0 / II) تغییر می‌کند.</span>
          </div>
        `;
        return;
      }

      opContainer.style.display = 'flex';
      const curState = getBreakerCurrentState(data.id);
      let stateLabel = '';
      let stateClass = '';
      let badgeHtml = '';

      if (curState === true) {
        stateLabel = ' [وضعیت: وصل / ON]';
        stateClass = 'state-on';
        badgeHtml = `<span class="btn-op-state state-on">وصل (ON)</span>`;
      } else if (curState === false) {
        stateLabel = ' [وضعیت: قطع / OFF]';
        stateClass = 'state-off';
        badgeHtml = `<span class="btn-op-state state-off">قطع (OFF)</span>`;
      }

      opContainer.innerHTML = `
        <button id="btn-drawer-operate-breaker" class="btn-drawer-operate ${stateClass}" title="تغییر وضعیت کلید در مدل سه‌بعدی">
          <span class="btn-op-icon">⚡</span>
          <span class="btn-op-text">قطع / وصل کلید (Toggle)${stateLabel}</span>
          ${badgeHtml}
        </button>
      `;

      const btn = document.getElementById('btn-drawer-operate-breaker');
      if (btn) {
        btn.addEventListener('click', () => {
          if (sound && typeof sound.playBreakerSnap === 'function') {
            sound.playBreakerSnap();
          } else if (sound && typeof sound.playClick === 'function') {
            sound.playClick();
          }
          if (window.sceneInstance && typeof window.sceneInstance.toggleBreaker3D === 'function') {
            window.sceneInstance.toggleBreaker3D(data.id);
          }
          setTimeout(() => {
            manageDrawerOpContainer(data);
          }, 60);
        });
      }
      return;
    }

    if (data.action === 'toggle_dc_door') {
      opContainer.style.display = 'flex';
      const isOpen = !!window.sceneInstance?.dcDoorOpen;
      const badgeHtml = isOpen 
        ? `<span class="btn-op-state state-open">درب باز است</span>` 
        : `<span class="btn-op-state state-closed">درب بسته است</span>`;

      opContainer.innerHTML = `
        <button id="btn-drawer-operate-dc-door" class="btn-drawer-operate btn-door" title="باز / بستن درب تابلوی DC">
          <span class="btn-op-icon">🚪</span>
          <span class="btn-op-text">باز / بستن درب تابلوی DC</span>
          ${badgeHtml}
        </button>
      `;

      const btn = document.getElementById('btn-drawer-operate-dc-door');
      if (btn) {
        btn.addEventListener('click', () => {
          if (sound && typeof sound.playClick === 'function') sound.playClick();
          if (window.sceneInstance && typeof window.sceneInstance.toggleDCDoor === 'function') {
            window.sceneInstance.toggleDCDoor();
          }
          setTimeout(() => {
            manageDrawerOpContainer(data);
          }, 60);
        });
      }
      return;
    }

    if (data.action === 'toggle_mdb_door') {
      opContainer.style.display = 'flex';
      const isOpen = !!window.sceneInstance?.mdbDoorOpen;
      const badgeHtml = isOpen 
        ? `<span class="btn-op-state state-open">درب باز است</span>` 
        : `<span class="btn-op-state state-closed">درب بسته است</span>`;

      opContainer.innerHTML = `
        <button id="btn-drawer-operate-mdb-door" class="btn-drawer-operate btn-door" title="باز / بستن درب تابلوی اصلی MDB">
          <span class="btn-op-icon">🚪</span>
          <span class="btn-op-text">باز / بستن درب تابلوی اصلی MDB</span>
          ${badgeHtml}
        </button>
      `;

      const btn = document.getElementById('btn-drawer-operate-mdb-door');
      if (btn) {
        btn.addEventListener('click', () => {
          if (sound && typeof sound.playClick === 'function') sound.playClick();
          if (window.sceneInstance && typeof window.sceneInstance.toggleMDBDoor === 'function') {
            window.sceneInstance.toggleMDBDoor();
          }
          setTimeout(() => {
            manageDrawerOpContainer(data);
          }, 60);
        });
      }
      return;
    }

    if (data.action === 'toggle_eps_door') {
      opContainer.style.display = 'flex';
      const isOpen = !!window.sceneInstance?.epsDoorOpen;
      const badgeHtml = isOpen 
        ? `<span class="btn-op-state state-open">درب باز است</span>` 
        : `<span class="btn-op-state state-closed">درب بسته است</span>`;

      opContainer.innerHTML = `
        <button id="btn-drawer-operate-eps-door" class="btn-drawer-operate btn-door" title="باز / بستن درب تابلوی بارهای ضروری EPS">
          <span class="btn-op-icon">🚪</span>
          <span class="btn-op-text">باز / بستن درب تابلوی بارهای ضروری EPS</span>
          ${badgeHtml}
        </button>
      `;

      const btn = document.getElementById('btn-drawer-operate-eps-door');
      if (btn) {
        btn.addEventListener('click', () => {
          if (sound && typeof sound.playClick === 'function') sound.playClick();
          if (window.sceneInstance && typeof window.sceneInstance.toggleEPSDoor === 'function') {
            window.sceneInstance.toggleEPSDoor();
          }
          setTimeout(() => {
            manageDrawerOpContainer(data);
          }, 60);
        });
      }
      return;
    }

    // Otherwise: hide #drawer-op-container
    opContainer.style.display = 'none';
    opContainer.innerHTML = '';
    activeSelectedObjectData = null;
  }

  function refreshDrawerOperationState() {
    if (activeSelectedObjectData) {
      manageDrawerOpContainer(activeSelectedObjectData);
    }
  }

  function mapObjectIdToDbComponent(rawId) {
    if (!rawId) return null;
    let compId = rawId.toLowerCase();
    if (compId.includes('fuse')) {
      if (compId.includes('pos')) return 'string_fuse_pos';
      if (compId.includes('neg')) return 'string_fuse_neg';
      return 'string_fuse';
    }
    if (compId.includes('iso') || compId.includes('dc_switch') || compId.includes('qpv')) return 'qpv_isolator';
    if (compId.includes('dc_spd')) return 'dc_spd';
    if (compId.includes('pv') || compId.includes('string')) return 'pv_modules';
    if (compId.includes('inverter') && !compId.includes('internals')) return 'hybrid_inverter';
    if (compId.includes('battery') && !compId.includes('ocpd') && !compId.includes('bms')) return 'battery_bank';
    if (compId.includes('bms')) return 'bms';
    if (compId.includes('ocpd') || compId.includes('bat_breaker')) return 'battery_qb';
    if (compId.includes('grid_mcb') || compId === 'q1' || compId.includes('main_service')) return 'q0_mcb';
    if (compId.includes('inv_grid') || compId === 'q2') return 'qg_mcb';
    if (compId.includes('ac_spd') || compId.includes('spd_backup')) return 'ac_spd';
    if (compId.includes('ct') || compId.includes('split_core')) return 'ct_pcc';
    if (compId.includes('meter') || compId.includes('smart_meter')) return 'm0_meter';
    if (compId.includes('mdb') || compId.includes('main_board')) return 'bus_g';
    if (compId.includes('eps_mcb') || compId.includes('qe')) return 'qe_mcb';
    if (compId.includes('sby')) return 'sby_switch';
    if (compId.includes('rcbo')) return 'rcbo_circuits';
    if (compId.includes('rcd')) return 'essential_db';
    if (compId.includes('eps') || compId.includes('critical')) return 'essential_db';
    if (compId.includes('pe_bar') || compId.includes('met') || compId.includes('earth')) return 'met_bar';
    if (compId.includes('terminal')) return 'dc_terminal_block';
    if (compId.includes('dc_door')) return 'qpv_isolator';
    return compId;
  }

  function handleObjectSelected(data) {
    if (!data) return;

    // Open drawer
    const drawer = document.getElementById('inspector-drawer');
    if (drawer) drawer.classList.add('open');

    // Display component info
    if (data.type === 'INTERNAL_CONDUCTOR' || data.type === 'CONDUCTOR' || data.sourceTerminalId) {
      renderInspectorConductor(data);
    } else if (data.id) {
      const compId = mapObjectIdToDbComponent(data.id);
      if (compId && window.PERSIAN_ELECTRICAL_DB?.components?.[compId]) {
        renderInspectorComponent(compId);
      } else {
        const titleEl = document.getElementById('drawer-comp-name');
        const categoryEl = document.getElementById('drawer-comp-category');
        if (titleEl && data.name) titleEl.textContent = data.name;
        if (categoryEl && data.desc) categoryEl.textContent = data.desc;
      }
    } else if (data.name) {
      const titleEl = document.getElementById('drawer-comp-name');
      if (titleEl) titleEl.textContent = data.name;
    }

    // Manage #drawer-op-container
    manageDrawerOpContainer(data);
  }

  function setupInspectorDrawer() {
    const drawer = document.getElementById('inspector-drawer');
    const closeBtn = document.getElementById('btn-close-drawer');
    const copyBtn = document.getElementById('btn-copy-drawer');
    const whyBtn = document.getElementById('btn-why-drawer');

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        sound.playClick();
        drawer.classList.remove('open');
        activeSelectedObjectData = null;
        manageDrawerOpContainer(null);
        const feedSummary = document.getElementById('drawer-feed-summary');
        if (feedSummary) feedSummary.style.display = 'none';
      });
    }

    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        sound.playClick();
        copyDrawerDetailsToClipboard();
      });
    }

    if (whyBtn) {
      whyBtn.addEventListener('click', () => {
        sound.playClick();
        openWhyModalForCurrentComponent();
      });
    }

    // Connect objectSelected if sceneInstance is already instantiated
    if (window.sceneInstance && typeof window.sceneInstance.on === 'function') {
      window.sceneInstance.on('objectSelected', (data) => {
        handleObjectSelected(data);
      });
    }

    // Set initial component without opening drawer prematurely
    renderInspectorComponent('hybrid_inverter', false);
  }

  // ============================================================================
  // STEP 11: DYNAMIC SINGLE-LINE FEEDING SUMMARY BANNER & HONEST LABELING
  // ============================================================================
  function updateInspectorFeedSummary(componentId) {
    const summaryEl = document.getElementById('drawer-feed-summary');
    if (!summaryEl) return;

    const drawer = document.getElementById('inspector-drawer');
    if (!drawer || !drawer.classList.contains('open')) {
      summaryEl.style.display = 'none';
      return;
    }

    const compId = (componentId || state.activeInspectorComponent || '').toLowerCase();
    if (!compId) {
      summaryEl.style.display = 'none';
      return;
    }

    let statusClass = 'powered'; // 'powered' | 'deenergized' | 'warning'
    let summaryText = '';

    // 1. MDB / BUS-G & Upstream PCC
    if (
      compId === 'bus_g' || compId === 'q0_mcb' || compId === 'm0_meter' ||
      compId === 'ct_pcc' || compId === 'utility_grid' || compId === 'main_board' ||
      compId === 'qn_mcb' || compId === 'non_essential_db' || compId === 'ac_spd' ||
      compId === 'fspd_mcb' || compId === 'ac_interior' || compId === 'ac_wiring' ||
      compId === 'ac_terminals' || compId.includes('mdb') || compId.includes('grid_mcb')
    ) {
      if (state.failures.grid_blackout) {
        statusClass = 'deenergized';
        summaryText = 'بی‌برق — شبکه اصلی سراسری قطع است';
      } else if (!state.breakers.q0_mcb) {
        statusClass = 'deenergized';
        summaryText = 'بی‌برق — کلید ورودی Q0 قطع است';
      } else if (state.failures.grid_brownout) {
        statusClass = 'warning';
        summaryText = 'افت ولتاژ بحرانی شبکه سراسری (Brownout - ۱۷۵ ولت) — ریسک عملکرد تجهیزات';
      } else {
        statusClass = 'powered';
        summaryText = `تغذیه مستقیم از شبکه سراسری BUS-G — برق‌دار (${state.telemetry?.grid?.v || 230} ولت)`;
      }
    }

    // 2. EPS Board / Essential DB & Emergency Circuits
    else if (
      compId === 'essential_db' || compId === 'eps_board' || compId === 'qe_mcb' ||
      compId === 'sby_switch' || compId === 'qo_mcb' || compId === 'rcbo_circuits' ||
      compId === 'eps_rcd' || compId === 'eps_interior' || compId.includes('eps') ||
      compId.includes('sby')
    ) {
      if (state.breakers.eps_rcd === false) {
        statusClass = 'deenergized';
        summaryText = 'بی‌برق — کلید محافظ جان EPS RCD قطع است';
      } else if (state.sbyPosition === '0') {
        statusClass = 'deenergized';
        summaryText = 'بی‌برق — کلید تبدیل SBY در وضعیت صفر (ایزوله کامل)';
      } else if (state.sbyPosition === 'II') {
        if (state.failures.grid_blackout) {
          statusClass = 'deenergized';
          summaryText = 'بی‌برق در حالت بای‌پاس — شبکه اصلی سراسری قطع است';
        } else if (!state.breakers.q0_mcb || !state.breakers.qbp_mcb) {
          statusClass = 'deenergized';
          summaryText = 'بی‌برق در حالت بای‌پاس — کلید بالادست شبکه قطع است';
        } else {
          statusClass = 'powered';
          summaryText = 'تغذیه در حالت بای‌پاس از شبکه شهری — برق‌دار';
        }
      } else if (state.sbyPosition === 'I') {
        if (!state.breakers.qe_mcb) {
          statusClass = 'deenergized';
          summaryText = 'بی‌برق — کلید خروجی اضطراری اینورتر (QE) قطع است';
        } else if (state.failures.eps_overload) {
          statusClass = 'deenergized';
          summaryText = 'بی‌برق — تریپ اضافه‌بار خروجی اضطراری EPS اینورتر';
        } else if (!state.telemetry?.eps?.isPowered) {
          statusClass = 'deenergized';
          summaryText = 'بی‌برق — پورت خروجی اضطراری (EPS) اینورتر غیرفعال است';
        } else {
          statusClass = 'powered';
          summaryText = 'تغذیه از پورت خروجی اضطراری اینورتر (EPS) — برق‌دار (۲۳۰ ولت)';
        }
      } else {
        statusClass = 'deenergized';
        summaryText = 'بی‌برق — وضعیت کلید تبدیل نامشخص است';
      }
    }

    // 3. Inverter & AC Grid Feed
    else if (compId === 'hybrid_inverter' || compId === 'inverter' || compId === 'qg_mcb') {
      const pvOk = state.breakers.qpv_isolator && !state.failures.blown_pv_fuse && !state.failures.dc_arc_fault && ((state.telemetry?.pv?.p || 0) > 50);
      const batOk = state.breakers.battery_qb && (state.batterySOC > 10) && !state.failures.battery_thermal;
      const gridOk = !state.failures.grid_blackout && state.breakers.q0_mcb && state.breakers.qg_mcb;

      if (!pvOk && !batOk && !gridOk) {
        statusClass = 'deenergized';
        summaryText = 'بی‌برق / خاموش — هیچ منبع انرژی (PV، باتری یا شبکه) در دسترس نیست';
      } else if (gridOk && pvOk) {
        statusClass = 'powered';
        summaryText = `تغذیه همزمان از آرایه PV (${state.telemetry?.pv?.p || 0}W) و شبکه سراسری — فعال (${state.telemetry?.inverter?.status || 'Active'})`;
      } else if (gridOk && !pvOk) {
        statusClass = 'powered';
        summaryText = `تغذیه از شبکه سراسری (${state.telemetry?.grid?.v || 230}V) — اینورتر متصل به شبکه (${state.telemetry?.inverter?.status || 'Active'})`;
      } else if (!gridOk && (pvOk || batOk)) {
        statusClass = 'warning';
        const src = pvOk && batOk ? 'آرایه PV و باتری' : (pvOk ? 'آرایه PV' : 'بانک باتری');
        summaryText = `حالت جزیره‌ای (EPS) — تغذیه اضطراری از ${src} (باتری: ${Math.round(state.batterySOC)}%)`;
      } else {
        statusClass = 'deenergized';
        summaryText = 'اینورتر در وضعیت خطا یا آماده‌باش';
      }
    }

    // 4. Battery Bank & BMS
    else if (
      compId === 'battery_bank' || compId === 'battery_qb' || compId === 'bms' ||
      compId === 'battery_shunt' || compId === 'battery' || compId.includes('battery')
    ) {
      if (!state.breakers.battery_qb) {
        statusClass = 'deenergized';
        summaryText = 'ایزوله — کلید اتوماتیک DC باتری (QB) قطع است';
      } else if (state.failures.battery_thermal) {
        statusClass = 'deenergized';
        summaryText = 'خطا — اضافه دمای بحرانی باتری (BMS تریپ داده و ایزوله است)';
      } else if (state.batterySOC <= 10) {
        statusClass = 'warning';
        summaryText = `هشدار — تخلیه کامل بانک باتری (${Math.round(state.batterySOC)}%) — نیازمند شارژ`;
      } else {
        statusClass = 'powered';
        const isCharging = (state.telemetry?.battery?.p || 0) >= 0;
        const act = isCharging ? 'در حال شارژ' : 'در حال دشارژ';
        summaryText = `بانک باتری ۵۱.۲ ولت متصل به باس DC اینورتر — ${act} (${Math.abs(state.telemetry?.battery?.p || 0)}W, SOC: ${Math.round(state.batterySOC)}%)`;
      }
    }

    // 5. DC Combiner Box & PV Array
    else if (
      compId === 'qpv_isolator' || compId === 'dc_box' || compId === 'pv_modules' ||
      compId === 'string_fuse' || compId === 'string_fuse_pos' || compId === 'string_fuse_neg' ||
      compId === 'dc_spd' || compId === 'dc_terminal_block' || compId === 'pv' ||
      compId.includes('fuse') || compId.includes('string') || compId.includes('qpv')
    ) {
      if (state.failures.blown_pv_fuse) {
        statusClass = 'deenergized';
        summaryText = 'بی‌برق — فیوز استرینگ gPV سوخته و مدار باز است';
      } else if (!state.breakers.qpv_isolator) {
        statusClass = 'deenergized';
        summaryText = 'ایزوله — کلید سکسیونر قطع زیر بار QPV قطع است';
      } else if (state.failures.dc_arc_fault) {
        statusClass = 'deenergized';
        summaryText = 'خطا — خطای قوس الکتریکی DC (سامانه AFCI مدار را ایزوله کرده است)';
      } else if ((state.telemetry?.pv?.p || 0) <= 10) {
        statusClass = 'warning';
        summaryText = 'ولتاژ مدار باز بدون تابش خورشید — توان خروجی صفر وات';
      } else {
        statusClass = 'powered';
        summaryText = `تغذیه مستقیم از آرایه خورشیدی استرینگ PV — برق‌دار (${state.telemetry?.pv?.v || 0}V, ${state.telemetry?.pv?.i || 0}A, ${state.telemetry?.pv?.p || 0}W)`;
      }
    }

    // 6. Earthing / MET Bar
    else if (compId === 'met_bar' || compId.includes('met') || compId.includes('pe_bar')) {
      statusClass = 'powered';
      summaryText = 'شینه اتصال زمین اصلی (MET) — پتانسیل زمین متصل و هم‌بندی پایدار';
    }

    // Fallback
    else {
      const isBlackout = state.failures.grid_blackout;
      statusClass = isBlackout ? 'deenergized' : 'powered';
      summaryText = isBlackout ? 'تجهیز بی‌برق است' : 'تجهیز در وضعیت برق‌دار قرار دارد';
    }

    summaryEl.className = `drawer-feed-summary ${statusClass}`;
    summaryEl.style.display = 'flex';
    summaryEl.innerHTML = `<span class="feed-status-dot"></span><span class="feed-summary-text">${summaryText}</span>`;
  }

  function renderInspectorComponent(componentId, openDrawer = true) {
    if (!window.PERSIAN_ELECTRICAL_DB || !window.PERSIAN_ELECTRICAL_DB.components) return;
    const comp = window.PERSIAN_ELECTRICAL_DB.components[componentId];
    if (!comp) return;

    state.activeInspectorComponent = componentId;

    const titleEl = document.getElementById('drawer-comp-name');
    const categoryEl = document.getElementById('drawer-comp-category');
    const accordionContainer = document.getElementById('drawer-accordion-container');
    const whyBtn = document.getElementById('btn-why-drawer');

    if (titleEl) titleEl.textContent = comp.name;
    if (categoryEl) categoryEl.textContent = comp.category;

    // Show/hide Why button based on presence in why_data
    if (whyBtn) {
      const hasWhy = window.PERSIAN_ELECTRICAL_DB.why_data && (componentId in window.PERSIAN_ELECTRICAL_DB.why_data);
      whyBtn.style.display = hasWhy ? 'flex' : 'none';
    }

    // Field 4 content with honest labeling tags (reference specs + live telemetry + unmodeled notes)
    const field4Html = (() => {
      let liveHtml = '';
      const cId = (componentId || '').toLowerCase();

      if (
        cId === 'q0_mcb' || cId === 'bus_g' || cId === 'main_board' ||
        cId === 'm0_meter' || cId === 'utility_grid' || cId === 'qn_mcb' ||
        cId === 'non_essential_db' || cId.includes('mdb')
      ) {
        const v = state.telemetry?.grid?.v ?? 230;
        const p = Math.abs(state.telemetry?.grid?.p ?? 0);
        const i = (p / (v || 230)).toFixed(1);
        liveHtml = `
          <div class="inspector-live-row" style="margin-top:8px; padding-top:6px; border-top:1px dashed rgba(255,255,255,0.12);">
            <span class="tag-live-val">اندازه‌گیری زنده</span>
            <span>ولتاژ فاز: <strong>${v} V</strong> | جریان خط: <strong>${i} A</strong> | توان عبوری: <strong>${p} W</strong></span>
          </div>
          <div class="inspector-unmodeled-row" style="margin-top:6px; font-size:0.75rem; color:#94a3b8;">
            <span class="tag-unmodeled">مدل نشده</span>
            <span>اعوجاج هارمونیکی جریان (THDi) و دمای باسبار MDB در این شبیه‌ساز مدل نشده است.</span>
          </div>`;
      } else if (cId === 'hybrid_inverter' || cId === 'inverter' || cId === 'qg_mcb') {
        liveHtml = `
          <div class="inspector-live-row" style="margin-top:8px; padding-top:6px; border-top:1px dashed rgba(255,255,255,0.12);">
            <span class="tag-live-val">اندازه‌گیری زنده</span>
            <span>توان خروجی: <strong>${state.telemetry?.inverter?.pOut || 0} W</strong> | فرکانس: <strong>${(state.telemetry?.inverter?.freq || 50).toFixed(1)} Hz</strong> | راندمان: <strong>${state.telemetry?.inverter?.efficiency || 97.4}%</strong></span>
          </div>
          <div class="inspector-unmodeled-row" style="margin-top:6px; font-size:0.75rem; color:#94a3b8;">
            <span class="tag-unmodeled">مدل نشده</span>
            <span>دمای هیت‌سینک و مقاومت عایقی داخلی Riso در این نسخه مدل نشده است.</span>
          </div>`;
      } else if (cId === 'pv_modules' || cId === 'qpv_isolator' || cId === 'dc_box' || cId.includes('fuse') || cId.includes('string')) {
        liveHtml = `
          <div class="inspector-live-row" style="margin-top:8px; padding-top:6px; border-top:1px dashed rgba(255,255,255,0.12);">
            <span class="tag-live-val">اندازه‌گیری زنده</span>
            <span>ولتاژ استرینگ: <strong>${state.telemetry?.pv?.v || 0} V</strong> | جریان: <strong>${state.telemetry?.pv?.i || 0} A</strong> | توان تولیدی: <strong>${state.telemetry?.pv?.p || 0} W</strong></span>
          </div>
          <div class="inspector-unmodeled-row" style="margin-top:6px; font-size:0.75rem; color:#94a3b8;">
            <span class="tag-unmodeled">مدل نشده</span>
            <span>دمای واقعی سلول (Tcell) و اثر گردوغبار سطحی ماژول‌ها در این نسخه مدل نشده است.</span>
          </div>`;
      } else if (cId === 'battery_bank' || cId === 'battery_qb' || cId === 'bms' || cId.includes('battery')) {
        liveHtml = `
          <div class="inspector-live-row" style="margin-top:8px; padding-top:6px; border-top:1px dashed rgba(255,255,255,0.12);">
            <span class="tag-live-val">اندازه‌گیری زنده</span>
            <span>ولتاژ بانک: <strong>${state.telemetry?.battery?.v || 0} V</strong> | توان: <strong>${state.telemetry?.battery?.p || 0} W</strong> | سطح شارژ (SOC): <strong>${Math.round(state.batterySOC)}%</strong></span>
          </div>
          <div class="inspector-unmodeled-row" style="margin-top:6px; font-size:0.75rem; color:#94a3b8;">
            <span class="tag-unmodeled">مدل نشده</span>
            <span>شاخص سلامت سلول‌ها (SOH) و شمارنده تعداد چرخه‌ها مدل نشده است.</span>
          </div>`;
      } else if (cId === 'essential_db' || cId === 'eps_board' || cId === 'qe_mcb' || cId === 'sby_switch' || cId === 'rcbo_circuits' || cId.includes('eps')) {
        liveHtml = `
          <div class="inspector-live-row" style="margin-top:8px; padding-top:6px; border-top:1px dashed rgba(255,255,255,0.12);">
            <span class="tag-live-val">اندازه‌گیری زنده</span>
            <span>ولتاژ بارهای اضطراری: <strong>${state.telemetry?.eps?.v || 0} V</strong> | توان مصرفی اضطراری: <strong>${state.telemetry?.eps?.p || 0} W</strong></span>
          </div>
          <div class="inspector-unmodeled-row" style="margin-top:6px; font-size:0.75rem; color:#94a3b8;">
            <span class="tag-unmodeled">مدل نشده</span>
            <span>جریان نشتی تفکیکی هر مدار فرعی روشنایی و پریز مدل نشده است.</span>
          </div>`;
      } else {
        liveHtml = `
          <div class="inspector-unmodeled-row" style="margin-top:6px; font-size:0.75rem; color:#94a3b8;">
            <span class="tag-unmodeled">مدل نشده</span>
            <span>پایش لحظه‌ای آنالوگ برای این جزئیات در شبیه‌ساز تعریف نشده است.</span>
          </div>`;
      }

      return `<div class="field-spec-row"><span class="tag-ref-spec">مشخصات مرجع</span> <span>${comp.current_flow || '<span class="tag-unmodeled">مدل نشده</span>'}</span></div>${liveHtml}`;
    })();

    // Field 12 with honest labeling
    const field12Html = `
      <div class="field-spec-row"><span class="tag-ref-spec">مشخصات مرجع</span> <span>${comp.datasheet_check || '<span class="tag-unmodeled">مدل نشده</span>'}</span></div>
      <div class="inspector-unmodeled-row" style="margin-top:6px; font-size:0.75rem; color:#94a3b8;">
        <span class="tag-unmodeled">مدل نشده</span>
        <span>آزمون تسریع‌شده استرس حرارتی محفظه (IEC Environmental chamber): <span class="tag-unmodeled">مدل نشده</span></span>
      </div>`;

    // 12 Standard Engineering Fields definitions
    const fields = [
      { num: 1, label: 'نام فنی و استاندارد', content: `<div class="field-spec-row"><span class="tag-ref-spec">مشخصات مرجع</span> <span>${comp.name}</span></div>` },
      { num: 2, label: 'عملکرد و نقش مهندسی', content: `<div class="field-spec-row"><span class="tag-ref-spec">مشخصات مرجع</span> <span>${comp.function}</span></div>` },
      { num: 3, label: 'موقعیت در پایپینگ الکتریکی', content: `<div class="field-spec-row"><span class="tag-ref-spec">مشخصات مرجع</span> <span>${comp.location}</span></div>` },
      { num: 4, label: 'مشخصات جریان و توان عبوری', content: field4Html },
      { num: 5, label: 'تجهیزات تحت حفاظت', content: `<div class="field-spec-row"><span class="tag-ref-spec">مشخصات مرجع</span> <span>${comp.protects}</span></div>` },
      { num: 6, label: 'موارد خارج از محدوده حفاظتی', content: `<div class="field-spec-row"><span class="tag-ref-spec">مشخصات مرجع</span> <span>${comp.unprotected}</span></div>` },
      { num: 7, label: 'رفتار در اتصال نرمال به شبکه', content: `<div class="field-spec-row"><span class="tag-ref-spec">مشخصات مرجع</span> <span>${comp.grid_normal}</span></div>` },
      { num: 8, label: 'رفتار در حالت قطع شبکه (جزیره‌ای)', content: `<div class="field-spec-row"><span class="tag-ref-spec">مشخصات مرجع</span> <span>${comp.grid_outage}</span></div>` },
      { num: 9, label: 'خطاها و عیوب احتمالی', content: `<div class="field-spec-row"><span class="tag-ref-spec">مشخصات مرجع</span> <span>${comp.probable_failures}</span></div>` },
      { num: 10, label: 'اشتباهات رایج مجریان و نصاب‌ها', content: `<div class="field-spec-row"><span class="tag-ref-spec">مشخصات مرجع</span> <span>${comp.installer_mistakes}</span></div>` },
      { num: 11, label: 'نکات کلیدی بازرس و ناظر نظام مهندسی', content: `<div class="field-spec-row"><span class="tag-ref-spec">مشخصات مرجع</span> <span>${comp.supervisor_notes}</span></div>` },
      { num: 12, label: 'اعتبارسنجی و انطباق با دیتاشیت IEC', content: field12Html }
    ];

    if (accordionContainer) {
      accordionContainer.innerHTML = fields.map((f, idx) => `
        <div class="accordion-item ${idx === 0 || idx === 1 ? 'active' : ''}">
          <div class="accordion-header">
            <div class="accordion-header-left">
              <span class="accordion-number">${f.num}</span>
              <span>${f.label}</span>
            </div>
            <span class="accordion-chevron">▼</span>
          </div>
          <div class="accordion-body">
            <div>${f.content}</div>
          </div>
        </div>
      `).join('');

      accordionContainer.querySelectorAll('.accordion-header').forEach(header => {
        header.addEventListener('click', () => {
          sound.playClick();
          const item = header.parentElement;
          item.classList.toggle('active');
        });
      });
    }

    // Open drawer
    const drawer = document.getElementById('inspector-drawer');
    if (drawer && openDrawer) drawer.classList.add('open');

    // Update single-line dynamic feeding summary banner
    updateInspectorFeedSummary(componentId);
  }

  function copyDrawerDetailsToClipboard() {
    const comp = window.PERSIAN_ELECTRICAL_DB.components[state.activeInspectorComponent];
    if (!comp) return;

    const text = `
=== مشخصات فنی تجهیز: ${comp.name} ===
دسته‌بندی: ${comp.category}
۱. عملکرد و نقش مهندسی: ${comp.function}
۲. موقعیت فیزیکی: ${comp.location}
۳. مشخصات جریان و توان عبوری: ${comp.current_flow}
۴. تجهیزات تحت حفاظت: ${comp.protects}
۵. موارد خارج از محدوده حفاظتی: ${comp.unprotected}
۶. رفتار در اتصال به شبکه: ${comp.grid_normal}
۷. رفتار در حالت جزیره‌ای: ${comp.grid_outage}
۸. خطاهای احتمالی: ${comp.probable_failures}
۹. اشتباهات رایج نصاب‌ها: ${comp.installer_mistakes}
۱۰. نکات کلیدی ناظر نظام مهندسی: ${comp.supervisor_notes}
۱۱. انطباق با استانداردهای IEC: ${comp.datasheet_check}
    `.trim();

    navigator.clipboard.writeText(text).then(() => {
      showScenarioBanner('مشخصات ۱۲ گانه قطعه در کلیپ‌بورد کپی شد.');
    });
  }

  // ============================================================================
  // 8. ENGINEERING "WHY?" MODAL (Physics, Architecture & IEC Standards)
  // ============================================================================
  function setupWhyModal() {
    const modal = document.getElementById('why-modal');
    const closeBtn = document.getElementById('btn-close-why');

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
  }

  function openWhyModalForCurrentComponent(componentId) {
    const targetId = componentId || state.activeInspectorComponent;
    const whyDb = window.PERSIAN_ELECTRICAL_DB?.why_data;
    if (!whyDb) return;

    const key = (targetId in whyDb) ? targetId : Object.keys(whyDb)[0];
    renderWhyModalTabs(key);

    const modal = document.getElementById('why-modal');
    if (modal) modal.classList.add('open');
  }

  function renderWhyModalTabs(activeKey) {
    const whyDb = window.PERSIAN_ELECTRICAL_DB.why_data;
    const tabsBar = document.getElementById('why-tabs-bar');
    const contentBody = document.getElementById('why-content-body');
    if (!tabsBar || !contentBody) return;

    tabsBar.innerHTML = Object.entries(whyDb).map(([key, data]) => `
      <button class="why-tab-btn ${key === activeKey ? 'active' : ''}" data-why-key="${key}">
        ${data.title.split(' الزامی')[0].replace('چرا ', '')}
      </button>
    `).join('');

    tabsBar.querySelectorAll('.why-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        sound.playClick();
        const key = btn.getAttribute('data-why-key');
        renderWhyModalTabs(key);
      });
    });

    const item = whyDb[activeKey];
    if (!item) return;

    contentBody.innerHTML = `
      <h3 style="color:#fbbf24; font-size:1.15rem; font-weight:800; margin-bottom:8px;">${item.title}</h3>

      <div class="why-card">
        <div class="why-card-header physics">
          <span>⚡</span> ۱. مبانی فیزیکی و تئوری الکتریکی
        </div>
        <div class="why-card-text">${item.physics_theory}</div>
      </div>

      <div class="why-card">
        <div class="why-card-header rationale">
          <span>🏗️</span> ۲. دلیل انتخاب معماری و فلسفه طراحی
        </div>
        <div class="why-card-text">${item.architectural_rationale}</div>
      </div>

      <div class="why-card">
        <div class="why-card-header standard">
          <span>📜</span> ۳. بندها و مراجع استاندارد IEC
        </div>
        <div class="why-card-text">
          <p>${item.iec_standards}</p>
        </div>
      </div>

      <div class="why-card">
        <div class="why-card-header consequence">
          <span>⚠️</span> ۴. پیامدها و خسارات فاجعه‌بار ناشی از عدم نصب
        </div>
        <div class="why-card-text" style="color:#fca5a5;">${item.failure_consequences}</div>
      </div>
    `;
  }

  // ============================================================================
  // 9. SUPERVISOR CHECKLIST MODAL (25 Items & Progress Bar & Report Export)
  // ============================================================================
  function setupChecklistModal() {
    const modal = document.getElementById('checklist-modal');
    const openBtn = document.getElementById('btn-open-checklist');
    const closeBtn = document.getElementById('btn-close-checklist');
    const exportBtn = document.getElementById('btn-export-report');

    if (openBtn && modal) {
      openBtn.addEventListener('click', () => {
        sound.playClick();
        renderChecklistSection('pv_side');
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

    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        sound.playClick();
        generateAndPrintCommissioningReport();
      });
    }
  }

  function renderChecklistSection(activeSectionKey) {
    const checklists = window.PERSIAN_ELECTRICAL_DB?.checklists;
    if (!checklists) return;

    const navBar = document.getElementById('checklist-tabs-nav');
    const itemsContainer = document.getElementById('checklist-items-container');
    if (!navBar || !itemsContainer) return;

    navBar.innerHTML = Object.entries(checklists).map(([key, section]) => `
      <button class="checklist-tab-btn ${key === activeSectionKey ? 'active' : ''}" data-section="${key}">
        ${section.title.split('سمت ')[1] || section.title}
      </button>
    `).join('');

    navBar.querySelectorAll('.checklist-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        sound.playClick();
        renderChecklistSection(btn.getAttribute('data-section'));
      });
    });

    const currentSection = checklists[activeSectionKey];
    itemsContainer.innerHTML = currentSection.items.map(item => {
      const isChecked = !!state.checklistChecked[item.id];
      return `
        <div class="check-item-card ${isChecked ? 'checked' : ''}" data-check-id="${item.id}">
          <div class="custom-checkbox">${isChecked ? '✓' : ''}</div>
          <div class="check-item-details">
            <div class="check-item-title">${item.title}</div>
            <div class="check-item-meta">
              <span class="check-badge iec">${item.standard_ref}</span>
              <span><strong>معیار قبولی:</strong> ${item.criteria}</span>
            </div>
            <div class="check-item-meta" style="margin-top:2px;">
              <span><strong>ابزار تست:</strong> ${item.method}</span>
            </div>
            <div class="check-item-meta" style="color:#f87171;">
              <span class="check-badge danger">هشدار</span>
              <span>${item.critical_warning}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    itemsContainer.querySelectorAll('.check-item-card').forEach(card => {
      card.addEventListener('click', () => {
        sound.playClick();
        const id = card.getAttribute('data-check-id');
        state.checklistChecked[id] = !state.checklistChecked[id];
        renderChecklistSection(activeSectionKey);
        updateChecklistProgress();
      });
    });

    updateChecklistProgress();
  }

  function updateChecklistProgress() {
    const checklists = window.PERSIAN_ELECTRICAL_DB?.checklists;
    if (!checklists) return;

    let total = 0;
    let checkedCount = 0;

    Object.values(checklists).forEach(sec => {
      sec.items.forEach(item => {
        total++;
        if (state.checklistChecked[item.id]) checkedCount++;
      });
    });

    const percent = Math.round((checkedCount / total) * 100);

    const fillBar = document.getElementById('checklist-progress-fill');
    const statsText = document.getElementById('checklist-stats-text');

    if (fillBar) fillBar.style.width = percent + '%';
    if (statsText) statsText.textContent = `${checkedCount} از ${total} مورد تأیید شد (${percent}%)`;
  }

  function generateAndPrintCommissioningReport() {
    const checklists = window.PERSIAN_ELECTRICAL_DB.checklists;
    let reportHtml = `
      <div style="font-family:'Vazirmatn', Tahoma, sans-serif; direction:rtl; padding:30px; line-height:1.8;">
        <div style="border-bottom:2px solid #2563eb; padding-bottom:12px; margin-bottom:20px; display:flex; justify-content:space-between; align-items:center;">
          <div>
            <h1 style="font-size:20px; margin:0; color:#1e3a8a;">فرم تاییدیه و چک‌لیست بازرسی تحویل موقت سامانه خورشیدی هایبرید ۵ کیلووات</h1>
            <p style="font-size:12px; color:#64748b; margin:4px 0 0 0;">مطابق استانداردهای IEC 60364-7-712 و مبحث ۱۳ مقررات ملی ساختمان</p>
          </div>
          <div style="text-align:left; font-size:12px;">
            <div>تاریخ بازرسی: ${new Date().toLocaleDateString('fa-IR')}</div>
            <div>وضعیت: تایید مشروط با تعهد نظارت</div>
          </div>
        </div>

        <table style="width:100%; border-collapse:collapse; font-size:12px; margin-bottom:20px;">
          <thead>
            <tr style="background:#f1f5f9; border:1px solid #cbd5e1;">
              <th style="padding:8px; border:1px solid #cbd5e1; width:50px;">ردیف</th>
              <th style="padding:8px; border:1px solid #cbd5e1;">شرح آزمون / بند بازرسی</th>
              <th style="padding:8px; border:1px solid #cbd5e1; width:120px;">مرجع استاندارد</th>
              <th style="padding:8px; border:1px solid #cbd5e1; width:100px;">نتیجه آزمون</th>
            </tr>
          </thead>
          <tbody>
    `;

    let counter = 1;
    Object.values(checklists).forEach(sec => {
      reportHtml += `
        <tr style="background:#e2e8f0; font-weight:bold;">
          <td colspan="4" style="padding:6px 8px; border:1px solid #cbd5e1;">${sec.title}</td>
        </tr>
      `;
      sec.items.forEach(item => {
        const checked = !!state.checklistChecked[item.id];
        reportHtml += `
          <tr style="border:1px solid #cbd5e1;">
            <td style="padding:6px 8px; text-align:center; border:1px solid #cbd5e1;">${counter++}</td>
            <td style="padding:6px 8px; border:1px solid #cbd5e1;">${item.title}</td>
            <td style="padding:6px 8px; text-align:center; border:1px solid #cbd5e1;">${item.standard_ref}</td>
            <td style="padding:6px 8px; text-align:center; font-weight:bold; color:${checked ? '#15803d' : '#b91c1c'}; border:1px solid #cbd5e1;">
              ${checked ? 'تأیید شد ✓' : 'عدم انطباق ✗'}
            </td>
          </tr>
        `;
      });
    });

    reportHtml += `
          </tbody>
        </table>

        <div style="margin-top:40px; display:flex; justify-content:space-between;">
          <div style="text-align:center; width:220px; border-top:1px solid #000; padding-top:8px;">
            <div>امضای ناظر تاسیسات الکتریکی</div>
            <div style="font-size:11px; color:#64748b;">سازمان نظام مهندسی ساختمان</div>
          </div>
          <div style="text-align:center; width:220px; border-top:1px solid #000; padding-top:8px;">
            <div>مهر و امضای شرکت مجری</div>
            <div style="font-size:11px; color:#64748b;">گواهی صلاحیت پیمانکاری ساتبا</div>
          </div>
        </div>
      </div>
    `;

    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.write(`<html><head><title>گزارش بازرسی سامانه خورشیدی</title></head><body onload="window.print()">${reportHtml}</body></html>`);
      printWin.document.close();
    }
  }

  // ============================================================================
  // 10. ENGINEERING CALCULATORS MODAL (5 Reactive Engineering Tabs)
  // ============================================================================
  function setupCalculatorsModal() {
    const modal = document.getElementById('calc-modal');
    const openBtn = document.getElementById('btn-open-calcs');
    const closeBtn = document.getElementById('btn-close-calcs');

    if (openBtn && modal) {
      openBtn.addEventListener('click', () => {
        sound.playClick();
        modal.classList.add('open');
        calculateAll();
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

    const tabBtns = document.querySelectorAll('.calc-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        sound.playClick();
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const targetPaneId = btn.getAttribute('data-calc-pane');
        document.querySelectorAll('.calc-pane').forEach(p => p.classList.remove('active'));
        const pane = document.getElementById(targetPaneId);
        if (pane) pane.classList.add('active');

        calculateAll();
      });
    });

    document.querySelectorAll('.calc-input').forEach(input => {
      input.addEventListener('input', () => {
        calculateAll();
      });
    });
  }

  function calculateAll() {
    calculateCableSizing();
    calculateStringMPPT();
    calculateBatteryAutonomy();
    calculateProtectionSizing();
    calculateInverterLoading();
  }

  function calculateCableSizing() {
    const L = parseFloat(document.getElementById('calc-cable-l')?.value || 25);
    const I = parseFloat(document.getElementById('calc-cable-i')?.value || 11.5);
    const S = parseFloat(document.getElementById('calc-cable-s')?.value || 6.0);
    const V = parseFloat(document.getElementById('calc-cable-v')?.value || 385);
    const kappa = 56.0;

    const deltaV = (2 * L * I) / (kappa * S);
    const percentV = (deltaV / V) * 100;

    const resVolt = document.getElementById('res-cable-volt');
    const resPercent = document.getElementById('res-cable-percent');
    const resStatus = document.getElementById('res-cable-status');

    if (resVolt) resVolt.textContent = deltaV.toFixed(2) + ' V';
    if (resPercent) resPercent.textContent = percentV.toFixed(2) + '%';
    if (resStatus) {
      if (percentV <= 1.5) {
        resStatus.textContent = 'استاندارد و مجاز (کمتر از ۱.۵٪ سمت DC)';
        resStatus.className = 'calc-result-val pass';
      } else {
        resStatus.textContent = 'غیرمجاز! (افزایش سطح مقطع کابل الزامی است)';
        resStatus.className = 'calc-result-val fail';
      }
    }
  }

  function calculateStringMPPT() {
    const vocSTC = parseFloat(document.getElementById('calc-mppt-voc')?.value || 49.5);
    const vmpSTC = parseFloat(document.getElementById('calc-mppt-vmp')?.value || 41.2);
    const Ns = parseFloat(document.getElementById('calc-mppt-ns')?.value || 8);
    const Tmin = parseFloat(document.getElementById('calc-mppt-tmin')?.value || -10);
    const Tmax = parseFloat(document.getElementById('calc-mppt-tmax')?.value || 70);
    const betaVoc = -0.0028;

    const vocMax = vocSTC * (1 + betaVoc * (Tmin - 25)) * Ns;
    const vmpMin = vmpSTC * (1 + betaVoc * (Tmax - 25)) * Ns;

    const resVocMax = document.getElementById('res-mppt-voc-max');
    const resVmpMin = document.getElementById('res-mppt-vmp-min');
    const resStatus = document.getElementById('res-mppt-status');

    if (resVocMax) resVocMax.textContent = vocMax.toFixed(1) + ' V';
    if (resVmpMin) resVmpMin.textContent = vmpMin.toFixed(1) + ' V';
    if (resStatus) {
      if (vocMax <= 550 && vmpMin >= 125) {
        resStatus.textContent = 'تطابق کامل با پنجره MPPT اینورتر (125V - 550V) ✓';
        resStatus.className = 'calc-result-val pass';
      } else {
        resStatus.textContent = 'خارج از پنجره مجاز اینورتر! ✗';
        resStatus.className = 'calc-result-val fail';
      }
    }
  }

  function calculateBatteryAutonomy() {
    const Pload = parseFloat(document.getElementById('calc-bat-load')?.value || 1500);
    const Ah = parseFloat(document.getElementById('calc-bat-ah')?.value || 100);
    const Vnom = parseFloat(document.getElementById('calc-bat-vnom')?.value || 51.2);
    const dod = parseFloat(document.getElementById('calc-bat-dod')?.value || 80) / 100;
    const eta = 0.95;

    const totalEnergy = (Ah * Vnom) / 1000;
    const usableEnergy = totalEnergy * dod * eta;
    const hours = (usableEnergy * 1000) / Math.max(1, Pload);

    const resTotalE = document.getElementById('res-bat-total-energy');
    const resUsableE = document.getElementById('res-bat-usable-energy');
    const resHours = document.getElementById('res-bat-autonomy-hours');

    if (resTotalE) resTotalE.textContent = totalEnergy.toFixed(2) + ' kWh';
    if (resUsableE) resUsableE.textContent = usableEnergy.toFixed(2) + ' kWh';
    if (resHours) resHours.textContent = hours.toFixed(2) + ' ساعت';
  }

  function calculateProtectionSizing() {
    const isc = parseFloat(document.getElementById('calc-prot-isc')?.value || 11.8);
    const voc = parseFloat(document.getElementById('calc-prot-voc')?.value || 440);

    const fuseRating = isc * 1.25;
    const recommendedFuse = fuseRating <= 15 ? 15 : (fuseRating <= 20 ? 20 : 25);
    const spdUc = voc * 1.2;

    const resFuse = document.getElementById('res-prot-fuse');
    const resSpd = document.getElementById('res-prot-spd');

    if (resFuse) resFuse.textContent = `${recommendedFuse}A gPV 1000Vdc`;
    if (resSpd) resSpd.textContent = `Type II (Uc ≥ ${Math.round(spdUc)}V DC, In ≥ 20kA)`;
  }

  function calculateInverterLoading() {
    const pvPeak = parseFloat(document.getElementById('calc-inv-pvpeak')?.value || 5600);
    const invRating = parseFloat(document.getElementById('calc-inv-rating')?.value || 5000);

    const ratio = pvPeak / invRating;
    const resRatio = document.getElementById('res-inv-ratio');
    const resStatus = document.getElementById('res-inv-status');

    if (resRatio) resRatio.textContent = ratio.toFixed(2);
    if (resStatus) {
      if (ratio >= 1.10 && ratio <= 1.35) {
        resStatus.textContent = 'نسبت بهینه و دارای بیشترین بازده اقتصادی (1.10 - 1.35)';
        resStatus.className = 'calc-result-val pass';
      } else if (ratio < 1.10) {
        resStatus.textContent = 'بارگذاری ناکافی (استفاده ناکامل از ظرفیت اینورتر)';
        resStatus.className = 'calc-result-val';
      } else {
        resStatus.textContent = 'بارگذاری بیش از حد (پدیده Clipping شدید توان)';
        resStatus.className = 'calc-result-val fail';
      }
    }
  }

  // ============================================================================
  // 11. INTERACTIVE 2D SLD SCHEMATIC MODAL INTEGRATION
  // ============================================================================
  function setupSLDModal() {
    const modal = document.getElementById('sld-modal');
    const openBtn = document.getElementById('btn-open-sld');
    const closeBtn = document.getElementById('btn-close-sld');
    const zoomInBtn = document.getElementById('btn-sld-zoom-in');
    const zoomOutBtn = document.getElementById('btn-sld-zoom-out');
    const resetZoomBtn = document.getElementById('btn-sld-zoom-reset');

    if (openBtn && modal) {
      openBtn.addEventListener('click', () => {
        sound.playClick();
        modal.classList.add('open');
        if (window.SLDSchematic) {
          window.SLDSchematic.init('sld-container');
          const fspdEl = document.getElementById('sld-fspd-mcb');
          if (fspdEl) fspdEl.setAttribute('title', 'نمایشی — در مدل شبیه‌سازی نشده');
        }
      });
    }

    if (closeBtn && modal) {
      closeBtn.addEventListener('click', () => {
        sound.playClick();
        modal.classList.remove('open');
      });
    }

    if (zoomInBtn && window.SLDSchematic) {
      zoomInBtn.addEventListener('click', () => window.SLDSchematic.zoomIn());
    }
    if (zoomOutBtn && window.SLDSchematic) {
      zoomOutBtn.addEventListener('click', () => window.SLDSchematic.zoomOut());
    }
    if (resetZoomBtn && window.SLDSchematic) {
      resetZoomBtn.addEventListener('click', () => window.SLDSchematic.resetZoom());
    }

    const tabBtns = document.querySelectorAll('.sld-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tabId = btn.getAttribute('data-tab');
        if (window.SLDSchematic && tabId) {
          window.SLDSchematic.switchTab(tabId);
          const fspdEl = document.getElementById('sld-fspd-mcb');
          if (fspdEl) fspdEl.setAttribute('title', 'نمایشی — در مدل شبیه‌سازی نشده');
        }
      });
    });
  }

  // ============================================================================
  // 12. SOUND TOGGLE & INITIALIZATION
  // ============================================================================
  function setupHeaderActions() {
    const soundBtn = document.getElementById('btn-toggle-sound');
    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        const isMuted = sound.toggleMute();
        soundBtn.classList.toggle('active', !isMuted);
        soundBtn.title = isMuted ? 'صدا غیرفعال است' : 'صدا فعال است';
        soundBtn.innerHTML = isMuted ? '🔇' : '🔊';
      });
    }

    const whyHeaderBtn = document.getElementById('btn-open-why-header');
    if (whyHeaderBtn) {
      whyHeaderBtn.addEventListener('click', () => {
        sound.playClick();
        openWhyModalForCurrentComponent('hybrid_inverter');
      });
    }

    // Profile Switcher Dropdown (Phase 7 Steps 15a/b/d)
    const selectProfile = document.getElementById('select-system-profile');
    if (selectProfile) {
      selectProfile.addEventListener('change', (e) => {
        sound.playClick();
        window.AppOrchestrator.switchSystemProfile(e.target.value);
      });
    }

    // Tools & References Dropdown Orchestration
    const toolsToggleBtn = document.getElementById('btn-tools-menu-toggle');
    const toolsMenuContent = document.getElementById('tools-menu-content');
    const toolsDropdownWrapper = document.getElementById('header-tools-dropdown');

    if (toolsToggleBtn && toolsMenuContent) {
      toolsToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        sound.playClick();
        const isOpen = toolsMenuContent.classList.toggle('open');
        if (toolsDropdownWrapper) {
          toolsDropdownWrapper.classList.toggle('open', isOpen);
        }
      });

      // Close dropdown when any menu item is clicked
      const menuItems = toolsMenuContent.querySelectorAll('.tools-menu-item');
      menuItems.forEach((item) => {
        item.addEventListener('click', () => {
          toolsMenuContent.classList.remove('open');
          if (toolsDropdownWrapper) {
            toolsDropdownWrapper.classList.remove('open');
          }
        });
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!toolsMenuContent.classList.contains('open')) return;
        if (toolsDropdownWrapper && !toolsDropdownWrapper.contains(e.target)) {
          toolsMenuContent.classList.remove('open');
          toolsDropdownWrapper.classList.remove('open');
        }
      });

      // Close on Escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && toolsMenuContent.classList.contains('open')) {
          toolsMenuContent.classList.remove('open');
          if (toolsDropdownWrapper) {
            toolsDropdownWrapper.classList.remove('open');
          }
        }
      });
    }
  }

  // ============================================================================
  // 13. MASTER INIT & EXPORTED ORCHESTRATOR API
  // ============================================================================

  // ============================================================================
  // 16. 37-CHAPTER COMPREHENSIVE GUIDE READER (HYB-FA-001 REV B)
  // ============================================================================
  function setupGuideModal() {
    const modal = document.getElementById('guide-modal');
    const openBtn = document.getElementById('btn-open-guide');
    const closeBtn = document.getElementById('btn-close-guide');
    const chaptersList = document.getElementById('guide-chapters-list');
    const contentPane = document.getElementById('guide-content-pane');
    const searchInput = document.getElementById('guide-search-input');

    if (openBtn && modal) {
      openBtn.addEventListener('click', () => {
        sound.playClick();
        renderChaptersList();
        loadChapter(1);
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
        renderChaptersList(e.target.value.trim().toLowerCase());
      });
    }

    function renderChaptersList(query = '') {
      if (!chaptersList) return;
      const chapters = (window.GUIDE_DATA || window.HYB_GUIDE_DATA)?.chapters || [];
      const filtered = query
        ? chapters.filter(c => 
            c.title.toLowerCase().includes(query) || 
            (c.summary && c.summary.toLowerCase().includes(query)) ||
            String(c.number).includes(query)
          )
        : chapters;

      if (filtered.length === 0) {
        chaptersList.innerHTML = '<div style="padding:20px; text-align:center; color:#94a3b8; font-size:0.85rem;">موردی یافت نشد.</div>';
        return;
      }

      chaptersList.innerHTML = filtered.map(c => `
        <div class="guide-chapter-item" data-chapter="${c.number}">
          <div class="guide-chapter-num">${c.number}</div>
          <div class="guide-chapter-name">${c.title}</div>
        </div>
      `).join('');

      chaptersList.querySelectorAll('.guide-chapter-item').forEach(item => {
        item.addEventListener('click', () => {
          sound.playClick();
          chaptersList.querySelectorAll('.guide-chapter-item').forEach(i => i.classList.remove('active'));
          item.classList.add('active');
          const num = parseInt(item.getAttribute('data-chapter'), 10);
          loadChapter(num);
        });
      });
    }

    function loadChapter(num) {
      if (!contentPane) return;
      const chapters = (window.GUIDE_DATA || window.HYB_GUIDE_DATA)?.chapters || [];
      const ch = chapters.find(c => c.number === num) || chapters[0];
      if (!ch) return;

      let html = `
        <div style="display:flex; align-items:center; gap:12px; margin-bottom:16px;">
          <span style="background:var(--solar-amber); color:#0f172a; font-weight:800; padding:4px 12px; border-radius:999px; font-size:0.85rem;">فصل ${ch.number} از ۳۷</span>
          <span style="font-size:0.85rem; color:#94a3b8;">کد سند: HYB-FA-001 Rev B</span>
        </div>
        <h1>${ch.title}</h1>
      `;

      if (ch.summary) {
        html += `<div class="guide-callout guide-callout-tip"><strong>خلاصه اجرایی و کلیدی فصل:</strong><br>${ch.summary}</div>`;
      }

      if (ch.sections && ch.sections.length > 0) {
        ch.sections.forEach(sec => {
          html += `<h2>${sec.title}</h2>`;
          if (sec.content) {
            html += `<p style="white-space:pre-line; margin-bottom:16px;">${sec.content}</p>`;
          }
        });
      } else if (ch.raw_content) {
        html += `<div style="white-space:pre-line; margin-top:20px;">${ch.raw_content}</div>`;
      }

      contentPane.innerHTML = html;
      contentPane.scrollTop = 0;
    }
  }

  // ============================================================================
  // 17. 20 CIRCUIT PRACTICE EXERCISES WORKSHOP (CHAPTER 37)
  // ============================================================================
  function setupExercisesModal() {
    const modal = document.getElementById('exercises-modal');
    const openBtn = document.getElementById('btn-open-exercises');
    const closeBtn = document.getElementById('btn-close-exercises');
    const grid = document.getElementById('exercises-grid-container');
    const filterBtns = document.querySelectorAll('.exercise-filter-btn');

    let activeCat = 'all';

    if (openBtn && modal) {
      openBtn.addEventListener('click', () => {
        sound.playClick();
        renderExercises();
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

    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        sound.playClick();
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeCat = btn.getAttribute('data-cat') || 'all';
        renderExercises();
      });
    });

    function renderExercises() {
      if (!grid) return;
      const list = (window.GUIDE_DATA || window.HYB_GUIDE_DATA)?.exercises || [];
      const filtered = activeCat === 'all'
        ? list
        : list.filter(ex => ex.category === activeCat);

      grid.innerHTML = filtered.map(ex => `
        <div class="exercise-card">
          <div class="exercise-card-header">
            <div style="display:flex; align-items:center; gap:10px;">
              <span class="exercise-num-badge">تمرین ${ex.number}</span>
              <div class="exercise-title">${ex.title}</div>
            </div>
            <span class="exercise-category-tag">${getCatLabel(ex.category)}</span>
          </div>

          <div class="exercise-statement">${ex.statement}</div>

          ${ex.circuit_hint ? `<div style="font-size:0.8rem; color:#f59e0b; background:rgba(245,158,11,0.1); padding:8px 12px; border-radius:6px;">⚡ شیت مدار مرتبط: ${ex.circuit_hint}</div>` : ''}

          <button class="exercise-solution-toggle" data-ex-id="${ex.number}">
            <span>🔍</span> مشاهده پاسخ تحلیلی، محاسبات و استدلال مهندسی
          </button>

          <div class="exercise-solution-panel" id="ex-sol-${ex.number}">
            <div class="solution-header">
              <span>✓</span> پاسخ کامل و تحلیل گام‌به‌گام استاندارد:
            </div>
            <div style="white-space:pre-line; color:#a7f3d0; margin-bottom:12px;">${ex.solution}</div>
            ${ex.standards_basis ? `<div style="font-size:0.78rem; color:#94a3b8; border-top:1px solid rgba(255,255,255,0.1); padding-top:8px;"><strong>مبنای استاندارد:</strong> ${ex.standards_basis}</div>` : ''}
            ${ex.safety_warning ? `<div style="font-size:0.8rem; color:#f87171; background:rgba(239,68,68,0.1); padding:8px 12px; border-radius:6px; margin-top:8px;">⚠️ <strong>هشدار ایمنی:</strong> ${ex.safety_warning}</div>` : ''}
          </div>
        </div>
      `).join('');

      grid.querySelectorAll('.exercise-solution-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
          sound.playClick();
          const num = btn.getAttribute('data-ex-id');
          const panel = document.getElementById(`ex-sol-${num}`);
          if (panel) {
            panel.classList.toggle('open');
            btn.innerHTML = panel.classList.contains('open')
              ? '<span>▲</span> بستن پاسخ تحلیلی'
              : '<span>🔍</span> مشاهده پاسخ تحلیلی، محاسبات و استدلال مهندسی';
          }
        });
      });
    }

    function getCatLabel(cat) {
      const map = {
        'reading': 'خواندن نقشه و قطعات',
        'three_phase': 'سه‌فاز و موتور',
        'ats': 'کلید انتقال ATSE و لدر',
        'earthing': 'ارتینگ، نول KNE و ADS',
        'battery': 'باتری LiFePO4 و پیش‌شارژ'
      };
      return map[cat] || cat;
    }
  }

  // ============================================================================
  // 18. 618 SATBA & PBO APPROVED CONTRACTORS DIRECTORY
  // ============================================================================
  function setupContractorsModal() {
    const modal = document.getElementById('contractors-modal');
    const openBtn = document.getElementById('btn-open-contractors');
    const closeBtn = document.getElementById('btn-close-contractors');
    const tbody = document.getElementById('contractors-tbody');
    const searchInput = document.getElementById('contractors-search-input');
    const filterCert = document.getElementById('contractors-filter-cert');
    const countBadge = document.getElementById('contractors-count-badge');

    if (openBtn && modal) {
      openBtn.addEventListener('click', () => {
        sound.playClick();
        renderContractors();
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
      searchInput.addEventListener('input', () => renderContractors());
    }

    if (filterCert) {
      filterCert.addEventListener('change', () => renderContractors());
    }

    function renderContractors() {
      if (!tbody) return;
      const list = window.CONTRACTORS_DB || [];
      const q = searchInput?.value.trim().toLowerCase() || '';
      const certFilter = filterCert?.value || 'all';

      let filtered = list;

      if (q) {
        filtered = filtered.filter(c => 
          (c.name && c.name.toLowerCase().includes(q)) ||
          (c.national_id && c.national_id.includes(q)) ||
          ((c.conditions || c.scope_conditions) && (c.conditions || c.scope_conditions).toLowerCase().includes(q))
        );
      }

      if (certFilter === 'has_cert') {
        filtered = filtered.filter(c => (c.license_status || c.pbo_cert_status || '').includes('دارد'));
      } else if (certFilter === 'no_cert') {
        filtered = filtered.filter(c => !(c.license_status || c.pbo_cert_status || '').includes('دارد'));
      }

      if (countBadge) {
        countBadge.textContent = `${filtered.length} پیمانکار یافت شد`;
      }

      if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:40px; color:#94a3b8;">هیچ شرکتی مطابق با مشخصات جستجو یافت نشد.</td></tr>';
        return;
      }

      tbody.innerHTML = filtered.slice(0, 100).map((c, idx) => `
        <tr>
          <td style="color:#94a3b8; font-weight:700;">${c.row_id || c.id || (idx + 1)}</td>
          <td>
            <div class="contractor-name">${c.name}</div>
          </td>
          <td>
            <span class="contractor-nid">${c.national_id || '-'}</span>
          </td>
          <td>
            <span class="${(c.license_status || c.pbo_cert_status || '').includes('دارد') ? 'badge-cert-has' : 'badge-cert-none'}">
              ${c.license_status || c.pbo_cert_status || 'فاقد گواهینامه'}
            </span>
          </td>
          <td style="font-size:0.78rem;">${c.conditions || c.scope_conditions || '-'}</td>
          <td style="font-family:var(--font-mono); color:#f59e0b; font-size:0.78rem;">${c.expiry_date || c.expiration_date || '-'}</td>
        </tr>
      `).join('');
    }
  }

  // ============================================================================
  // 19. 48 DISPUTE RESOLUTION POINTS (CHAPTER 24)
  // ============================================================================
  function setupDisputesModal() {
    const modal = document.getElementById('disputes-modal');
    const openBtn = document.getElementById('btn-open-disputes');
    const closeBtn = document.getElementById('btn-close-disputes');
    const grid = document.getElementById('disputes-grid-container');
    const searchInput = document.getElementById('disputes-search-input');
    const countBadge = document.getElementById('disputes-count-badge');

    if (openBtn && modal) {
      openBtn.addEventListener('click', () => {
        sound.playClick();
        renderDisputes();
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
      searchInput.addEventListener('input', () => renderDisputes());
    }

    function renderDisputes() {
      if (!grid) return;
      const list = (window.GUIDE_DATA || window.HYB_GUIDE_DATA)?.disputes || [];
      const q = searchInput?.value.trim().toLowerCase() || '';

      const filtered = q
        ? list.filter(d => 
            (d.claim && d.claim.toLowerCase().includes(q)) ||
            (d.resolution && d.resolution.toLowerCase().includes(q))
          )
        : list;

      if (countBadge) {
        countBadge.textContent = `${filtered.length} موضوع بررسی‌شده`;
      }

      if (filtered.length === 0) {
        grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:40px; color:#94a3b8;">هیچ موردی یافت نشد.</div>';
        return;
      }

      grid.innerHTML = filtered.map((d, idx) => `
        <div class="dispute-card">
          <div class="dispute-num-tag">
            <span>⚖️</span> موضوع شماره ${idx + 1}
          </div>

          <div class="dispute-claim-box">
            <div class="dispute-claim-label">❌ ادعا / ابهام در اسناد قدیمی:</div>
            <div class="dispute-claim-text">${d.claim}</div>
          </div>

          <div class="dispute-decision-box">
            <div class="dispute-decision-label">✓ نتیجه قطعی و فصل‌الخطاب مهندسی (HYB-FA-001 Rev B):</div>
            <div class="dispute-decision-text">${d.resolution}</div>
          </div>
        </div>
      `).join('');
    }
  }

  // ============================================================================
  // 17. PROFILE SWITCHER & 3D SCENE EVENT WIRING (PHASE 7 STEP 15d)
  // ============================================================================
  function wire3DSceneEvents(scene) {
    if (!scene || typeof scene.on !== 'function') return;

    scene.on('switchChange', (data) => {
      if (!data || !data.id) return;
      sound.playClick();
      if (data.id === 'sby_switch') {
        window.AppOrchestrator.onSbyStateChanged(data.state, '3d');
      } else {
        window.AppOrchestrator.onBreakerStateChanged(data.id, data.state, '3d');
      }
      if (typeof refreshDrawerOperationState === 'function') {
        refreshDrawerOperationState();
      }
    });

    let lastSelectionTime = 0;
    let lastSelectionKey = null;

    const on3DSelect = (data) => {
      if (!data) return;
      const now = performance.now();
      const key = (data.id || '') + '_' + (data.action || '') + '_' + (data.name || '');
      if (key && key === lastSelectionKey && (now - lastSelectionTime < 150)) {
        return;
      }
      lastSelectionTime = now;
      lastSelectionKey = key;
      if (sound && typeof sound.playClick === 'function') sound.playClick();
      if (typeof handleObjectSelected === 'function') {
        handleObjectSelected(data);
      }
    };

    scene.on('objectSelected', on3DSelect);
    scene.on('objectClick', on3DSelect);
  }

  function switchSystemProfile(profileId) {
    if (!window.SystemProfiles) {
      console.error('[AppOrchestrator] SystemProfiles registry unavailable');
      return null;
    }
    const profile = window.SystemProfiles.get(profileId);
    if (!profile) {
      console.error(`[AppOrchestrator] Profile not found: "${profileId}"`);
      return null;
    }

    console.log(`[AppOrchestrator] Switching to profile: ${profile.nameEn} (${profile.id})`);

    // 1. Update active profile reference
    state.activeProfileId = profileId;
    state.activeProfile = profile;

    // 2. Reset scenario state and breakers cleanly
    state.operatingMode = 'normal_day';
    state.irradiance = 850;
    state.temperature = 25;
    state.batterySOC = 75;

    // Reset loads based on profile
    if (profile.equipment?.nonCriticalLoads?.presence !== false) {
      state.normalLoadPower = profile.equipment?.nonCriticalLoads?.nominalPower_W || 2200;
    } else {
      state.normalLoadPower = 0;
    }
    if (profile.equipment?.criticalLoads?.presence !== false) {
      state.criticalLoadPower = profile.equipment?.criticalLoads?.nominalPower_W || 1500;
    } else {
      state.criticalLoadPower = 0;
    }

    // Reset all fault injection flags
    Object.keys(state.failures).forEach(k => {
      state.failures[k] = false;
    });

    // Reset breaker states cleanly according to profile connectivity
    const hasBattery = !(profile.equipment?.batteryBank?.present === false || profile.equipment?.batteryStorage?.presence === false || profile.systemRatings?.batteryPresent === false);
    const hasEps = !(profile.connectivity?.buses?.['BUS-EPS']?.present === false || profile.connectivity?.buses?.['BUS-EPS']?.presence === false);
    const hasGrid = !(profile.connectivity?.buses?.['BUS-G']?.present === false || profile.connectivity?.buses?.['BUS-G']?.presence === false);

    state.sbyPosition = hasEps ? 'I' : '0';

    state.breakers = {
      q0_mcb: hasGrid,
      grid_mcb: hasGrid,
      qn_mcb: true,
      qg_mcb: hasGrid,
      inv_grid_mcb: hasGrid,
      qbp_mcb: hasGrid && hasEps,
      fspd_mcb: true,
      dc_isolator: true,
      qpv_isolator: true,
      dc_iso_1: true,
      dc_iso_2: true,
      battery_ocpd: hasBattery,
      battery_qb: hasBattery,
      eps_mcb: hasEps,
      qe_mcb: hasEps,
      qo_mcb: hasEps,
      eps_rcd: hasEps
    };

    // Reset UI fault injection buttons & mode buttons
    document.querySelectorAll('.fault-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === 'normal_day');
    });

    // Update select dropdown if different
    const profileSelect = document.getElementById('select-system-profile');
    if (profileSelect && profileSelect.value !== profileId) {
      profileSelect.value = profileId;
    }

    // Reset inspector drawer
    activeSelectedObjectData = null;
    if (typeof manageDrawerOpContainer === 'function') {
      manageDrawerOpContainer(null);
    }
    const drawer = document.getElementById('inspector-drawer');
    if (drawer && drawer.classList.contains('open')) {
      drawer.classList.remove('open');
    }

    // Update brand title
    const brandTitleEl = document.querySelector('.brand-title');
    if (brandTitleEl) {
      const std = profile.sldRef?.standard || 'IEC 60364-7-712';
      brandTitleEl.innerHTML = `${profile.name} <span style="font-size:0.75rem; background:rgba(245,158,11,0.2); color:#fbbf24; padding:2px 8px; border-radius:999px; border:1px solid rgba(245,158,11,0.4);">${std}</span>`;
    }

    // 3. If window.sceneInstance: call window.sceneInstance.dispose(), instantiate new window.HybridSolar3DScene('canvas-container', profile)
    if (window.sceneInstance) {
      if (typeof window.sceneInstance.dispose === 'function') {
        try {
          window.sceneInstance.dispose();
        } catch (err) {
          console.warn('[AppOrchestrator] Error disposing 3D scene:', err);
        }
      }
      window.sceneInstance = null;

      if (typeof window.HybridSolar3DScene === 'function') {
        try {
          window.sceneInstance = new window.HybridSolar3DScene('canvas-container', profile);
          console.log('[AppOrchestrator] Re-instantiated HybridSolar3DScene with profile:', profileId);

          // 4. Re-wire 3D events to AppOrchestrator
          wire3DSceneEvents(window.sceneInstance);
        } catch (err) {
          console.error('[AppOrchestrator] Error instantiating new 3D scene:', err);
        }
      }
    }

    // 5. Re-run computeElectricalState() and updateHUDView()
    computeElectricalState();
    updateHUDView();

    return profile;
  }

  function initApp() {
    setupHeaderActions();
    setupCockpitControls();
    setupFailureSimulator();
    setupInspectorDrawer();
    setupWhyModal();
    setupChecklistModal();
    setupCalculatorsModal();
    setupSLDModal();
    setupTroubleshootingModal();
    setupFatSatModal();
    setupGuideModal();
    setupExercisesModal();
    setupContractorsModal();
    setupDisputesModal();

    // Ensure active profile reference
    if (!state.activeProfile && window.SystemProfiles) {
      state.activeProfile = window.SystemProfiles.get(state.activeProfileId || 'profile-hyb-1p-5kw-v1');
    }

    // Instantiate 3D Scene if class is present and container is empty
    if (!window.sceneInstance && typeof window.HybridSolar3DScene === 'function') {
      try {
        const container = document.getElementById('canvas-container');
        if (container) {
          window.sceneInstance = new window.HybridSolar3DScene('canvas-container', state.activeProfile);
          console.log("3D Scene successfully initialized by App Orchestrator.");
        }
      } catch (err) {
        console.warn("Could not instantiate HybridSolar3DScene:", err);
      }
    }

    // Connect 3D switch changes and object clicks to central AppOrchestrator
    if (window.sceneInstance) {
      wire3DSceneEvents(window.sceneInstance);
    }

    // Setup Camera View & Legend Buttons
    const btnFront = document.getElementById('btn-camera-front');
    if (btnFront) {
      btnFront.addEventListener('click', () => {
        sound.playClick();
        pushCameraHistory();
        window.sceneInstance?.setCameraFrontView?.();
      });
    }
    const btnReset = document.getElementById('btn-camera-reset');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        sound.playClick();
        pushCameraHistory();
        window.sceneInstance?.resetCamera?.();
      });
    }
    const btnShell = document.getElementById('btn-toggle-enclosure-shell');
    if (btnShell) {
      btnShell.addEventListener('click', () => {
        sound.playClick();
        window.sceneInstance?.toggleEnclosureShell?.();
      });
    }
    const btnOpenLegend = document.getElementById('btn-open-legend');
    const legendModal = document.getElementById('legend-modal');
    const btnCloseLegend = document.getElementById('btn-close-legend');
    if (btnOpenLegend && legendModal) {
      btnOpenLegend.addEventListener('click', () => {
        sound.playClick();
        legendModal.classList.add('open');
      });
    }
    if (btnCloseLegend && legendModal) {
      btnCloseLegend.addEventListener('click', () => {
        sound.playClick();
        legendModal.classList.remove('open');
      });
    }

    // Start Real-time Simulation Engine Loop (Every 100ms)
    setInterval(() => {
      computeElectricalState();
      updateHUDView();
      if (state.activeInspectorComponent) {
        updateInspectorFeedSummary(state.activeInspectorComponent);
      }
    }, 100);

    // Initial calculation
    computeElectricalState();
    updateHUDView();

    console.log("5kW Hybrid PV Persian UI & Orchestrator successfully initialized.");
  }

  function renderInspectorConductor(data) {
    state.activeInspectorComponent = data.id || 'conductor';
    const titleEl = document.getElementById('drawer-comp-name');
    const categoryEl = document.getElementById('drawer-comp-category');
    const accordionContainer = document.getElementById('drawer-accordion-container');
    const whyBtn = document.getElementById('btn-why-drawer');

    if (titleEl) titleEl.textContent = data.name || data.label || `هادی الکتریکی (${data.id})`;
    if (categoryEl) categoryEl.textContent = `مسیر: ${data.pathId || 'داخلی'} | نوع: ${data.conductorType || 'فاز/نول/ارت'}`;
    if (whyBtn) whyBtn.style.display = 'none';

    const voltText = (data.voltage != null && !isNaN(data.voltage))
      ? `<div class="field-spec-row"><span class="tag-live-val">اندازه‌گیری زنده</span> <span>${data.voltage} V AC/DC</span></div>`
      : `<div class="inspector-unmodeled-row"><span class="tag-unmodeled">مدل نشده</span> <span>ولتاژ لحظه‌ای این بخش در شبیه‌ساز مدل نشده است.</span></div>`;

    const currText = (data.current != null && !isNaN(data.current))
      ? `<div class="field-spec-row"><span class="tag-live-val">اندازه‌گیری زنده</span> <span>${data.current} A</span></div>`
      : `<div class="inspector-unmodeled-row"><span class="tag-unmodeled">مدل نشده</span> <span>جریان عبوری تفکیکی این هادی در شبیه‌ساز مدل نشده است.</span></div>`;

    const fields = [
      { num: 1, label: 'شناسه فنی هادی (Conductor ID)', content: `<div class="field-spec-row"><span class="tag-ref-spec">مشخصات مرجع</span> <span>${data.id || 'N/A'}</span></div>` },
      { num: 2, label: 'ترمینال مبدا (Source Terminal)', content: `<div class="field-spec-row"><span class="tag-ref-spec">مشخصات مرجع</span> <span>${data.sourceTerminalId || 'N/A'}</span></div>` },
      { num: 3, label: 'ترمینال مقصد (Destination Terminal)', content: `<div class="field-spec-row"><span class="tag-ref-spec">مشخصات مرجع</span> <span>${data.destTerminalId || 'N/A'}</span></div>` },
      { num: 4, label: 'شناسه مسیر مرجع (Canonical Path ID)', content: `<div class="field-spec-row"><span class="tag-ref-spec">مشخصات مرجع</span> <span>${data.pathId || 'N/A'}</span></div>` },
      { num: 5, label: 'نوع هادی و رنگ‌بندی استاندارد', content: `<div class="field-spec-row"><span class="tag-ref-spec">مشخصات مرجع</span> <span>${data.conductorType || 'N/A'}</span></div>` },
      { num: 6, label: 'سطح مقطع و استاندارد هادی', content: `<div class="field-spec-row"><span class="tag-ref-spec">مشخصات مرجع</span> <span>${data.spec || '6mm² مس افشان کلاس ۵/۶ استاندارد IEC 60228 با سرسیم عایق‌دار'}</span></div>` },
      { num: 7, label: 'وضعیت الکتریکی فعلی', content: `<div class="field-spec-row"><span class="tag-live-val">اندازه‌گیری زنده</span> <span>${(data.state || ((data.voltage || 0) > 10 ? 'برق‌دار (Energized)' : 'بی‌برق و ایزوله (De-energized)'))}</span></div>` },
      { num: 8, label: 'ولتاژ لحظه‌ای', content: voltText },
      { num: 9, label: 'جریان عبوری برآورد شده', content: currText },
      { num: 10, label: 'منبع تغذیه بالادست (Source)', content: `<div class="field-spec-row"><span class="tag-ref-spec">مشخصات مرجع</span> <span>${data.source || 'شبکه سراسری / اینورتر هایبرید'}</span></div>` },
      { num: 11, label: 'مدار حفاظتی متناظر', content: `<div class="field-spec-row"><span class="tag-ref-spec">مشخصات مرجع</span> <span>${data.circuitId || 'تابلو توزیع'}</span></div>` },
      { num: 12, label: 'دستورالعمل نظارتی و ایمنی', content: `<div class="field-spec-row"><span class="tag-ref-spec">مشخصات مرجع</span> <span>کنترل گشتاور بستن پیچ ترمینال طبق جدول سازنده (۲.۵ تا ۳.۵ نیوتن‌متر) و بازرسی چشمی پرس سرسیم‌ها.</span></div>` }
    ];

    if (accordionContainer) {
      accordionContainer.innerHTML = fields.map((f, idx) => `
        <div class="accordion-item ${idx === 0 || idx === 1 ? 'active' : ''}">
          <div class="accordion-header">
            <div class="accordion-header-left">
              <span class="accordion-number">${f.num}</span>
              <span>${f.label}</span>
            </div>
            <span class="accordion-chevron">▼</span>
          </div>
          <div class="accordion-body">
            <div>${f.content}</div>
          </div>
        </div>
      `).join('');

      accordionContainer.querySelectorAll('.accordion-header').forEach(header => {
        header.addEventListener('click', () => {
          sound.playClick();
          const item = header.parentElement;
          item.classList.toggle('active');
        });
      });
    }

    const drawer = document.getElementById('inspector-drawer');
    if (drawer) drawer.classList.add('open');

    // Update dynamic single-line feeding summary banner
    updateInspectorFeedSummary(data.id || 'conductor');
  }

  // Global Orchestrator Hook for 3D Scene and SLD interactions
  window.AppOrchestrator = {
    openInspectorForComponent: (id) => {
      activeSelectedObjectData = null;
      manageDrawerOpContainer(null);
      renderInspectorComponent(id);
    },
    updateInspectorFeedSummary,
    pushCameraHistory,
    popCameraHistory,
    showCameraPrevBtn: () => {
      const btn = document.getElementById('btn-camera-prev');
      if (btn) btn.style.display = 'inline-flex';
    },
    hideCameraPrevBtn: () => {
      const btn = document.getElementById('btn-camera-prev');
      if (btn) btn.style.display = 'none';
    },
    onSbyStateChanged: (pos, origin) => {
      const myGeneration = ++sbyTransferGeneration;
      const oldPos = state.sbyPosition;
      if (oldPos === pos) return;

      // Break-Before-Make transfer: transition through '0' (OFF) when changing between I and II
      if ((oldPos === 'I' && pos === 'II') || (oldPos === 'II' && pos === 'I')) {
        state.sbyPosition = '0';
        if (origin !== '3d' && window.sceneInstance?.setSbyPosition3D) {
          window.sceneInstance.setSbyPosition3D('0', 'orchestrator');
        }
        if (origin !== 'sld' && window.SLDSchematic?.setSbyPosition) {
          window.SLDSchematic.setSbyPosition('0', 'orchestrator');
        }
        computeElectricalState();
        updateHUDView();

        setTimeout(() => {
          if (myGeneration !== sbyTransferGeneration) return;
          state.sbyPosition = pos;
          sound.playSbySwitch(pos);
          if (origin !== '3d' && window.sceneInstance?.setSbyPosition3D) {
            window.sceneInstance.setSbyPosition3D(pos, 'orchestrator');
          }
          if (origin !== 'sld' && window.SLDSchematic?.setSbyPosition) {
            window.SLDSchematic.setSbyPosition(pos, 'orchestrator');
          }
          if (window.simulationEngine?.setSbyPosition) {
            window.simulationEngine.setSbyPosition(pos);
          }
          computeElectricalState();
          updateHUDView();
        }, 80);
        return;
      }

      state.sbyPosition = pos;
      sound.playSbySwitch(pos);
      computeElectricalState();
      updateHUDView();
      if (origin !== '3d' && window.sceneInstance?.setSbyPosition3D) {
        window.sceneInstance.setSbyPosition3D(pos, 'orchestrator');
      }
      if (origin !== 'sld' && window.SLDSchematic?.setSbyPosition) {
        window.SLDSchematic.setSbyPosition(pos, 'orchestrator');
      }
      if (window.simulationEngine?.setSbyPosition) {
        window.simulationEngine.setSbyPosition(pos);
      }
    },
    onBreakerStateChanged: (breakerId, stateBool, origin) => {
      state.breakers[breakerId] = stateBool;

      // Map of canonical ID and aliases
      const aliasMap = {
        'dc_isolator': ['qpv_isolator', 'dc_iso_1', 'sld-dc-iso-1', 'sld-dc-iso-2'],
        'qpv_isolator': ['dc_isolator', 'dc_iso_1', 'sld-dc-iso-1', 'sld-dc-iso-2'],
        'dc_iso_1': ['dc_isolator', 'qpv_isolator', 'sld-dc-iso-1'],
        'dc_iso_2': ['sld-dc-iso-2'],
        'battery_ocpd': ['battery_qb', 'bat_breaker', 'sld-bat-fuse'],
        'battery_qb': ['battery_ocpd', 'bat_breaker', 'sld-bat-fuse'],
        'bat_breaker': ['battery_ocpd', 'battery_qb', 'sld-bat-fuse'],
        'eps_mcb': ['qe_mcb', 'sld-qe'],
        'qe_mcb': ['eps_mcb', 'sld-qe'],
        'grid_mcb': ['q0_mcb', 'grid_incomer_mcb', 'sld-q0'],
        'q0_mcb': ['grid_mcb', 'grid_incomer_mcb', 'sld-q0'],
        'qbp_mcb': ['grid_bypass_mcb', 'sld-qbp'],
        'grid_bypass_mcb': ['qbp_mcb', 'sld-qbp'],
        'qo_mcb': ['eps_incomer_mcb', 'sld-qo'],
        'eps_incomer_mcb': ['qo_mcb', 'sld-qo'],
        'eps_rcd': ['sld-rcd', 'crit_rcbo_1'],
        'crit_rcbo_1': ['eps_rcd', 'sld-rcd'],
        'fspd_mcb': ['spd_backup_mcb', 'sld-fspd-mcb'],
        'spd_backup_mcb': ['fspd_mcb', 'sld-fspd-mcb']
      };

      const aliases = aliasMap[breakerId] || [];
      aliases.forEach(alias => {
        state.breakers[alias] = stateBool;
      });

      if (origin !== '3d' && window.sceneInstance?.setBreakerState3D) {
        window.sceneInstance.setBreakerState3D(breakerId, stateBool, 'orchestrator');
      }
      if (origin !== 'sld' && window.SLDSchematic?.setBreakerState) {
        window.SLDSchematic.setBreakerState(breakerId, stateBool, 'orchestrator');
      }

      computeElectricalState();
      updateHUDView();
    },
    setBreaker: function(breakerId, stateBool, origin = 'orchestrator') {
      this.onBreakerStateChanged(breakerId, stateBool, origin);
    },
    switchSystemProfile: function(profileId) {
      return switchSystemProfile(profileId);
    },
    get activeProfile() {
      return state.activeProfile || (window.SystemProfiles?.get(state.activeProfileId || 'profile-hyb-1p-5kw-v1')) || null;
    },
    getState: () => state
  };

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

})();
