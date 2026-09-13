/**
 * 5kW Single-Phase Hybrid Solar PV 3D Simulator - Simulation Engine
 * 
 * Comprehensive Mathematical Simulation Physics, Fault State Machine,
 * Pedagogical Sequencers, Flow Filtering, Educational Calculators,
 * and Reactive Event Dispatching.
 *
 * @module HybridSolarSimulationEngine
 * @author Agent 2: Simulation Physics & Sound Specialist
 */

// ============================================================================
// 1. REACTIVE EVENT EMITTER BASE CLASS
// ============================================================================

class EventEmitter {
  constructor() {
    this._listeners = new Map();
  }

  /**
   * Subscribe to an event
   * @param {string} event - Event name
   * @param {Function} handler - Callback function
   * @returns {Function} Unsubscribe function
   */
  on(event, handler) {
    if (typeof handler !== 'function') {
      throw new TypeError('Event listener must be a function');
    }
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event).add(handler);
    return () => this.off(event, handler);
  }

  /**
   * Unsubscribe from an event
   * @param {string} event - Event name
   * @param {Function} handler - Callback function
   */
  off(event, handler) {
    const handlers = this._listeners.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this._listeners.delete(event);
      }
    }
  }

  /**
   * Subscribe once to an event
   * @param {string} event - Event name
   * @param {Function} handler - Callback function
   */
  once(event, handler) {
    const wrapper = (...args) => {
      this.off(event, wrapper);
      handler.apply(this, args);
    };
    return this.on(event, wrapper);
  }

  /**
   * Emit an event to all subscribers
   * @param {string} event - Event name
   * @param {*} data - Event payload
   */
  emit(event, data) {
    const handlers = this._listeners.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (err) {
          console.error(`Error in event listener for "${event}":`, err);
        }
      });
    }
  }

  /**
   * Remove all listeners for an event or all events
   * @param {string} [event] - Event name
   */
  removeAllListeners(event) {
    if (event) {
      this._listeners.delete(event);
    } else {
      this._listeners.clear();
    }
  }
}

// ============================================================================
// 2. SYSTEM SPECIFICATIONS & STANDARDS CONSTANTS
// ============================================================================

const SYSTEM_SPECS = Object.freeze({
  inverter: {
    model: '5kW Single-Phase Hybrid Inverter with EPS',
    ratedAcPower_W: 5000,
    peakEpsPower_VA: 6000,
    peakEpsDuration_s: 10,
    mpptVoltageMin_V: 120,
    mpptVoltageMax_V: 500,
    maxDcVoltage_V: 550,
    startVoltage_V: 150,
    inverterEfficiency: 0.97, // 97% DC-AC
    dcdcEfficiency: 0.96,     // 96% DC-DC
    nominalAcVoltage_V: 230,
    nominalAcFrequency_Hz: 50.0,
    maxAcCurrent_A: 21.74,    // 5000W / 230V
    antiIslandingDisconnectTime_ms: 20
  },
  pvModule: {
    model: '450W Monocrystalline PERC',
    pNominal_W: 450,
    voc_V: 49.5,
    vmp_V: 41.5,
    isc_A: 11.50,
    imp_A: 10.84,
    tempCoeffVoc_pct: -0.27,  // %/°C (-0.0027)
    tempCoeffVmp_pct: -0.35,  // %/°C (-0.0035)
    tempCoeffIsc_pct: +0.048, // %/°C (+0.00048)
    noct_C: 45.0,
    panelsPerString: 6,
    numStrings: 2,
    maxSeriesFuseRating_A: 20.0
  },
  battery: {
    model: '51.2V 100Ah 5.12kWh LiFePO4 16S Pack',
    chemistry: 'LiFePO4 (LFP)',
    configuration: '16S1P',
    nominalVoltage_V: 51.2,   // 16 * 3.2V
    capacity_Ah: 100.0,
    energy_Wh: 5120.0,
    cutoffVoltage_V: 44.0,    // 2.75V / cell
    bulkVoltage_V: 57.6,      // 3.60V / cell
    floatVoltage_V: 54.4,     // 3.40V / cell
    maxContinuousCurrent_A: 100.0, // 1C
    peakCurrent_A: 120.0,     // 1.2C surge
    internalResistance_Ohm: 0.020, // 20 mOhm
    chargeEfficiency: 0.95,
    dischargeEfficiency: 0.97,
    recommendedMinSoc_pct: 10.0,
    recommendedMaxSoc_pct: 100.0
  }
});

// 16S LiFePO4 Open Circuit Voltage (OCV) Piecewise Linear Curve
const LIFEPO4_16S_OCV_CURVE = Object.freeze([
  { soc: 0.00, ocv: 44.00 }, // 2.75V / cell (Cutoff)
  { soc: 0.05, ocv: 48.00 }, // 3.00V / cell
  { soc: 0.10, ocv: 49.60 }, // 3.10V / cell (Knee)
  { soc: 0.15, ocv: 50.80 }, // 3.175V / cell
  { soc: 0.20, ocv: 51.20 }, // 3.20V / cell
  { soc: 0.30, ocv: 51.80 }, // 3.238V / cell
  { soc: 0.40, ocv: 52.20 }, // 3.262V / cell
  { soc: 0.50, ocv: 52.50 }, // 3.281V / cell (Mid-plateau)
  { soc: 0.60, ocv: 52.65 }, // 3.291V / cell
  { soc: 0.70, ocv: 52.80 }, // 3.300V / cell
  { soc: 0.80, ocv: 53.10 }, // 3.319V / cell
  { soc: 0.90, ocv: 53.60 }, // 3.350V / cell (Upper Knee)
  { soc: 0.95, ocv: 54.40 }, // 3.400V / cell (Float level)
  { soc: 0.98, ocv: 56.00 }, // 3.500V / cell
  { soc: 1.00, ocv: 57.60 }  // 3.600V / cell (Bulk / Absorption)
]);

// Engine State Machine States
const INVERTER_STATES = Object.freeze({
  NORMAL_GRID: 'NORMAL_GRID',
  GRID_FAILURE_EPS: 'GRID_FAILURE_EPS',
  FAULT_LOCKOUT: 'FAULT_LOCKOUT'
});

// Pedagogical Transition Sub-Phases
const SUB_PHASES = Object.freeze({
  // Steady states
  GRID_TIED_STEADY: 'GRID_TIED_STEADY',
  ISLAND_STABLE: 'ISLAND_STABLE',
  LOCKOUT_HALT: 'LOCKOUT_HALT',
  // Grid Failure Sequence
  GRID_LOSS_DETECTED: 'GRID_LOSS_DETECTED',
  ANTI_ISLANDING_DETECT: 'ANTI_ISLANDING_DETECT',
  RELAYS_OPEN: 'RELAYS_OPEN',
  // Grid Restoration Sequence
  VOLTAGE_RETURN: 'VOLTAGE_RETURN',
  QUALIFICATION_TIMER: 'QUALIFICATION_TIMER',
  PHASE_SYNCHRONIZATION: 'PHASE_SYNCHRONIZATION',
  GRID_RECONNECTED: 'GRID_RECONNECTED'
});

// 9 Standard Fault Scenarios + aliases
const FAULT_KEYS = Object.freeze({
  GRID_FAILURE: 'GRID_FAILURE',
  GRID_OUTAGE: 'GRID_OUTAGE',
  GRID_BROWNOUT: 'GRID_BROWNOUT',
  BATTERY_LOW: 'BATTERY_LOW',
  BMS_FAULT: 'BMS_FAULT',
  PV_UNAVAILABLE: 'PV_UNAVAILABLE',
  EPS_OVERLOAD: 'EPS_OVERLOAD',
  RCD_TRIP: 'RCD_TRIP',
  DC_ISOLATOR_OPEN: 'DC_ISOLATOR_OPEN',
  GRID_BREAKER_OPEN: 'GRID_BREAKER_OPEN',
  CT_COMM_FAILURE: 'CT_COMM_FAILURE'
});

// 8 Visual Flow Filter Modes
const FLOW_FILTERS = Object.freeze({
  ALL: 'ALL',
  PV_ONLY: 'PV_ONLY',
  BATTERY_ONLY: 'BATTERY_ONLY',
  GRID_ONLY: 'GRID_ONLY',
  EPS_ONLY: 'EPS_ONLY',
  NEUTRAL_ONLY: 'NEUTRAL_ONLY',
  PE_ONLY: 'PE_ONLY',
  COMMS_ONLY: 'COMMS_ONLY'
});

// Neutral Topologies
const NEUTRAL_TOPOLOGIES = Object.freeze({
  INTERNAL_N_PE_RELAY: 'INTERNAL_N_PE_RELAY',
  COMMON_NEUTRAL: 'COMMON_NEUTRAL',
  SWITCHED_NEUTRAL: 'SWITCHED_NEUTRAL'
});

// ============================================================================
// 3. HYBRID SOLAR SIMULATION ENGINE IMPLEMENTATION
// ============================================================================

class HybridSolarSimulationEngine extends EventEmitter {
  constructor(initialConfig = {}) {
    super();

    // Environment & Inputs
    this.ambientTemp_C = initialConfig.ambientTemp_C ?? 25.0;
    this.irradianceS1_W_m2 = initialConfig.irradianceS1_W_m2 ?? 1000.0;
    this.irradianceS2_W_m2 = initialConfig.irradianceS2_W_m2 ?? 1000.0;
    this.normalLoads_W = initialConfig.normalLoads_W ?? 1800.0;
    this.criticalLoads_W = initialConfig.criticalLoads_W ?? 1200.0;
    this.zeroExportEnabled = initialConfig.zeroExportEnabled ?? false;
    this.maxGridExportLimit_W = initialConfig.maxGridExportLimit_W ?? 5000.0;

    // Simulation Timing
    this.simSpeed = 1.0; // multiplier
    this.lastTickTime = Date.now();
    this.qualificationDuration_s = initialConfig.qualificationDuration_s ?? 5.0; // 5s for demo, 60s in real standard
    this.qualificationRemaining_s = 0.0;
    this.syncProgress_pct = 0.0;

    // State Machine
    this.state = INVERTER_STATES.NORMAL_GRID;
    this.subPhase = SUB_PHASES.GRID_TIED_STEADY;
    this.neutralTopology = NEUTRAL_TOPOLOGIES.INTERNAL_N_PE_RELAY;
    this.flowFilter = FLOW_FILTERS.ALL;
    this.sbyPosition = initialConfig.sbyPosition ?? 'I'; // 'I'=EPS, '0'=OFF, 'II'=Grid Bypass

    // Battery State Variables
    this.batterySOC_pct = initialConfig.batterySOC_pct ?? 75.0; // 0..100%
    this.batteryCurrent_A = 0.0; // + charging, - discharging
    this.batteryVoltage_V = 52.8;

    // Physical Relays & Contactors
    this.relays = {
      gridContactor: true,    // Main AC Grid contactor
      epsRelay: true,         // EPS port output relay
      nPeBondRelay: false,    // Internal N-PE dynamic bonding relay (closed in islanding)
      bmsContactor: true,     // Battery internal BMS contactor
      dcIsolator: true,       // DC rotary isolator
      gridBreaker: true,      // Main Service MCB
      epsBreaker: true,       // EPS sub-panel MCB
      rcdTripped: false,      // Residual Current Device status
      qbpBreaker: true,       // Bypass Source II MCB
      qoBreaker: true,        // Essential DB Incomer MCB
      qnBreaker: true,        // Non-essential DB MCB
      ksep: {
        coil: true,
        contact: true,
        rating: '230V 32A 2P NO',
        inputCondition: 'Grid Qualified (230V 50Hz Sync OK)',
        outputState: 'CLOSED',
        feedback: 'OK'
      },
      kne: {
        coil: false,
        contact: false,
        rating: '230V 16A 1P NO',
        inputCondition: 'Grid-Tied Normal (Upstream MEN Active)',
        outputState: 'OPEN',
        feedback: 'OK'
      }
    };

    // Precharge sequence state machine (DC bus capacitor charging)
    this.precharge = {
      state: 'COMPLETE', // 'IDLE', 'ACTIVE', 'COMPLETE', 'FAILED'
      busVoltage_V: 51.2,
      targetVoltage_V: 51.2,
      resistor_Ohm: 50.0,
      capacitance_uF: 3300.0,
      inrushCurrent_A: 0.0,
      progress_pct: 100.0,
      timer_s: 0.0,
      timeout_s: 2.0
    };

    // Communications Status
    this.comms = {
      smartMeterOnline: true,
      bmsOnline: true,
      zeroExportActive: false
    };

    // Active Faults Map
    this.activeFaults = new Map();
    for (const key of Object.values(FAULT_KEYS)) {
      this.activeFaults.set(key, false);
    }

    // Telemetry Cache
    this.telemetry = null;

    // Transition Sequencer State
    this._sequencerTimer = null;
    this._phaseSyncAngle_deg = 0.0;

    // 10-Step Tutorial Manager
    this._tutorial = {
      active: false,
      currentStep: 1,
      totalSteps: 10
    };

    // Initialize telemetry
    this.updatePhysics(0);
  }

