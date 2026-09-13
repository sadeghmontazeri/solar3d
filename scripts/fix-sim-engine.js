const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../js/simulation-engine.js');
let code = fs.readFileSync(targetPath, 'utf8');

// 1. Remove export keywords from declarations
code = code.replace(/^export class EventEmitter/m, 'class EventEmitter');
code = code.replace(/^export const SYSTEM_SPECS/m, 'const SYSTEM_SPECS');
code = code.replace(/^export const LIFEPO4_16S_OCV_CURVE/m, 'const LIFEPO4_16S_OCV_CURVE');
code = code.replace(/^export const INVERTER_STATES/m, 'const INVERTER_STATES');
code = code.replace(/^export const SUB_PHASES/m, 'const SUB_PHASES');
code = code.replace(/^export const FAULT_KEYS/m, 'const FAULT_KEYS');
code = code.replace(/^export const FLOW_FILTERS/m, 'const FLOW_FILTERS');
code = code.replace(/^export const NEUTRAL_TOPOLOGIES/m, 'const NEUTRAL_TOPOLOGIES');
code = code.replace(/^export class HybridSolarSimulationEngine/m, 'class HybridSolarSimulationEngine');

// 2. Add SBY support in constructor
if (!code.includes('this.sbyPosition =')) {
  const constructorTarget = 'this.flowFilter = FLOW_FILTERS.ALL;';
  const constructorReplacement = `this.flowFilter = FLOW_FILTERS.ALL;
    this.sbyPosition = initialConfig.sbyPosition ?? 'I'; // 'I'=EPS, '0'=OFF, 'II'=Grid Bypass`;
  code = code.replace(constructorTarget, constructorReplacement);
}

// 3. Add relays
if (!code.includes('qbpBreaker:')) {
  const relaysTarget = 'rcdTripped: false       // Residual Current Device status';
  const relaysReplacement = `rcdTripped: false,      // Residual Current Device status
      qbpBreaker: true,       // Bypass Source II MCB
      qoBreaker: true,        // Essential DB Incomer MCB
      qnBreaker: true         // Non-essential DB MCB`;
  code = code.replace(relaysTarget, relaysReplacement);
}

// 4. Update solveInverterPowerDispatch with SBY routing
if (!code.includes('// SBY 3-position routing')) {
  const loadTarget = `    // 2. Load demands (incorporate RCD trip)
    const rcdHealthy = !this.relays.rcdTripped && !this.activeFaults.get(FAULT_KEYS.RCD_TRIP);
    let pCrit = (this.relays.epsBreaker && rcdHealthy) ? this.criticalLoads_W : 0.0;
    let pNorm = (this.relays.gridBreaker && rcdHealthy) ? this.normalLoads_W : 0.0;`;

  const loadReplacement = `    // 2. Load demands (incorporate RCD trip & SBY 3-position routing)
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

    let pNorm = (this.relays.gridBreaker && (this.relays.qnBreaker !== false)) ? this.normalLoads_W : 0.0;`;

  code = code.replace(loadTarget, loadReplacement);
}

// 5. Add setSbyPosition method
if (!code.includes('setSbyPosition(pos)')) {
  const methodTarget = '  getTelemetry() {\n    return this.telemetry;\n  }';
  const methodReplacement = `  setSbyPosition(pos) {
    if (['I', '0', 'II'].includes(pos)) {
      this.sbyPosition = pos;
      this.emit('sbyPositionChanged', pos);
      this.updatePhysics(0);
    }
  }

  getTelemetry() {
    return this.telemetry;
  }`;
  code = code.replace(methodTarget, methodReplacement);
}

// 6. Update bottom exports
const bottomTarget = `// Global browser window export support
if (typeof window !== 'undefined') {
  window.HybridSolarSimulationEngine = HybridSolarSimulationEngine;
  window.SYSTEM_SPECS = SYSTEM_SPECS;
  window.INVERTER_STATES = INVERTER_STATES;
  window.FAULT_KEYS = FAULT_KEYS;
  window.FLOW_FILTERS = FLOW_FILTERS;
  window.NEUTRAL_TOPOLOGIES = NEUTRAL_TOPOLOGIES;
}`;

const bottomReplacement = `// Global browser window and Node module export support
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
}`;

code = code.replace(bottomTarget, bottomReplacement);

fs.writeFileSync(targetPath, code, 'utf8');
console.log('Successfully updated simulation-engine.js');
