/**
 * Scenarios A through I Integration Verification Test Suite
 * 5kW Single-Phase Hybrid Solar PV Architectural Integrity Verification
 * Standards: IEC 60364-7-712, IEC 62109-1/2, IEC 60947-6-1, AS/NZS 4777.2
 */

const assert = require('assert');
const { PERSIAN_ELECTRICAL_DB, CANONICAL_REGISTRY, ElectricalConnectivityGraph } = require('../js/electrical-db.js');
const { HybridSolarSimulationEngine, INVERTER_STATES, FAULT_KEYS, NEUTRAL_TOPOLOGIES } = require('../js/simulation-engine.js');

console.log('================================================================');
console.log('RUNNING COMPREHENSIVE INTEGRATION SUITE (SCENARIOS A THROUGH I)');
console.log('================================================================\n');

let passedTests = 0;
let totalTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`✓ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`✗ FAIL: ${name}`);
    console.error(err.message);
    throw err;
  }
}

// -----------------------------------------------------------------------------
// Scenario A: Normal Grid-Connected Operation
// -----------------------------------------------------------------------------
test('Scenario A: Normal Grid-Connected with PV Generation & Battery Charging', () => {
  const sim = new HybridSolarSimulationEngine({
    irradianceS1_W_m2: 800,
    irradianceS2_W_m2: 800,
    ambientTemp_C: 25,
    batterySOC_pct: 60,
    normalLoads_W: 1500,
    criticalLoads_W: 1000,
    sbyPosition: 'I'
  });

  sim.updatePhysics(1.0);
  const telem = sim.getTelemetry();

  assert.strictEqual(telem.inverterState, INVERTER_STATES.NORMAL_GRID, 'Inverter must be in NORMAL_GRID state');
  assert(telem.pvPowerDC_W > 2000, 'PV power must be generated from both strings');
  assert(telem.string1Power_W > 0, 'String 1 must generate power');
  assert(telem.string2Power_W > 0, 'String 2 must generate power');
  assert.strictEqual(telem.relays.ksep.contact, true, 'KSEP relay contact must be CLOSED when grid is healthy');
  assert.strictEqual(telem.relays.ksep.outputState, 'CLOSED', 'KSEP output state must be CLOSED');
  assert.strictEqual(telem.relays.kne.contact, false, 'KNE relay contact must be OPEN in grid-tied mode (upstream MEN active)');
  assert.strictEqual(telem.relays.gridContactor, true, 'Grid contactor must be closed');
  assert.strictEqual(telem.gridVoltage_V, 230, 'Grid voltage must be 230V');
  assert.strictEqual(telem.activeFlows.peGrounding, false, 'PE Grounding flow must be INACTIVE during normal healthy operation');
});

// -----------------------------------------------------------------------------
// Scenario B: Grid Blackout & Anti-Islanding EPS Transition
// -----------------------------------------------------------------------------
test('Scenario B: Grid Blackout & Anti-Islanding (<20ms) EPS Mode with Dynamic KNE Bonding', () => {
  const sim = new HybridSolarSimulationEngine({
    irradianceS1_W_m2: 800,
    irradianceS2_W_m2: 800,
    ambientTemp_C: 25,
    batterySOC_pct: 70,
    normalLoads_W: 1500,
    criticalLoads_W: 1000,
    sbyPosition: 'I'
  });

  // Trigger Grid Outage
  sim.triggerFault(FAULT_KEYS.GRID_OUTAGE);
  sim.updatePhysics(0.1);
  const telem = sim.getTelemetry();

  assert.strictEqual(telem.inverterState, INVERTER_STATES.GRID_FAILURE_EPS, 'Inverter must transition to GRID_FAILURE_EPS');
  assert.strictEqual(telem.gridVoltage_V, 0.0, 'Grid voltage must drop strictly to 0.0V');
  assert.strictEqual(telem.gridFrequency_Hz, 0.0, 'Grid frequency must drop strictly to 0.0Hz');
  assert.strictEqual(telem.gridPortPower_W, 0.0, 'Grid port power must be strictly 0.0W');
  assert.strictEqual(telem.normalLoadsPower_W, 0.0, 'Non-critical house loads must be shed to 0.0W');
  assert.strictEqual(telem.relays.ksep.contact, false, 'KSEP relay must OPEN immediately to prevent backfeeding grid');
  assert.strictEqual(telem.relays.ksep.outputState, 'OPEN', 'KSEP output state must be OPEN');
  assert.strictEqual(telem.relays.kne.contact, true, 'KNE relay must CLOSE to create local TN-S neutral-earth reference in island mode');
  assert.strictEqual(telem.relays.kne.outputState, 'CLOSED', 'KNE output state must be CLOSED');
  assert(telem.epsPortPower_W >= 1000, 'Critical EPS loads must remain powered from PV/Battery');
  assert.strictEqual(telem.epsVoltage_V, 230.0, 'EPS port voltage must remain 230.0V from inverter backup');
});

// -----------------------------------------------------------------------------
// Scenario C: SBY Break-Before-Make Manual Changeover Transfer
// -----------------------------------------------------------------------------
test('Scenario C: SBY Break-Before-Make Transfer (Pos I -> Pos 0 -> Pos II)', () => {
  const sim = new HybridSolarSimulationEngine({
    irradianceS1_W_m2: 500,
    batterySOC_pct: 80,
    criticalLoads_W: 1200,
    sbyPosition: 'I'
  });

  sim.updatePhysics(0.1);
  let telem = sim.getTelemetry();
  assert.strictEqual(sim.sbyPosition, 'I');
  assert.strictEqual(telem.epsPortPower_W, 1200);

  // Transition to Pos 0 (Break before Make)
  sim.setSbyPosition('0');
  sim.updatePhysics(0.1);
  telem = sim.getTelemetry();
  assert.strictEqual(sim.sbyPosition, '0', 'SBY must be in 0 position');
  assert.strictEqual(telem.epsPortPower_W, 0.0, 'In Pos 0, load power must be 0 (isolated)');
  assert.strictEqual(telem.criticalLoadsPower_W, 0.0, 'In Pos 0, critical loads power must be 0');

  // Transition to Pos II (Grid Bypass)
  sim.setSbyPosition('II');
  sim.updatePhysics(0.1);
  telem = sim.getTelemetry();
  assert.strictEqual(sim.sbyPosition, 'II', 'SBY must be in II position');
  assert.strictEqual(telem.epsPortPower_W, 0.0, 'In Pos II, inverter EPS port is unloaded');
});

// -----------------------------------------------------------------------------
// Scenario D: SBY Position II (Direct Grid Bypass via QBP)
// -----------------------------------------------------------------------------
test('Scenario D: SBY Position II (Grid Bypass independent of Inverter state)', () => {
  const sim = new HybridSolarSimulationEngine({
    sbyPosition: 'II',
    criticalLoads_W: 1200
  });

  // Turn off DC isolator and trip inverter into lockout
  sim.relays.dcIsolator = false;
  sim.relays.epsBreaker = false;
  sim.updatePhysics(0.1);
  const telem = sim.getTelemetry();

  assert.strictEqual(sim.sbyPosition, 'II');
  assert.strictEqual(telem.criticalLoadsVoltage_V, 230.0, 'Loads must receive 230V directly from Grid Bypass via QBP even with Inverter EPS MCB open');
  assert.strictEqual(telem.epsPortPower_W, 0.0, 'Inverter EPS port must show 0W');
});

// -----------------------------------------------------------------------------
// Scenario E: SBY Position 0 (Maintenance / Zero Voltage Isolation)
// -----------------------------------------------------------------------------
test('Scenario E: SBY Position 0 (Complete Electrical Isolation for Maintenance)', () => {
  const sim = new HybridSolarSimulationEngine({
    sbyPosition: '0',
    criticalLoads_W: 1200
  });

  sim.updatePhysics(0.1);
  const telem = sim.getTelemetry();

  assert.strictEqual(sim.sbyPosition, '0');
  assert.strictEqual(telem.criticalLoadsVoltage_V, 0.0, 'Loads must measure 0.0V in Position 0');
  assert.strictEqual(telem.criticalLoadsPower_W, 0.0, 'Loads must consume 0.0W in Position 0');
  assert.strictEqual(telem.epsPortPower_W, 0.0, 'EPS port must output 0.0W in Position 0');
});

// -----------------------------------------------------------------------------
// Scenario F: Total Source Loss (Grid Lost, PV = 0, Battery Empty / Disconnected)
// -----------------------------------------------------------------------------
test('Scenario F: Total Source Loss must yield Strictly 0.0 V and 0.0 W (No 230V Fallback)', () => {
  const sim = new HybridSolarSimulationEngine({
    irradianceS1_W_m2: 0,
    irradianceS2_W_m2: 0,
    batterySOC_pct: 5, // Below recommendedMinSoc (10%)
    criticalLoads_W: 1000,
    sbyPosition: 'I'
  });

  // Cut Grid and disable BMS
  sim.triggerFault(FAULT_KEYS.GRID_OUTAGE);
  sim.relays.bmsContactor = false;
  sim.updatePhysics(0.1);
  const telem = sim.getTelemetry();

  assert.strictEqual(telem.gridVoltage_V, 0.0, 'Grid voltage must be 0.0V');
  assert.strictEqual(telem.gridPortPower_W, 0.0, 'Grid power must be 0.0W');
  assert.strictEqual(telem.pvPowerDC_W, 0.0, 'PV power must be 0.0W');
  assert.strictEqual(telem.batteryPower_W, 0.0, 'Battery power must be 0.0W');
  assert.strictEqual(telem.epsPortPower_W, 0.0, 'EPS power must be strictly 0.0W');
  assert.strictEqual(telem.epsVoltage_V, 0.0, 'EPS voltage must be strictly 0.0V when no source exists');
  assert.strictEqual(telem.criticalLoadsVoltage_V, 0.0, 'Critical loads voltage must be strictly 0.0V');
});

// -----------------------------------------------------------------------------
// Scenario G: Independent Dual MPPT Strings Operation
// -----------------------------------------------------------------------------
test('Scenario G: Independent Dual MPPT Generation (String 1 Shaded / String 2 Sunlit)', () => {
  const sim = new HybridSolarSimulationEngine({
    irradianceS1_W_m2: 0,
    irradianceS2_W_m2: 1000,
    ambientTemp_C: 25
  });

  sim.updatePhysics(0.1);
  const telem = sim.getTelemetry();

  assert.strictEqual(telem.string1Power_W, 0.0, 'String 1 power must be 0.0W with 0 irradiance');
  assert(telem.string2Power_W > 1000, 'String 2 power must be > 1000W with 1000 W/m²');
  assert.strictEqual(telem.pvPowerDC_W, telem.string2Power_W, 'Total PV power must match String 2 power');
});

// -----------------------------------------------------------------------------
// Scenario H: Residual Current Device (RCD) Trip & PE Flow
// -----------------------------------------------------------------------------
test('Scenario H: Earth Fault & RCD Trip (Trip Disconnects Protected Loads & Activates Ground Flow)', () => {
  const sim = new HybridSolarSimulationEngine({
    criticalLoads_W: 1000,
    sbyPosition: 'I'
  });

  // Healthy first
  sim.updatePhysics(0.1);
  let telem = sim.getTelemetry();
  assert.strictEqual(telem.activeFlows.peGrounding, false, 'Normal state has no PE fault flow');

  // Trigger RCD Trip
  sim.triggerFault(FAULT_KEYS.RCD_TRIP);
  sim.updatePhysics(0.1);
  telem = sim.getTelemetry();

  assert.strictEqual(telem.relays.rcdTripped, true, 'RCD must be tripped');
  assert.strictEqual(telem.epsPortPower_W, 0.0, 'Protected loads must be disconnected on RCD trip');
  assert.strictEqual(telem.activeFlows.peGrounding, true, 'PE grounding flow must become active on earth leakage trip');
});

// -----------------------------------------------------------------------------
// Scenario I: Canonical Registry & Connectivity Graph Evaluation
// -----------------------------------------------------------------------------
test('Scenario I: Canonical Registry & Electrical Connectivity Graph Evaluation', () => {
  assert(CANONICAL_REGISTRY, 'CANONICAL_REGISTRY must exist');
  assert(CANONICAL_REGISTRY.PATHS, 'Canonical PATHS must exist');
  assert(CANONICAL_REGISTRY.EQUIPMENT, 'Canonical EQUIPMENT must exist');
  assert(CANONICAL_REGISTRY.SWITCH_IDS, 'Canonical SWITCH_IDS must exist');
  assert(CANONICAL_REGISTRY.ELECTRICAL_STATES, 'Canonical ELECTRICAL_STATES must exist');

  const graph = new ElectricalConnectivityGraph();
  assert(graph.nodes.size >= 12, 'Graph must have at least 12 electrical nodes');

  // Test 1: Normal grid state
  let state = graph.evaluate({
    utilityGrid: true,
    q0: true,
    qg: true,
    qbp: true,
    qe: true,
    qo: true,
    sby: 'I',
    pv1: true,
    pv2: true,
    battery: true
  });
  assert.strictEqual(state.busG.state, 'ENERGIZED');
  assert.strictEqual(state.epsIncomer.state, 'ENERGIZED');
  assert.strictEqual(state.essentialLoads.state, 'ENERGIZED');

  // Test 2: SBY Position 0 isolates essential loads
  state = graph.evaluate({
    utilityGrid: true,
    q0: true,
    qg: true,
    qbp: true,
    qe: true,
    qo: true,
    sby: '0',
    pv1: true,
    pv2: true,
    battery: true
  });
  assert.strictEqual(state.essentialLoads.state, 'DE_ENERGIZED');
  assert.strictEqual(state.essentialLoads.voltage, 0);

  // Test 3: SBY Position II routes from Grid Bypass
  state = graph.evaluate({
    utilityGrid: true,
    q0: true,
    qg: false, // Inverter disconnected
    qbp: true,
    qe: false, // EPS incomer open
    qo: true,
    sby: 'II',
    pv1: false,
    pv2: false,
    battery: false
  });
  assert.strictEqual(state.essentialLoads.state, 'ENERGIZED');
  assert.strictEqual(state.essentialLoads.source, 'Grid Bypass (QBP)');
});

console.log('\n================================================================');
console.log(`RESULTS: ${passedTests} OF ${totalTests} SCENARIO TESTS PASSED SUCCESSFULLY! ✓`);
console.log('================================================================\n');