  // ==========================================================================
  // 4. PHOTOVOLTAIC (PV) REAL-TIME PHYSICS SOLVER
  // ==========================================================================

  /**
   * Calculates real-time cell temperature according to the standard NOCT formula:
   * T_cell = T_amb + ((NOCT - 20) / 800) * G
   * @param {number} G - Solar Irradiance in W/m²
   * @param {number} Tamb - Ambient Temperature in °C
   * @returns {number} Cell temperature in °C
   */
  calculateCellTemperature(G, Tamb) {
    const { noct_C } = SYSTEM_SPECS.pvModule;
    if (G <= 0) return Tamb;
    return Tamb + ((noct_C - 20.0) / 800.0) * G;
  }

  /**
   * Solves electrical characteristics for a single series PV string under real conditions
   * @param {number} G - Irradiance on string (W/m²)
   * @param {number} Tamb - Ambient temperature (°C)
   * @param {boolean} isConnected - Whether string DC isolator is closed
   * @returns {Object} String electrical state { Voc, Vmp, Isc, Imp, Pdc, Tcell }
   */
  solvePVString(G, Tamb, isConnected) {
    const mod = SYSTEM_SPECS.pvModule;
    const N = mod.panelsPerString;

    if (!isConnected || G <= 0) {
      const Tcell = Tamb;
      const deltaT = Tcell - 25.0;
      const Voc_open = isConnected ? 0 : N * mod.voc_V * (1 + (mod.tempCoeffVoc_pct / 100.0) * deltaT);
      return {
        Voc_V: Voc_open,
        Vmp_V: 0.0,
        Isc_A: 0.0,
        Imp_A: 0.0,
        powerDC_W: 0.0,
        tCell_C: Tcell,
        irradiance_W_m2: G
      };
    }

    const Tcell = this.calculateCellTemperature(G, Tamb);
    const deltaT = Tcell - 25.0;

    // Temperature corrections
    const Voc = N * mod.voc_V * (1 + (mod.tempCoeffVoc_pct / 100.0) * deltaT);
    const Vmp = N * mod.vmp_V * (1 + (mod.tempCoeffVmp_pct / 100.0) * deltaT);
    const Isc = mod.isc_A * (G / 1000.0) * (1 + (mod.tempCoeffIsc_pct / 100.0) * deltaT);
    const Imp = mod.imp_A * (G / 1000.0) * (1 + (mod.tempCoeffIsc_pct / 100.0) * deltaT);

    const powerDC = Math.max(0, Vmp * Imp);

    return {
      Voc_V: Voc,
      Vmp_V: Vmp,
      Isc_A: Isc,
      Imp_A: Imp,
      powerDC_W: powerDC,
      tCell_C: Tcell,
      irradiance_W_m2: G
    };
  }

  // ==========================================================================
  // 5. BATTERY ELECTROCHEMICAL DYNAMICS SOLVER
  // ==========================================================================

  /**
   * Evaluates Open-Circuit Voltage (OCV) from SOC via piecewise linear interpolation
   * @param {number} soc_pct - State of charge (0..100)
   * @returns {number} OCV in Volts
   */
  getBatteryOCV(soc_pct) {
    const socNorm = Math.min(1.0, Math.max(0.0, soc_pct / 100.0));
    const curve = LIFEPO4_16S_OCV_CURVE;

    if (socNorm <= curve[0].soc) return curve[0].ocv;
    if (socNorm >= curve[curve.length - 1].soc) return curve[curve.length - 1].ocv;

    for (let i = 0; i < curve.length - 1; i++) {
      const p1 = curve[i];
      const p2 = curve[i + 1];
      if (socNorm >= p1.soc && socNorm <= p2.soc) {
        const ratio = (socNorm - p1.soc) / (p2.soc - p1.soc);
        return p1.ocv + ratio * (p2.ocv - p1.ocv);
      }
    }
    return SYSTEM_SPECS.battery.nominalVoltage_V;
  }

  /**
   * Updates battery electrochemical state by integrating Coulomb counting over dt
   * @param {number} targetPower_W - Desired power (+ for charging, - for discharging)
   * @param {number} dt_s - Time step in seconds
   * @returns {Object} { actualPower_W, terminalVoltage_V, current_A }
   */
  updateBatteryElectrochemicals(targetPower_W, dt_s) {
    const bat = SYSTEM_SPECS.battery;
    const Rint = bat.internalResistance_Ohm;
    const ocv = this.getBatteryOCV(this.batterySOC_pct);

    // If BMS contactor is open or BMS fault active, zero power flow
    if (!this.relays.bmsContactor || this.activeFaults.get(FAULT_KEYS.BMS_FAULT)) {
      this.batteryCurrent_A = 0.0;
      this.batteryVoltage_V = ocv;
      return {
        actualPower_W: 0.0,
        terminalVoltage_V: ocv,
        current_A: 0.0
      };
    }

    let current = 0.0;
    let actualPower = 0.0;

    if (targetPower_W > 0) {
      // CHARGING MODE
      if (this.batterySOC_pct >= bat.recommendedMaxSoc_pct) {
        actualPower = 0.0;
        current = 0.0;
      } else {
        // Max charge current capped by 1C (100A)
        const maxChgCurrent = bat.maxContinuousCurrent_A;
        // P = Vterm * I = (Voc + I * Rint) * I = Voc*I + I^2*Rint
        // Solving quadratic: Rint*I^2 + Voc*I - P = 0
        const a = Rint;
        const b = ocv;
        const c = -targetPower_W;
        const disc = b * b - 4 * a * c;
        if (disc >= 0) {
          current = (-b + Math.sqrt(disc)) / (2 * a);
        } else {
          current = targetPower_W / ocv;
        }

        current = Math.min(current, maxChgCurrent);
        // Voltage clamp at bulk 57.6V
        let vTerm = ocv + current * Rint;
        if (vTerm > bat.bulkVoltage_V) {
          vTerm = bat.bulkVoltage_V;
          current = Math.max(0, (vTerm - ocv) / Rint);
        }

        actualPower = vTerm * current;
        // Coulomb counting charge integration with charge efficiency
        const dAh = (current * (dt_s / 3600.0)) * bat.chargeEfficiency;
        this.batterySOC_pct = Math.min(100.0, this.batterySOC_pct + (dAh / bat.capacity_Ah) * 100.0);
      }
    } else if (targetPower_W < 0) {
      // DISCHARGING MODE
      const reqDischargePower = Math.abs(targetPower_W);
      if (this.batterySOC_pct <= bat.recommendedMinSoc_pct || this.activeFaults.get(FAULT_KEYS.BATTERY_LOW)) {
        actualPower = 0.0;
        current = 0.0;
      } else {
        const maxDischgCurrent = bat.maxContinuousCurrent_A;
        // P = Vterm * I = (Voc - I * Rint) * I = Voc*I - I^2*Rint
        // Solving quadratic: Rint*I^2 - Voc*I + P = 0
        const a = Rint;
        const b = -ocv;
        const c = reqDischargePower;
        const disc = b * b - 4 * a * c;
        if (disc >= 0) {
          current = (ocv - Math.sqrt(disc)) / (2 * a);
        } else {
          current = reqDischargePower / ocv;
        }

        current = Math.min(current, maxDischgCurrent);
        // Floor at cut-off voltage 44.0V
        let vTerm = ocv - current * Rint;
        if (vTerm < bat.cutoffVoltage_V) {
          vTerm = bat.cutoffVoltage_V;
          current = Math.max(0, (ocv - vTerm) / Rint);
        }

        actualPower = -(vTerm * current);
        // Coulomb counting discharge integration with discharge efficiency
        const dAh = (current * (dt_s / 3600.0)) / bat.dischargeEfficiency;
        this.batterySOC_pct = Math.max(0.0, this.batterySOC_pct - (dAh / bat.capacity_Ah) * 100.0);
      }
    }

    const finalVterm = ocv + (current * (targetPower_W >= 0 ? 1 : -1)) * Rint;
    this.batteryCurrent_A = targetPower_W >= 0 ? current : -current;
    this.batteryVoltage_V = finalVterm;

    // Check for low battery condition
    if (this.batterySOC_pct <= bat.recommendedMinSoc_pct) {
      this.activeFaults.set(FAULT_KEYS.BATTERY_LOW, true);
    }

    return {
      actualPower_W: actualPower,
      terminalVoltage_V: finalVterm,
      current_A: this.batteryCurrent_A
    };
  }

  // ==========================================================================
  // 6. INVERTER POWER DISPATCH SOLVER
  // ==========================================================================

  /**
   * Solves power distribution across PV, Battery, Loads, and Grid
   * @param {number} dt_s - Simulation elapsed time in seconds
   */
  solveInverterPowerDispatch(dt_s) {
    const inv = SYSTEM_SPECS.inverter;
    const bat = SYSTEM_SPECS.battery;

    // 1. Solve PV strings
    const dcIsolatorClosed = this.relays.dcIsolator && !this.activeFaults.get(FAULT_KEYS.DC_ISOLATOR_OPEN);
    const pvAvailable = !this.activeFaults.get(FAULT_KEYS.PV_UNAVAILABLE);
    
    const G1 = pvAvailable ? this.irradianceS1_W_m2 : 0;
    const G2 = pvAvailable ? this.irradianceS2_W_m2 : 0;

    const s1 = this.solvePVString(G1, this.ambientTemp_C, dcIsolatorClosed);
    const s2 = this.solvePVString(G2, this.ambientTemp_C, dcIsolatorClosed);
    const pvTotalDC_W = s1.powerDC_W + s2.powerDC_W;

    // PV DC to AC power capability
    const pvMaxAC_W = pvTotalDC_W * inv.dcdcEfficiency * inv.inverterEfficiency;

    // 2. Load demands (incorporate RCD trip & SBY 3-position routing)
    const rcdHealthy = !this.relays.rcdTripped && !this.activeFaults.get(FAULT_KEYS.RCD_TRIP);
    const qoClosed = this.relays.qoBreaker !== false;
    let pCrit = 0.0;
    let pCritFromBypass = 0.0;

    if (qoClosed && rcdHealthy) {
      if (this.sbyPosition === 'I') {
        pCrit = (this.relays.epsBreaker !== false) ? this.criticalLoads_W : 0.0;
      } else if (this.sbyPosition === 'II') {
        // Grid Bypass via QBP: fed directly from Grid, independent of Inverter EPS
        const qbpClosed = this.relays.qbpBreaker !== false;
        if (qbpClosed && this.state === INVERTER_STATES.NORMAL_GRID) {
          pCritFromBypass = this.criticalLoads_W;
        }
      }
      // If sbyPosition === '0': Both are 0.0 (fully isolated)
    }

    let pNorm = (this.relays.gridBreaker && (this.relays.qnBreaker !== false)) ? this.normalLoads_W : 0.0;

    // Check EPS Overload
    if (this.criticalLoads_W > inv.ratedAcPower_W || this.activeFaults.get(FAULT_KEYS.EPS_OVERLOAD)) {
      this.activeFaults.set(FAULT_KEYS.EPS_OVERLOAD, true);
      this.relays.epsBreaker = false;
      pCrit = 0.0;
    }

    // 3. Zero-Export and Smart Meter Status
    const ctFailure = this.activeFaults.get(FAULT_KEYS.CT_COMM_FAILURE);
    this.comms.smartMeterOnline = !ctFailure;
    const effectiveZeroExport = this.zeroExportEnabled || ctFailure;
    this.comms.zeroExportActive = effectiveZeroExport;

    // Dispatch Variables
    let pvPowerActualDC_W = pvTotalDC_W;
    let pvPowerActualAC_W = pvMaxAC_W;
    let batteryPower_W = 0.0; // + charge, - discharge
    let gridPortPower_W = 0.0; // + import, - export
    let epsPortPower_W = pCrit;
    let normalLoadsPower_W = pNorm;
    let gridVoltage_V = 230.0;
    let gridFrequency_Hz = 50.0;

    // ========================================================================
    // MODE A: NORMAL GRID-CONNECTED OPERATION
    // ========================================================================
    if (this.state === INVERTER_STATES.NORMAL_GRID) {
      this.relays.gridContactor = true;
      this.relays.nPeBondRelay = false; // Grid MEN handles N-PE bond

      const totalLoad_W = pCrit + pNorm;

      if (pvPowerActualAC_W >= totalLoad_W) {
        // PV SURPLUS
        const surplusAC_W = pvPowerActualAC_W - totalLoad_W;
        // Battery can absorb surplus via DC-DC
        const surplusDC_W = surplusAC_W / (inv.dcdcEfficiency * inv.inverterEfficiency);

        const batMaxChgPower_W = Math.min(
          inv.ratedAcPower_W,
          bat.maxContinuousCurrent_A * this.batteryVoltage_V
        );

        let targetBatChg_W = 0.0;
        if (this.batterySOC_pct < 100.0 && this.relays.bmsContactor && !this.activeFaults.get(FAULT_KEYS.BMS_FAULT)) {
          targetBatChg_W = Math.min(surplusDC_W, batMaxChgPower_W);
        }

        const batResult = this.updateBatteryElectrochemicals(targetBatChg_W, dt_s);
        batteryPower_W = batResult.actualPower_W;

        // Surplus after battery charging
        const batUsedAC_W = batteryPower_W * inv.dcdcEfficiency * inv.inverterEfficiency;
        let remainingSurplusAC_W = Math.max(0.0, surplusAC_W - batUsedAC_W);

        if (effectiveZeroExport) {
          // CURTAILMENT: Zero export to grid
          gridPortPower_W = 0.0;
          const requiredPvAC_W = totalLoad_W + batUsedAC_W;
          pvPowerActualAC_W = Math.min(pvPowerActualAC_W, requiredPvAC_W);
          pvPowerActualDC_W = pvPowerActualAC_W / (inv.dcdcEfficiency * inv.inverterEfficiency);
        } else {
          // EXPORT TO GRID
          const allowedExport_W = Math.min(remainingSurplusAC_W, this.maxGridExportLimit_W);
          gridPortPower_W = -allowedExport_W; // Negative denotes export
          const exportedAC_W = allowedExport_W;
          const curtailedAC_W = remainingSurplusAC_W - exportedAC_W;
          if (curtailedAC_W > 0) {
            pvPowerActualAC_W -= curtailedAC_W;
            pvPowerActualDC_W = pvPowerActualAC_W / (inv.dcdcEfficiency * inv.inverterEfficiency);
          }
        }
      } else {
        // PV DEFICIT (Load > PV)
        const deficitAC_W = totalLoad_W - pvPowerActualAC_W;

        // Try battery discharge to cover deficit
        let batTargetDischg_W = 0.0;
        if (this.batterySOC_pct > bat.recommendedMinSoc_pct &&
            this.relays.bmsContactor &&
            !this.activeFaults.get(FAULT_KEYS.BMS_FAULT) &&
            !this.activeFaults.get(FAULT_KEYS.BATTERY_LOW)) {
          
          const maxBatDischgDC_W = Math.min(
            inv.ratedAcPower_W / (inv.dcdcEfficiency * inv.inverterEfficiency),
            bat.maxContinuousCurrent_A * this.batteryVoltage_V
          );
          const reqBatDC_W = deficitAC_W / (inv.dcdcEfficiency * inv.inverterEfficiency);
          batTargetDischg_W = -Math.min(reqBatDC_W, maxBatDischgDC_W);
        }

        const batResult = this.updateBatteryElectrochemicals(batTargetDischg_W, dt_s);
        batteryPower_W = batResult.actualPower_W;

        const batProvidedAC_W = Math.abs(batteryPower_W) * inv.dcdcEfficiency * inv.inverterEfficiency;
        const remainingDeficitAC_W = Math.max(0.0, deficitAC_W - batProvidedAC_W);

        // Grid supplies remaining deficit
        gridPortPower_W = remainingDeficitAC_W; // Positive denotes import
      }
    }

    // ========================================================================
    // MODE B: GRID FAILURE / EPS BACKUP OPERATION
    // ========================================================================
    else if (this.state === INVERTER_STATES.GRID_FAILURE_EPS) {
      this.relays.gridContactor = false; // Mechanically isolated from grid
      gridVoltage_V = 0.0;
      gridFrequency_Hz = 0.0;
      gridPortPower_W = 0.0;
      normalLoadsPower_W = 0.0; // Non-critical loads shed!

      // Neutral-to-PE bonding relay engages in Islanding for Internal relay topology
      if (this.neutralTopology === NEUTRAL_TOPOLOGIES.INTERNAL_N_PE_RELAY) {
        this.relays.nPeBondRelay = true;
      } else {
        this.relays.nPeBondRelay = false;
      }

      // EPS load demand
      const epsDemand_W = pCrit;

      if (pvPowerActualAC_W >= epsDemand_W) {
        // PV can satisfy EPS load
        const surplusAC_W = pvPowerActualAC_W - epsDemand_W;
        const surplusDC_W = surplusAC_W / (inv.dcdcEfficiency * inv.inverterEfficiency);

        let targetBatChg_W = 0.0;
        if (this.batterySOC_pct < 100.0 && this.relays.bmsContactor && !this.activeFaults.get(FAULT_KEYS.BMS_FAULT)) {
          targetBatChg_W = Math.min(surplusDC_W, inv.ratedAcPower_W);
        }

        const batResult = this.updateBatteryElectrochemicals(targetBatChg_W, dt_s);
        batteryPower_W = batResult.actualPower_W;

        // Curtail PV to match EPS + Battery charge
        const batUsedAC_W = batteryPower_W * inv.dcdcEfficiency * inv.inverterEfficiency;
        const neededPvAC_W = epsDemand_W + batUsedAC_W;
        pvPowerActualAC_W = Math.min(pvPowerActualAC_W, neededPvAC_W);
        pvPowerActualDC_W = pvPowerActualAC_W / (inv.dcdcEfficiency * inv.inverterEfficiency);
      } else {
        // PV deficit in EPS mode - Battery must supply remainder
        const epsDeficitAC_W = epsDemand_W - pvPowerActualAC_W;
        let batTargetDischg_W = 0.0;

        if (this.batterySOC_pct > bat.recommendedMinSoc_pct &&
            this.relays.bmsContactor &&
            !this.activeFaults.get(FAULT_KEYS.BMS_FAULT) &&
            !this.activeFaults.get(FAULT_KEYS.BATTERY_LOW)) {
          
          const maxBatDischgDC_W = Math.min(
            inv.ratedAcPower_W / (inv.dcdcEfficiency * inv.inverterEfficiency),
            bat.maxContinuousCurrent_A * this.batteryVoltage_V
          );
          const reqBatDC_W = epsDeficitAC_W / (inv.dcdcEfficiency * inv.inverterEfficiency);
          batTargetDischg_W = -Math.min(reqBatDC_W, maxBatDischgDC_W);
        }

        const batResult = this.updateBatteryElectrochemicals(batTargetDischg_W, dt_s);
        batteryPower_W = batResult.actualPower_W;

        const batProvidedAC_W = Math.abs(batteryPower_W) * inv.dcdcEfficiency * inv.inverterEfficiency;
        const unsuppliedAC_W = epsDeficitAC_W - batProvidedAC_W;

        if (unsuppliedAC_W > 10.0) {
          // Brownout / Inadequate power on EPS bus
          epsPortPower_W = pvPowerActualAC_W + batProvidedAC_W;
        }
      }

      // Total Source Loss Check in island mode
      const batCanDischarge = this.batterySOC_pct > bat.recommendedMinSoc_pct &&
                              this.relays.bmsContactor &&
                              !this.activeFaults.get(FAULT_KEYS.BMS_FAULT) &&
                              !this.activeFaults.get(FAULT_KEYS.BATTERY_LOW);
      const sourcesAvailable = (pvPowerActualAC_W > 10.0) || batCanDischarge;

      if (!sourcesAvailable) {
        epsPortPower_W = 0.0;
      }
    }

    // ========================================================================
    // MODE C: FAULT LOCKOUT
    // ========================================================================
    else if (this.state === INVERTER_STATES.FAULT_LOCKOUT) {
      pvPowerActualDC_W = 0.0;
      pvPowerActualAC_W = 0.0;
      batteryPower_W = 0.0;
      epsPortPower_W = 0.0;
      normalLoadsPower_W = 0.0;
      gridPortPower_W = 0.0;
      this.updateBatteryElectrochemicals(0, dt_s);
    }

    // 4. Calculate string shares
    const sRatio = pvTotalDC_W > 0 ? pvPowerActualDC_W / pvTotalDC_W : 0;
    const s1PowerDC = s1.powerDC_W * sRatio;
    const s2PowerDC = s2.powerDC_W * sRatio;

    // 5. Update functional internal safety relays (KSEP & KNE)
    const gridHealthy = (this.state === INVERTER_STATES.NORMAL_GRID) && !this.activeFaults.get(FAULT_KEYS.GRID_OUTAGE) && !this.activeFaults.get(FAULT_KEYS.GRID_BROWNOUT);
    if (gridHealthy) {
      this.relays.ksep.coil = true;
      this.relays.ksep.contact = true;
      this.relays.ksep.outputState = 'CLOSED';
      this.relays.ksep.inputCondition = 'Grid Qualified (230V 50Hz Sync OK)';
      this.relays.ksep.feedback = 'OK';
    } else {
      this.relays.ksep.coil = false;
      this.relays.ksep.contact = false;
      this.relays.ksep.outputState = 'OPEN';
      this.relays.ksep.inputCondition = 'Grid Lost / Anti-Islanding Trip (<20ms)';
      this.relays.ksep.feedback = 'OK';
    }

    const batCanSupply = this.batterySOC_pct > bat.recommendedMinSoc_pct && this.relays.bmsContactor && !this.activeFaults.get(FAULT_KEYS.BMS_FAULT);
    const islandSourcesAvailable = (pvPowerActualAC_W > 10.0) || batCanSupply;

    if (this.state === INVERTER_STATES.GRID_FAILURE_EPS && this.neutralTopology === NEUTRAL_TOPOLOGIES.INTERNAL_N_PE_RELAY && islandSourcesAvailable) {
      this.relays.kne.coil = true;
      this.relays.kne.contact = true;
      this.relays.kne.outputState = 'CLOSED';
      this.relays.kne.inputCondition = 'EPS Island Active (TN-S Local MEN Bond)';
      this.relays.kne.feedback = 'OK';
    } else {
      this.relays.kne.coil = false;
      this.relays.kne.contact = false;
      this.relays.kne.outputState = 'OPEN';
      this.relays.kne.inputCondition = this.sbyPosition === 'II' ? 'Bypass Mode (Upstream MEN Active)' : 'Grid-Tied Normal (Upstream MEN Active)';
      this.relays.kne.feedback = 'OK';
    }

    // 6. Active Alarms List
    const alarms = this._collectActiveAlarms();

    // 7. Build Clean Telemetry Object
    const isEpsDead = (this.state === INVERTER_STATES.FAULT_LOCKOUT) || (!this.relays.epsBreaker) || (this.state === INVERTER_STATES.GRID_FAILURE_EPS && !islandSourcesAvailable);
    this.telemetry = {
      timestamp: Date.now(),
      inverterState: this.state,
      subPhase: this.subPhase,
      flowFilter: this.flowFilter,
      // PV Telemetry
      pvPowerDC_W: Math.round(pvPowerActualDC_W * 10) / 10,
      pvVoltage_V: Math.round(((s1.Vmp_V + s2.Vmp_V) / 2) * 10) / 10,
      pvCurrent_A: Math.round((s1.Imp_A + s2.Imp_A) * 100) / 100,
      string1Power_W: Math.round(s1PowerDC * 10) / 10,
      string1Voltage_V: Math.round(s1.Vmp_V * 10) / 10,
      string1Current_A: Math.round(s1.Imp_A * 100) / 100,
      string2Power_W: Math.round(s2PowerDC * 10) / 10,
      string2Voltage_V: Math.round(s2.Vmp_V * 10) / 10,
      string2Current_A: Math.round(s2.Imp_A * 100) / 100,
      temperatureCell_C: Math.round(s1.tCell_C * 10) / 10,
      // Battery Telemetry
      batteryPower_W: Math.round(batteryPower_W * 10) / 10,
      batteryVoltage_V: Math.round(this.batteryVoltage_V * 100) / 100,
      batteryCurrent_A: Math.round(this.batteryCurrent_A * 100) / 100,
      batterySOC_pct: Math.round(this.batterySOC_pct * 10) / 10,
      // Grid & AC Port Telemetry
      gridPortPower_W: Math.round(gridPortPower_W * 10) / 10,
      gridVoltage_V: Math.round(gridVoltage_V * 10) / 10,
      gridFrequency_Hz: Math.round(gridFrequency_Hz * 100) / 100,
      epsPortPower_W: Math.round(epsPortPower_W * 10) / 10,
      epsVoltage_V: isEpsDead ? 0.0 : 230.0,
      epsCurrent_A: epsPortPower_W > 0 ? Math.round((epsPortPower_W / 230.0) * 100) / 100 : 0.0,
      criticalLoadsVoltage_V: (this.sbyPosition === 'I' && !isEpsDead) ? 230.0 :
                              (this.sbyPosition === 'II' && gridVoltage_V > 180 && this.relays.qbpBreaker) ? 230.0 : 0.0,
      normalLoadsPower_W: Math.round(normalLoadsPower_W * 10) / 10,
      criticalLoadsPower_W: Math.round(epsPortPower_W * 10) / 10,
      totalLoadsPower_W: Math.round((normalLoadsPower_W + epsPortPower_W) * 10) / 10,
      // Efficiencies & System
      inverterEfficiency_pct: inv.inverterEfficiency * 100.0,
      dcdcEfficiency_pct: inv.dcdcEfficiency * 100.0,
      qualificationRemaining_s: Math.max(0, Math.round(this.qualificationRemaining_s * 10) / 10),
      syncProgress_pct: Math.round(this.syncProgress_pct),
      // Equipment States
      relays: { ...this.relays },
      precharge: { ...this.precharge },
      comms: { ...this.comms },
      alarms: alarms,
      activeFlows: this._computeActiveFlows(pvPowerActualDC_W, batteryPower_W, gridPortPower_W, normalLoadsPower_W, epsPortPower_W),
      tutorial: { ...this._tutorial, stepInfo: this.getTutorialStepInfo(this._tutorial.currentStep) }
    };
  }

  // ==========================================================================
  // 7. ACTIVE FLOW COMPUTATION & FILTERING
  // ==========================================================================

  /**
   * Computes active power flows with respect to physical operation and active FlowFilter
   * @private
   */
  _computeActiveFlows(pvDC_W, bat_W, grid_W, norm_W, eps_W) {
    const filter = this.flowFilter;

    const baseFlows = {
      pvToInverter: pvDC_W > 10.0,
      inverterToBattery: bat_W > 10.0,
      batteryToInverter: bat_W < -10.0,
      inverterToNormalLoads: norm_W > 10.0 && this.state === INVERTER_STATES.NORMAL_GRID,
      inverterToEpsLoads: eps_W > 10.0,
      gridToInverter: grid_W > 10.0,
      inverterToGrid: grid_W < -10.0,
      neutralReturn: norm_W > 10.0 || eps_W > 10.0,
      peGrounding: this.relays.rcdTripped || this.activeFaults.get(FAULT_KEYS.RCD_TRIP),
      commsBus: this.comms.smartMeterOnline && this.comms.bmsOnline
    };

    if (filter === FLOW_FILTERS.ALL) {
      return baseFlows;
    }

    const filtered = {
      pvToInverter: false,
      inverterToBattery: false,
      batteryToInverter: false,
      inverterToNormalLoads: false,
      inverterToEpsLoads: false,
      gridToInverter: false,
      inverterToGrid: false,
      neutralReturn: false,
      peGrounding: false,
      commsBus: false
    };

    switch (filter) {
      case FLOW_FILTERS.PV_ONLY:
        filtered.pvToInverter = baseFlows.pvToInverter;
        break;
      case FLOW_FILTERS.BATTERY_ONLY:
        filtered.inverterToBattery = baseFlows.inverterToBattery;
        filtered.batteryToInverter = baseFlows.batteryToInverter;
        break;
      case FLOW_FILTERS.GRID_ONLY:
        filtered.gridToInverter = baseFlows.gridToInverter;
        filtered.inverterToGrid = baseFlows.inverterToGrid;
        break;
      case FLOW_FILTERS.EPS_ONLY:
        filtered.inverterToEpsLoads = baseFlows.inverterToEpsLoads;
        break;
      case FLOW_FILTERS.NEUTRAL_ONLY:
        filtered.neutralReturn = baseFlows.neutralReturn;
        break;
      case FLOW_FILTERS.PE_ONLY:
        filtered.peGrounding = true;
        break;
      case FLOW_FILTERS.COMMS_ONLY:
        filtered.commsBus = true;
        break;
    }

    return filtered;
  }

  /**
   * Sets current visual flow filter
   * @param {string} filterMode - One of FLOW_FILTERS
   */
  setFlowFilter(filterMode) {
    if (Object.values(FLOW_FILTERS).includes(filterMode)) {
      this.flowFilter = filterMode;
      this.emit('flowFilterChanged', { filter: filterMode });
      this.updatePhysics(0);
    }
  }

  // ==========================================================================
  // 8. PEDAGOGICAL TRANSITION SEQUENCERS
  // ==========================================================================

  /**
   * Initiates the pedagogical Grid Outage sequence with sub-phases:
   * 1. GRID_LOSS_DETECTED (0ms)
   * 2. ANTI_ISLANDING_DETECT (<10ms)
   * 3. RELAYS_OPEN (18ms)
   * 4. ISLAND_STABLE (<20ms)
   */
  triggerGridFailureSequence() {
    if (this._sequencerTimer) clearTimeout(this._sequencerTimer);

    this.activeFaults.set(FAULT_KEYS.GRID_FAILURE, true);
    this.subPhase = SUB_PHASES.GRID_LOSS_DETECTED;
    this.emit('subPhaseChanged', {
      subPhase: this.subPhase,
      elapsed_ms: 0,
      description: 'Mains grid voltage drop detected on AC terminal'
    });

    // Step 2: Anti-islanding detection algorithm (<10ms)
    this._sequencerTimer = setTimeout(() => {
      this.subPhase = SUB_PHASES.ANTI_ISLANDING_DETECT;
      this.emit('subPhaseChanged', {
        subPhase: this.subPhase,
        elapsed_ms: 8,
        description: 'Passive/Active anti-islanding frequency drift confirmed'
      });

      // Step 3: Main grid contactor mechanically opens (18ms)
      this._sequencerTimer = setTimeout(() => {
        this.subPhase = SUB_PHASES.RELAYS_OPEN;
        this.relays.gridContactor = false;
        this.emit('relayTrip', { relay: 'gridContactor', state: false });
        this.emit('subPhaseChanged', {
          subPhase: this.subPhase,
          elapsed_ms: 18,
          description: 'Grid contactor mechanically open: non-critical loads shed'
        });

        // Step 4: Island stable (<20ms)
        this._sequencerTimer = setTimeout(() => {
          this.state = INVERTER_STATES.GRID_FAILURE_EPS;
          this.subPhase = SUB_PHASES.ISLAND_STABLE;
          this.emit('stateChanged', { state: this.state });
          this.emit('subPhaseChanged', {
            subPhase: this.subPhase,
            elapsed_ms: 20,
            description: 'Inverter switched to grid-forming voltage source; EPS bus stable'
          });
          this.updatePhysics(0);
        }, 150); // Animated delay for pedagogical clarity
      }, 200);
    }, 200);
  }

  /**
   * Initiates the pedagogical Grid Restoration sequence with sub-phases:
   * 1. VOLTAGE_RETURN
   * 2. QUALIFICATION_TIMER (counting down)
   * 3. PHASE_SYNCHRONIZATION (matching phase angle)
   * 4. GRID_RECONNECTED
   */
  triggerGridRestorationSequence() {
    if (this._sequencerTimer) clearTimeout(this._sequencerTimer);

    this.activeFaults.set(FAULT_KEYS.GRID_FAILURE, false);
    this.subPhase = SUB_PHASES.VOLTAGE_RETURN;
    this.qualificationRemaining_s = this.qualificationDuration_s;
    this.syncProgress_pct = 0.0;

    this.emit('subPhaseChanged', {
      subPhase: this.subPhase,
      description: 'Grid AC voltage and frequency restored within standard envelope'
    });

    // Step 2: Qualification Timer countdown
    const qualInterval = setInterval(() => {
      this.subPhase = SUB_PHASES.QUALIFICATION_TIMER;
      this.qualificationRemaining_s -= 0.5;

      this.emit('subPhaseChanged', {
        subPhase: this.subPhase,
        remaining_s: Math.max(0, this.qualificationRemaining_s),
        description: `IEC 62116 qualification observation: ${Math.max(0, this.qualificationRemaining_s).toFixed(1)}s remaining`
      });

      if (this.qualificationRemaining_s <= 0) {
        clearInterval(qualInterval);
        this._startPhaseSynchronization();
      }
      this.updatePhysics(0);
    }, 500);
  }

  /**
   * Internal phase angle synchronization loop before reconnecting
   * @private
   */
  _startPhaseSynchronization() {
    this.subPhase = SUB_PHASES.PHASE_SYNCHRONIZATION;
    let progress = 0;

    const syncInterval = setInterval(() => {
      progress += 20;
      this.syncProgress_pct = Math.min(100, progress);

      this.emit('subPhaseChanged', {
        subPhase: this.subPhase,
        syncProgress_pct: this.syncProgress_pct,
        description: `Inverter PLL synchronizing phase angle with grid: ${this.syncProgress_pct}%`
      });

      if (this.syncProgress_pct >= 100) {
        clearInterval(syncInterval);
        // Step 4: Reconnected
        this.relays.gridContactor = true;
        this.state = INVERTER_STATES.NORMAL_GRID;
        this.subPhase = SUB_PHASES.GRID_RECONNECTED;
        this.emit('relayTrip', { relay: 'gridContactor', state: true });
        this.emit('stateChanged', { state: this.state });
        this.emit('subPhaseChanged', {
          subPhase: this.subPhase,
          description: 'Grid contactor closed seamlessly; hybrid self-consumption restored'
        });

        setTimeout(() => {
          this.subPhase = SUB_PHASES.GRID_TIED_STEADY;
          this.updatePhysics(0);
        }, 1000);
      }
      this.updatePhysics(0);
    }, 200);
  }

  // ==========================================================================
  // 9. FAULT SCENARIOS MANAGEMENT
  // ==========================================================================

  /**
   * Activates or clears a specific fault scenario
   * @param {string} faultKey - One of FAULT_KEYS
   * @param {boolean} active - True to trip/activate, false to clear
   */
  /**
   * Trigger a fault (convenience method)
   * @param {string} faultKey - Fault key
   */
  triggerFault(faultKey) {
    this.setFault(faultKey, true);
  }

  /**
   * Trip or clear a specific fault scenario
   * @param {string} faultKey - One of FAULT_KEYS
   * @param {boolean} active - True to trip/activate, false to clear
   */
  setFault(faultKey, active) {
    if (!this.activeFaults.has(faultKey)) return;

    this.activeFaults.set(faultKey, active);
    this.emit('faultToggled', { fault: faultKey, active: active });

    switch (faultKey) {
      case FAULT_KEYS.GRID_FAILURE:
      case FAULT_KEYS.GRID_OUTAGE:
      case FAULT_KEYS.GRID_BREAKER_OPEN:
        if (active) {
          this.activeFaults.set(FAULT_KEYS.GRID_FAILURE, true);
          this.activeFaults.set(FAULT_KEYS.GRID_OUTAGE, true);
          this.state = INVERTER_STATES.GRID_FAILURE_EPS;
          this.relays.gridContactor = false;
          this.subPhase = SUB_PHASES.ISLAND_STABLE;
          this.triggerGridFailureSequence();
        } else {
          this.activeFaults.set(FAULT_KEYS.GRID_FAILURE, false);
          this.activeFaults.set(FAULT_KEYS.GRID_OUTAGE, false);
          this.triggerGridRestorationSequence();
        }
        break;

      case FAULT_KEYS.BATTERY_LOW:
        if (active) {
          this.batterySOC_pct = Math.min(this.batterySOC_pct, 10.0);
        }
        break;

      case FAULT_KEYS.BMS_FAULT:
        this.relays.bmsContactor = !active;
        this.comms.bmsOnline = !active;
        if (active) this.emit('relayTrip', { relay: 'bmsContactor', state: false });
        break;

      case FAULT_KEYS.DC_ISOLATOR_OPEN:
        this.relays.dcIsolator = !active;
        this.emit('relayTrip', { relay: 'dcIsolator', state: !active });
        break;

      case FAULT_KEYS.RCD_TRIP:
        this.relays.rcdTripped = active;
        if (active) this.emit('breakerTrip', { device: 'RCD' });
        break;

      case FAULT_KEYS.EPS_OVERLOAD:
        if (active) {
          this.criticalLoads_W = 6200.0; // Exceeds peak 6kVA
          this.relays.epsBreaker = false;
          this.emit('breakerTrip', { device: 'EPS_BREAKER' });
        } else {
          this.criticalLoads_W = 1200.0;
          this.relays.epsBreaker = true;
        }
        break;

      case FAULT_KEYS.CT_COMM_FAILURE:
        this.comms.smartMeterOnline = !active;
        break;

      case FAULT_KEYS.PV_UNAVAILABLE:
        // Handled in dispatch solver
        break;
    }

    this.updatePhysics(0);
  }

  /**
   * Toggle a fault
   * @param {string} faultKey - Fault key
   */
  toggleFault(faultKey) {
    const cur = this.activeFaults.get(faultKey) || false;
    this.setFault(faultKey, !cur);
  }

  /**
   * Resets all faults and restores healthy operating state
   */
  resetAllFaults() {
    for (const key of this.activeFaults.keys()) {
      this.activeFaults.set(key, false);
    }
    this.relays.gridContactor = true;
    this.relays.epsRelay = true;
    this.relays.nPeBondRelay = false;
    this.relays.bmsContactor = true;
    this.relays.dcIsolator = true;
    this.relays.gridBreaker = true;
    this.relays.epsBreaker = true;
    this.relays.rcdTripped = false;
    this.criticalLoads_W = 1200.0;
    this.normalLoads_W = 1800.0;
    this.batterySOC_pct = 75.0;
    this.state = INVERTER_STATES.NORMAL_GRID;
    this.subPhase = SUB_PHASES.GRID_TIED_STEADY;
    this.comms.smartMeterOnline = true;
    this.comms.bmsOnline = true;

    this.emit('allFaultsReset');
    this.updatePhysics(0);
  }

  /**
   * Collects active alarms list
   * @private
   */
  _collectActiveAlarms() {
    const alarms = [];

    if (this.activeFaults.get(FAULT_KEYS.GRID_FAILURE)) {
      alarms.push({ id: 'ALM_01', type: 'GRID_LOSS', severity: 'CRITICAL', message: 'Main AC Utility Grid Outage Detected' });
    }
    if (this.activeFaults.get(FAULT_KEYS.BATTERY_LOW) || this.batterySOC_pct <= 10.0) {
      alarms.push({ id: 'ALM_02', type: 'BAT_LOW', severity: 'WARNING', message: 'Battery SOC <= 10% - Discharging Inhibit' });
    }
    if (this.activeFaults.get(FAULT_KEYS.BMS_FAULT)) {
      alarms.push({ id: 'ALM_03', type: 'BMS_TRIP', severity: 'CRITICAL', message: 'Battery Management System Contactor Opened' });
    }
    if (this.activeFaults.get(FAULT_KEYS.EPS_OVERLOAD)) {
      alarms.push({ id: 'ALM_04', type: 'EPS_OVERLOAD', severity: 'CRITICAL', message: 'EPS Backup Overload (>5000W continuous / 6000VA surge)' });
    }
    if (this.activeFaults.get(FAULT_KEYS.RCD_TRIP) || this.relays.rcdTripped) {
      alarms.push({ id: 'ALM_05', type: 'RCD_FAULT', severity: 'CRITICAL', message: 'Earth Leakage RCD Tripped (>30mA residual current)' });
    }
    if (this.activeFaults.get(FAULT_KEYS.CT_COMM_FAILURE)) {
      alarms.push({ id: 'ALM_06', type: 'COMMS_LOSS', severity: 'WARNING', message: 'Smart Meter RS485 Communication Lost - Failsafe Zero-Export Active' });
    }
    if (this.activeFaults.get(FAULT_KEYS.DC_ISOLATOR_OPEN)) {
      alarms.push({ id: 'ALM_07', type: 'DC_OPEN', severity: 'INFO', message: 'DC Rotary Isolator Open - PV Arrays Disconnected' });
    }

    return alarms;
  }

  // ==========================================================================
  // 10. 10-STEP GUIDED TUTORIAL MANAGER
  // ==========================================================================

  startTutorial() {
    this._tutorial.active = true;
    this.goToTutorialStep(1);
  }

  stopTutorial() {
    this._tutorial.active = false;
    this.resetAllFaults();
    this.setFlowFilter(FLOW_FILTERS.ALL);
    this.emit('tutorialEnded');
    this.updatePhysics(0);
  }

  goToTutorialStep(stepNumber) {
    const step = Math.min(10, Math.max(1, stepNumber));
    this._tutorial.currentStep = step;
    this._tutorial.active = true;

    // Apply pedagogical setup for each step
    switch (step) {
      case 1: // System Overview
        this.resetAllFaults();
        this.setFlowFilter(FLOW_FILTERS.ALL);
        this.irradianceS1_W_m2 = 1000;
        this.irradianceS2_W_m2 = 1000;
        this.batterySOC_pct = 65;
        this.normalLoads_W = 1800;
        this.criticalLoads_W = 1200;
        break;
      case 2: // Daylight Self-Consumption
        this.resetAllFaults();
        this.setFlowFilter(FLOW_FILTERS.PV_ONLY);
        this.irradianceS1_W_m2 = 900;
        this.irradianceS2_W_m2 = 900;
        this.batterySOC_pct = 40;
        this.normalLoads_W = 1500;
        this.criticalLoads_W = 800;
        break;
      case 3: // Surplus & Grid Export
        this.resetAllFaults();
        this.setFlowFilter(FLOW_FILTERS.GRID_ONLY);
        this.zeroExportEnabled = false;
        this.irradianceS1_W_m2 = 1000;
        this.irradianceS2_W_m2 = 1000;
        this.batterySOC_pct = 100;
        this.normalLoads_W = 1000;
        this.criticalLoads_W = 500;
        break;
      case 4: // Evening Deficit & Battery Discharge
        this.resetAllFaults();
        this.setFlowFilter(FLOW_FILTERS.BATTERY_ONLY);
        this.irradianceS1_W_m2 = 0;
        this.irradianceS2_W_m2 = 0;
        this.batterySOC_pct = 85;
        this.normalLoads_W = 2000;
        this.criticalLoads_W = 1200;
        break;
      case 5: // Blackout & Anti-Islanding Protection
        this.resetAllFaults();
        this.setFlowFilter(FLOW_FILTERS.GRID_ONLY);
        this.setFault(FAULT_KEYS.GRID_FAILURE, true);
        break;
      case 6: // Backup Islanding (EPS) Mode
        this.setFlowFilter(FLOW_FILTERS.EPS_ONLY);
        this.state = INVERTER_STATES.GRID_FAILURE_EPS;
        this.subPhase = SUB_PHASES.ISLAND_STABLE;
        this.relays.gridContactor = false;
        this.criticalLoads_W = 1500;
        break;
      case 7: // Grid Restoration & Sync
        this.setFlowFilter(FLOW_FILTERS.GRID_ONLY);
        this.triggerGridRestorationSequence();
        break;
      case 8: // Earth Fault & RCD Protection
        this.resetAllFaults();
        this.setFlowFilter(FLOW_FILTERS.PE_ONLY);
        this.setFault(FAULT_KEYS.RCD_TRIP, true);
        break;
      case 9: // Neutral Topologies & MEN Bonding
        this.resetAllFaults();
        this.setFlowFilter(FLOW_FILTERS.NEUTRAL_ONLY);
        this.setNeutralTopology(NEUTRAL_TOPOLOGIES.INTERNAL_N_PE_RELAY);
        break;
      case 10: // PV & Battery Engineering Calculators
        this.resetAllFaults();
        this.setFlowFilter(FLOW_FILTERS.ALL);
        break;
    }

    this.emit('tutorialStepChanged', {
      step: step,
      info: this.getTutorialStepInfo(step)
    });

    this.updatePhysics(0);
  }

  tutorialNext() {
    if (this._tutorial.currentStep < 10) {
      this.goToTutorialStep(this._tutorial.currentStep + 1);
    }
  }

  tutorialPrev() {
    if (this._tutorial.currentStep > 1) {
      this.goToTutorialStep(this._tutorial.currentStep - 1);
    }
  }

  getCurrentTutorialStep() {
    return {
      stepNumber: this._tutorial.currentStep,
      active: this._tutorial.active,
      info: this.getTutorialStepInfo(this._tutorial.currentStep)
    };
  }

  /**
   * Returns rich educational descriptions for the tutorial step
   * @param {number} step - Step index 1..10
   */
  getTutorialStepInfo(step) {
    const steps = {
      1: {
        title: 'Introduction & System Architecture',
        subtitle: '5kW Hybrid Single-Phase Solar PV Topology',
        filter: FLOW_FILTERS.ALL,
        content: 'Welcome to the 5kW Hybrid PV Simulator. This system integrates two 2.7kW PV strings (12x 450W Mono PERC modules), a 5.12kWh 16S LiFePO4 battery storage pack, a bi-directional hybrid inverter with dedicated EPS backup port, and grid integration with smart meter CT sensing.',
        keyTakeaway: 'The hybrid inverter combines a DC-DC MPPT solar charger, bi-directional battery charger, and grid-forming/following inverter into a single high-efficiency unit.'
      },
      2: {
        title: 'Daylight Self-Consumption',
        subtitle: 'PV -> Loads -> Battery Storage Priority',
        filter: FLOW_FILTERS.PV_ONLY,
        content: 'During daylight hours, solar PV generation directly satisfies both critical and normal household loads without converting through the battery first, achieving 97% AC conversion efficiency. Excess PV generation is directed to the battery pack at up to 100A (5kW).',
        keyTakeaway: 'Direct self-consumption minimizes round-trip conversion losses compared to cycling all solar energy through the battery.'
      },
      3: {
        title: 'Battery Saturation & Grid Export',
        subtitle: 'Feeding Clean Solar Power into the Grid',
        filter: FLOW_FILTERS.GRID_ONLY,
        content: 'When the battery reaches 100% SOC (absorption at 57.6V), the inverter exports surplus green energy to the main electrical grid. If zero-export is configured or CT communication fails, the inverter automatically curtails PV generation by moving off the MPPT curve.',
        keyTakeaway: 'Smart meter CT monitoring provides instantaneous bidirectional power sensing for regulatory export compliance.'
      },
      4: {
        title: 'Evening Deficit & Battery Discharge',
        subtitle: 'Discharging Stored Green Energy at Sunset',
        filter: FLOW_FILTERS.BATTERY_ONLY,
        content: 'When solar generation drops to 0W at night, the 16S LiFePO4 battery pack discharges through the bi-directional DC-DC converter and inverter to support household loads down to the 10% SOC reserve floor.',
        keyTakeaway: 'The flat voltage plateau of LiFePO4 (52.5V nominal) ensures consistent voltage delivery across 80% of its discharge cycle.'
      },
      5: {
        title: 'Grid Blackout & Anti-Islanding Trip',
        subtitle: 'Galvanic Separation in <20ms to Protect Lineworkers',
        filter: FLOW_FILTERS.GRID_ONLY,
        content: 'Upon grid failure, the inverter must execute IEC 62116 anti-islanding within <20ms to prevent feeding power into disabled utility lines. The internal grid contactor drops open, shedding heavy non-critical loads.',
        keyTakeaway: 'Anti-islanding isolation prevents hazardous backfeeding that could electrocute utility technicians repairing grid faults.'
      },
      6: {
        title: 'Backup Islanding (EPS) Operation',
        subtitle: 'Grid-Forming 230V Reference for Critical Circuits',
        filter: FLOW_FILTERS.EPS_ONLY,
        content: 'In islanded EPS mode, the inverter switches from grid-following (current source) to grid-forming (voltage source). It synthesizes a pure 230V 50Hz sine wave to power refrigeration, medical devices, lighting, and communications indefinitely using PV and battery.',
        keyTakeaway: 'Non-critical loads are completely isolated to prevent draining the battery during prolonged grid outages.'
      },
      7: {
        title: 'Grid Restoration & Synchronization',
        subtitle: 'Voltage Qualification and Seamless Phase-Lock',
        filter: FLOW_FILTERS.GRID_ONLY,
        content: 'When grid power returns, standards require an observation period (qualification timer) before reconnecting. The inverter PLL slowly aligns its output AC waveform phase angle with the grid before closing the contactor.',
        keyTakeaway: 'Phase synchronization eliminates massive current surges that would occur if contactors closed with 180° phase opposition.'
      },
      8: {
        title: 'Earth Leakage & RCD Protection',
        subtitle: 'Core Balance CT Sensing for Human Safety',
        filter: FLOW_FILTERS.PE_ONLY,
        content: 'Residual Current Devices (RCDs) protect human life by sensing current imbalance between Live and Neutral. If earth leakage exceeds 30mA, the RCD trips in <40ms. Smooth DC leakage from solar can blind standard Type A RCDs.',
        keyTakeaway: 'Type B RCDs or Type A with RDC-MD are mandatory when solar equipment can generate smooth DC leakage currents exceeding 6mA.'
      },
      9: {
        title: 'Neutral & Earthing Topologies',
        subtitle: 'Internal N-PE Bonding Relay vs Common Neutral',
        filter: FLOW_FILTERS.NEUTRAL_ONLY,
        content: 'During grid outages, the grid MEN bond is disconnected. An internal automatic N-PE relay engages in the inverter to establish an earth reference on the EPS port, ensuring downstream RCDs continue to function during islanding.',
        keyTakeaway: 'Without an EPS earth-neutral reference, an earth fault would leave metal enclosures live without triggering circuit breakers.'
      },
      10: {
        title: 'PV Array & Battery Engineering Validation',
        subtitle: 'Temperature Extreme Sizing & Short Circuit Calculations',
        filter: FLOW_FILTERS.ALL,
        content: 'Explore the 5 integrated engineering calculators to verify open-circuit voltage at -10°C, maximum MPPT tracking at +65°C summer roof temperatures, DC cable ampacity, and prospective short-circuit breaking capacity.',
        keyTakeaway: 'Rigorous engineering design prevents inverter overvoltage destruction and fire hazards under extreme climatic conditions.'
      }
    };

    return steps[step] || steps[1];
  }

  // ==========================================================================
  // 11. 5 ELECTRICAL ENGINEERING CALCULATORS
  // ==========================================================================

  /**
   * Calculator 1: PV String Sizing & Extreme Temperature Voltage Calculator
   * Verifies coldest winter Voc against Inverter Vmax (550V) and hottest summer Vmp against MPPT min (120V)
   * Recommends DC Surge Protection Device (SPD) rating Ucpv >= 1.1 * Voc_cold
   * 
   * @param {Object} params
   * @param {number} [params.numPanels=6] - Number of panels in series
   * @param {number} [params.voc_stc=49.5] - Voc at STC (V)
   * @param {number} [params.vmp_stc=41.5] - Vmp at STC (V)
   * @param {number} [params.tempCoeffVoc=-0.27] - Temperature coefficient of Voc (%/°C)
   * @param {number} [params.tempCoeffVmp=-0.35] - Temperature coefficient of Vmp (%/°C)
   * @param {number} [params.tMin=-10.0] - Coldest design winter temperature (°C)
   * @param {number} [params.tMax=65.0] - Hottest design summer roof temperature (°C)
   * @param {number} [params.inverterVmax=550.0] - Inverter absolute maximum DC voltage (V)
   * @param {number} [params.mpptMin=120.0] - MPPT minimum operating voltage (V)
   * @param {number} [params.mpptMax=500.0] - MPPT maximum operating voltage (V)
   * @returns {Object} Comprehensive calculation report
   */
  calculateStringVoltage(params = {}) {
    const N = params.numPanels ?? SYSTEM_SPECS.pvModule.panelsPerString;
    const Voc_stc = params.voc_stc ?? SYSTEM_SPECS.pvModule.voc_V;
    const Vmp_stc = params.vmp_stc ?? SYSTEM_SPECS.pvModule.vmp_V;
    const betaVoc = params.tempCoeffVoc ?? SYSTEM_SPECS.pvModule.tempCoeffVoc_pct;
    const gammaVmp = params.tempCoeffVmp ?? SYSTEM_SPECS.pvModule.tempCoeffVmp_pct;
    const Tmin = params.tMin ?? -10.0;
    const Tmax = params.tMax ?? 65.0;
    const Vmax_inv = params.inverterVmax ?? SYSTEM_SPECS.inverter.maxDcVoltage_V;
    const Vmppt_min = params.mpptMin ?? SYSTEM_SPECS.inverter.mpptVoltageMin_V;
    const Vmppt_max = params.mpptMax ?? SYSTEM_SPECS.inverter.mpptVoltageMax_V;

    // 1. Coldest Winter Voc: Voc_cold = N * Voc_stc * [1 + (betaVoc / 100) * (Tmin - 25)]
    const deltaT_cold = Tmin - 25.0;
    const panelVoc_cold = Voc_stc * (1.0 + (betaVoc / 100.0) * deltaT_cold);
    const stringVoc_cold = N * panelVoc_cold;

    // 2. Hottest Summer Vmp: Vmp_hot = N * Vmp_stc * [1 + (gammaVmp / 100) * (Tmax - 25)]
    const deltaT_hot = Tmax - 25.0;
    const panelVmp_hot = Vmp_stc * (1.0 + (gammaVmp / 100.0) * deltaT_hot);
    const stringVmp_hot = N * panelVmp_hot;

    // 3. Margin Checks
    const maxVoltageMargin_V = Vmax_inv - stringVoc_cold;
    const isVocSafe = stringVoc_cold < Vmax_inv;
    const isMpptMinSafe = stringVmp_hot > Vmppt_min;
    const isMpptMaxSafe = stringVoc_cold <= Vmppt_max;

    // 4. SPD Recommendation per IEC 61643-31 / IEC 60364-7-712: Ucpv >= 1.1 * Voc_cold
    const minSpdUcpv_V = Math.ceil(stringVoc_cold * 1.1);
    let recommendedSpdRating_V = 600;
    if (minSpdUcpv_V > 600) recommendedSpdRating_V = 1000;

    return {
      numPanels: N,
      temperatures: { tMin_C: Tmin, tMax_C: Tmax, tSTC_C: 25.0 },
      coldestWinterVoc: {
        stringVoc_cold_V: Math.round(stringVoc_cold * 10) / 10,
        panelVoc_cold_V: Math.round(panelVoc_cold * 10) / 10,
        inverterLimit_V: Vmax_inv,
        safetyMargin_V: Math.round(maxVoltageMargin_V * 10) / 10,
        isSafe: isVocSafe,
        verdict: isVocSafe
          ? `PASSED: Coldest Voc (${stringVoc_cold.toFixed(1)}V) is safely below Inverter Vmax (${Vmax_inv}V) with ${maxVoltageMargin_V.toFixed(1)}V headroom.`
          : `FAILED: Coldest Voc (${stringVoc_cold.toFixed(1)}V) exceeds Inverter Vmax (${Vmax_inv}V)! Catastrophic overvoltage hazard.`
      },
      hottestSummerVmp: {
        stringVmp_hot_V: Math.round(stringVmp_hot * 10) / 10,
        panelVmp_hot_V: Math.round(panelVmp_hot * 10) / 10,
        mpptMin_V: Vmppt_min,
        mpptMax_V: Vmppt_max,
        isInMpptRange: isMpptMinSafe && isMpptMaxSafe,
        verdict: isMpptMinSafe
          ? `PASSED: Hottest Vmp (${stringVmp_hot.toFixed(1)}V) is comfortably above MPPT minimum voltage (${Vmppt_min}V).`
          : `WARNING: Hottest Vmp (${stringVmp_hot.toFixed(1)}V) falls below MPPT minimum (${Vmppt_min}V); array will experience MPPT clipping/drop-out.`
      },
      spdRecommendation: {
        minUcpv_V: minSpdUcpv_V,
        standardRating_V: recommendedSpdRating_V,
        type: 'Type II DC SPD (Metal Oxide Varistor + Gas Discharge Tube)',
        standard: 'IEC 61643-31 / IEC 60364-7-712'
      }
    };
  }

  /**
   * Calculator 2: Battery Cable Sizing, Continuous/Surge Current & OCPD Calculator
   * Determines worst-case discharge current at cutoff voltage (44V), surge current at 6kVA,
   * copper cable size, and minimum breaking capacity (kA) for LiFePO4 short-circuit.
   * 
   * @param {Object} params
   * @param {number} [params.power_W=5000.0] - Rated continuous inverter power
   * @param {number} [params.peakPower_W=6000.0] - Peak EPS surge power
   * @param {number} [params.vNominal=51.2] - Battery nominal voltage
   * @param {number} [params.vCutoff=44.0] - Battery discharge cut-off voltage
   * @param {number} [params.efficiency=0.95] - DC-DC conversion efficiency
   * @param {number} [params.cableLength_m=3.0] - One-way cable run length in meters
   * @returns {Object} Cable sizing and safety report
   */
  calculateBatteryCurrent(params = {}) {
    const P_cont = params.power_W ?? SYSTEM_SPECS.inverter.ratedAcPower_W;
    const P_peak = params.peakPower_W ?? SYSTEM_SPECS.inverter.peakEpsPower_VA;
    const V_nom = params.vNominal ?? SYSTEM_SPECS.battery.nominalVoltage_V;
    const V_cutoff = params.vCutoff ?? SYSTEM_SPECS.battery.cutoffVoltage_V;
    const eta = params.efficiency ?? (SYSTEM_SPECS.inverter.dcdcEfficiency * SYSTEM_SPECS.inverter.inverterEfficiency);
    const length_m = params.cableLength_m ?? 3.0;

    // Continuous current at nominal voltage
    const iContNominal_A = P_cont / (V_nom * eta);
    // Worst-case continuous current at cutoff voltage: I = P / (V_cutoff * eta)
    const iContCutoff_A = P_cont / (V_cutoff * eta);
    // Peak surge current at cutoff voltage: I_peak = P_peak / (V_cutoff * eta)
    const iPeak_A = P_peak / (V_cutoff * eta);

    // Recommended OCPD (fuse / breaker) size: 1.25x continuous current
    const minOcpdRating_A = Math.ceil(iContCutoff_A * 1.25);
    let standardOcpd_A = 125;
    if (minOcpdRating_A > 125) standardOcpd_A = 160;
    if (minOcpdRating_A > 160) standardOcpd_A = 200;

    // LiFePO4 Prospective Short Circuit Current: Isc_bat = Vbulk / Rint (approximate)
    const Rint = SYSTEM_SPECS.battery.internalResistance_Ohm;
    const prospectiveIsc_kA = (SYSTEM_SPECS.battery.bulkVoltage_V / Rint) / 1000.0;
    const minBreakingCapacity_kA = prospectiveIsc_kA > 5.0 ? 10.0 : 6.0;

    // Cable cross-section selection & voltage drop
    // Copper resistivity: rho = 0.0175 Ohm * mm² / m
    const rho = 0.0175;
    let recCableMm2 = 25;
    if (iContCutoff_A > 100) recCableMm2 = 35;
    if (iContCutoff_A > 130) recCableMm2 = 50;

    const roundTripLength_m = 2 * length_m;
    const cableResistance_Ohm = (rho * roundTripLength_m) / recCableMm2;
    const vDrop_V = iContCutoff_A * cableResistance_Ohm;
    const vDrop_pct = (vDrop_V / V_cutoff) * 100.0;

    return {
      currents: {
        nominalContinuous_A: Math.round(iContNominal_A * 10) / 10,
        worstCaseCutoff_A: Math.round(iContCutoff_A * 10) / 10,
        peakSurge_A: Math.round(iPeak_A * 10) / 10
      },
      cableRecommendation: {
        crossSection_mm2: recCableMm2,
        conductorMaterial: 'Flexible Class 5/6 Tinned Copper',
        insulation: 'Double Insulated Halogen-Free XLPE (0.6/1kV)',
        voltageDrop_V: Math.round(vDrop_V * 100) / 100,
        voltageDrop_pct: Math.round(vDrop_pct * 100) / 100,
        verdict: vDrop_pct <= 2.0
          ? `PASSED: Voltage drop (${vDrop_pct.toFixed(2)}%) is below standard 2.0% limit for DC battery conductors.`
          : `WARNING: Voltage drop (${vDrop_pct.toFixed(2)}%) exceeds 2.0%; upgrade to next cable size.`
      },
      ocpdProtection: {
        calculatedMinimum_A: minOcpdRating_A,
        standardRating_A: standardOcpd_A,
        type: 'DC-rated NH00 gG/aR Fuse or Polarised DC MCB/MCCB',
        prospectiveShortCircuit_kA: Math.round(prospectiveIsc_kA * 10) / 10,
        minimumBreakingCapacity_kA: minBreakingCapacity_kA,
        standard: 'AS/NZS 5139 / IEC 62619 / BS 7671 Section 712'
      }
    };
  }

  /**
   * Calculator 3: RCD Simulation & DC Blindness Detection
   * Evaluates Residual Current Device (RCD) tripping time, residual vector sum,
   * and warns of DC saturation blindness (>6mA DC on Type A or Type AC RCDs)
   * 
   * @param {Object} params
   * @param {number} [params.iLeakageAC=18.0] - AC earth leakage current in mA
   * @param {number} [params.iLeakageDC=4.0] - Smooth DC earth leakage current in mA
   * @param {string} [params.rcdType='Type A'] - 'Type AC', 'Type A', 'Type B', 'Type F'
   * @param {number} [params.iTripThreshold_mA=30.0] - RCD rated sensitivity (default 30mA)
   * @returns {Object} RCD tripping dynamics and saturation report
   */
  simulateRCD(params = {}) {
    const iAC = params.iLeakageAC ?? 18.0;
    const iDC = params.iLeakageDC ?? 4.0;
    const rcdType = params.rcdType ?? 'Type A';
    const threshold = params.iTripThreshold_mA ?? 30.0;

    // Vector residual current: I_residual = sqrt(iAC^2 + iDC^2)
    const iResidualTotal = Math.sqrt(iAC * iAC + iDC * iDC);

    // DC Saturation Blindness check per IEC 60364-7-712 / IEC 62955:
    // If DC leakage > 6mA, toroidal core of standard Type AC and standard Type A saturates
    const isBlinded = (rcdType === 'Type AC' || rcdType === 'Type A') && (iDC >= 6.0);

    let willTrip = false;
    let tripTime_ms = null;
    let statusMessage = '';

    if (isBlinded) {
      willTrip = false;
      statusMessage = `CRITICAL DANGER: RCD is BLINDED by ${iDC.toFixed(1)}mA smooth DC leakage! Magnetic core saturated; RCD CANNOT TRIP on AC earth fault. Type B or Type A with RDC-DD required!`;
    } else {
      let detectableLeakage = 0.0;
      if (rcdType === 'Type AC') detectableLeakage = iAC;
      else if (rcdType === 'Type A') detectableLeakage = Math.sqrt(iAC * iAC + (iDC < 6.0 ? (iDC * 0.5) * (iDC * 0.5) : 0));
      else if (rcdType === 'Type B') detectableLeakage = iResidualTotal; // Type B detects pure DC + high freq + AC

      if (detectableLeakage >= threshold) {
        willTrip = true;
        // IEC 61008 trip curve approximation:
        // at 1x I_delta_n: <= 300ms
        // at 2x I_delta_n: <= 150ms
        // at 5x I_delta_n: <= 40ms
        const multiple = detectableLeakage / threshold;
        if (multiple >= 5.0) tripTime_ms = 25;
        else if (multiple >= 2.0) tripTime_ms = 85;
        else tripTime_ms = 220;

        statusMessage = `TRIP: Residual leakage (${detectableLeakage.toFixed(1)}mA) exceeds 30mA threshold. RCD trips in ~${tripTime_ms}ms to protect human life.`;
      } else {
        willTrip = false;
        statusMessage = `HEALTHY: Residual leakage (${detectableLeakage.toFixed(1)}mA) is below the 30mA tripping threshold (no nuisance trip).`;
      }
    }

    return {
      inputs: { iLeakageAC_mA: iAC, iLeakageDC_mA: iDC, rcdType, threshold_mA: threshold },
      totalVectorResidual_mA: Math.round(iResidualTotal * 10) / 10,
      isCoreSaturated: isBlinded,
      willTrip: willTrip,
      tripTime_ms: tripTime_ms,
      statusMessage: statusMessage,
      standardsRecommendation: (rcdType !== 'Type B' && iDC >= 6.0)
        ? 'Per IEC 60364-7-712:2017 clause 712.530.3.101, an inverter without galvanic isolation that can generate DC residual current > 6mA requires a Type B RCD or an RDC-MD (Residual Direct Current Monitoring Device).'
        : 'RCD configuration complies with standard residential residual current guidelines.'
    };
  }

  /**
   * Calculator 4: Neutral & Earthing Topology Evaluator
   * Computes Neutral-to-PE voltage and safety verdicts for internal relay, common neutral, and switched neutral
   * 
   * @param {string} topologyId - 'INTERNAL_N_PE_RELAY', 'COMMON_NEUTRAL', 'SWITCHED_NEUTRAL'
   * @returns {Object} Topology assessment
   */
  setNeutralTopology(topologyId) {
    if (!Object.values(NEUTRAL_TOPOLOGIES).includes(topologyId)) {
      throw new Error(`Unknown Neutral Topology: ${topologyId}`);
    }

    this.neutralTopology = topologyId;
    let vnPeVoltage_V = 0.0;
    let rcdFunctionalInEPS = true;
    let safetyVerdict = '';
    let codeCompliance = '';

    switch (topologyId) {
      case NEUTRAL_TOPOLOGIES.INTERNAL_N_PE_RELAY:
        vnPeVoltage_V = 0.5; // Near zero due to dynamic bond
        rcdFunctionalInEPS = true;
        safetyVerdict = 'OPTIMAL & SAFE: Automatic internal N-PE bonding contactor engages during islanding (EPS) and disengages when grid-connected, maintaining consistent earth-fault return path in both modes.';
        codeCompliance = 'Complies fully with AS/NZS 4777.2, BS 7671:2018+A2:2022 Section 551, and IEC 60364-7-712.';
        break;

      case NEUTRAL_TOPOLOGIES.COMMON_NEUTRAL:
        vnPeVoltage_V = 3.2; // Minor neutral offset
        rcdFunctionalInEPS = true;
        safetyVerdict = 'ACCEPTABLE WITH CAUTION: Neutral is solidly connected through the inverter. If upstream utility neutral is compromised during a storm or grid fault, floating neutral or backfeed hazard can occur.';
        codeCompliance = 'Allowed in specific jurisdictions; forbidden by utilities requiring 4-pole galvanic isolation during islanding.';
        break;

      case NEUTRAL_TOPOLOGIES.SWITCHED_NEUTRAL:
        vnPeVoltage_V = 115.0; // Floating neutral splits phase voltage!
        rcdFunctionalInEPS = false; // Downstream RCD cannot function without earth reference!
        safetyVerdict = 'HAZARDOUS: 2-pole relay isolates both Line and Neutral without local N-PE bonding. The EPS system floats as an ungrounded IT system; downstream RCDs FAIL TO OPERATE on single earth faults, leaving metal chassis electrified at 230V!';
        codeCompliance = 'VIOLATES AS/NZS 3000 MEN rules and IEC 60364-4-41 fault protection requirements.';
        break;
    }

    this.emit('neutralTopologyChanged', {
      topology: topologyId,
      vnPeVoltage_V,
      rcdFunctionalInEPS,
      safetyVerdict
    });

    this.updatePhysics(0);

    return {
      topologyId,
      vnPeVoltage_V,
      rcdFunctionalInEPS,
      safetyVerdict,
      codeCompliance
    };
  }

  /**
   * Calculator 5: PV String Fuse Requirement & Reverse Current Sizing Calculator
   * Determines reverse current risk and IEC 62548-1 string fuse requirements for N strings
   * 
   * @param {number} nStrings - Number of parallel strings connected to same MPPT
   * @param {number} [isc_A=11.5] - Short-circuit current per string
   * @param {number} [maxSeriesFuse_A=20.0] - Module maximum series fuse rating
   * @returns {Object} Fuse requirement report
   */
  calculateStringFuse(nStrings, isc_A = 11.5, maxSeriesFuse_A = 20.0) {
    const N = Math.max(1, parseInt(nStrings, 10));
    const maxReverseCurrent_A = (N - 1) * isc_A * 1.25;
    const fuseRequired = maxReverseCurrent_A > maxSeriesFuse_A;

    // Recommended fuse rating per IEC 62548: 1.5 * Isc <= I_fuse <= 2.4 * Isc
    const minFuse_A = Math.ceil(1.5 * isc_A);
    const maxFuse_A = Math.floor(2.4 * isc_A);
    let standardFuse_A = 15;
    if (minFuse_A > 15) standardFuse_A = 20;

    let explanation = '';
    if (N === 1) {
      explanation = 'N=1 (Single string): No parallel sources exist. Maximum reverse current is 0A. String fuses are NOT required per IEC 62548-1.';
    } else if (N === 2) {
      explanation = `N=2 (Two strings in parallel): If one string faults, the single remaining string can feed maximum 1x Isc (${(isc_A * 1.25).toFixed(1)}A max). Because this is lower than the module reverse current withstand rating (${maxSeriesFuse_A}A), string fuses are NOT required.`;
    } else {
      explanation = `N=${N} (Three or more strings): If one string suffers a short-circuit fault, ${N - 1} healthy strings backfeed into the faulted string, delivering up to ${maxReverseCurrent_A.toFixed(1)}A. Because this EXCEEDS module series rating (${maxSeriesFuse_A}A), gPV string fuses are MANDATORY on BOTH positive and negative conductors.`;
    }

    return {
      numStrings: N,
      iscPerString_A: isc_A,
      maxSeriesFuseRating_A: maxSeriesFuse_A,
      maxPossibleReverseCurrent_A: Math.round(maxReverseCurrent_A * 10) / 10,
      fuseRequired: fuseRequired,
      recommendedFuseRating_A: fuseRequired ? standardFuse_A : null,
      fuseVoltageRating_V: '1000V DC gPV',
      explanation: explanation,
      standard: 'IEC 62548:2014 clause 6.3.3 / AS/NZS 5033:2021'
    };
  }

  // ==========================================================================
  // 12. RUNTIME SIMULATION CLOCK & TICK API
  // ==========================================================================

  /**
   * Updates physics based on delta time
   * @param {number} [dt_s=0.1] - Elapsed time in seconds
   * @returns {Object} Latest telemetry object
   */
  updatePhysics(dt_s = 0.1) {
    this.solveInverterPowerDispatch(dt_s);
    this.emit('telemetry', this.telemetry);
    return this.telemetry;
  }

  /**
   * Standard tick method called by simulation loop (e.g. requestAnimationFrame or setInterval)
   * @param {number} [timestamp] - Current timestamp
   */
  tick(timestamp = Date.now()) {
    const elapsed_ms = timestamp - this.lastTickTime;
    this.lastTickTime = timestamp;

    const dt_s = Math.min(1.0, Math.max(0.01, (elapsed_ms / 1000.0) * this.simSpeed));
    return this.updatePhysics(dt_s);
  }

  /**
   * Helper to set input parameters cleanly
   * @param {Object} inputs - Partial input parameters
   */
  setInputs(inputs = {}) {
    if (inputs.irradianceS1 !== undefined) this.irradianceS1_W_m2 = Number(inputs.irradianceS1);
    if (inputs.irradianceS2 !== undefined) this.irradianceS2_W_m2 = Number(inputs.irradianceS2);
    if (inputs.ambientTemp !== undefined) this.ambientTemp_C = Number(inputs.ambientTemp);
    if (inputs.normalLoads !== undefined) this.normalLoads_W = Number(inputs.normalLoads);
    if (inputs.criticalLoads !== undefined) this.criticalLoads_W = Number(inputs.criticalLoads);
    if (inputs.batterySOC !== undefined) this.batterySOC_pct = Math.min(100, Math.max(0, Number(inputs.batterySOC)));
    if (inputs.zeroExportEnabled !== undefined) this.zeroExportEnabled = Boolean(inputs.zeroExportEnabled);
    if (inputs.simSpeed !== undefined) this.simSpeed = Math.max(0.1, Math.min(20.0, Number(inputs.simSpeed)));

    this.updatePhysics(0);
  }

  /**
   * Returns clean telemetry object
   */
  setSbyPosition(pos) {
    if (['I', '0', 'II'].includes(pos)) {
      this.sbyPosition = pos;
      this.emit('sbyPositionChanged', pos);
      this.updatePhysics(0);
    }
  }

  getTelemetry() {
    return this.telemetry;
  }
}

// Global browser window and Node module export support
if (typeof window !== 'undefined') {
  window.EventEmitter = EventEmitter;
  window.HybridSolarSimulationEngine = HybridSolarSimulationEngine;
  window.SYSTEM_SPECS = SYSTEM_SPECS;
  window.LIFEPO4_16S_OCV_CURVE = LIFEPO4_16S_OCV_CURVE;
  window.INVERTER_STATES = INVERTER_STATES;
  window.SUB_PHASES = SUB_PHASES;
  window.FAULT_KEYS = FAULT_KEYS;
  window.FLOW_FILTERS = FLOW_FILTERS;
  window.NEUTRAL_TOPOLOGIES = NEUTRAL_TOPOLOGIES;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    EventEmitter,
    SYSTEM_SPECS,
    LIFEPO4_16S_OCV_CURVE,
    INVERTER_STATES,
    SUB_PHASES,
    FAULT_KEYS,
    FLOW_FILTERS,
    NEUTRAL_TOPOLOGIES,
    HybridSolarSimulationEngine
  };
}
