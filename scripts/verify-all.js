/**
 * Verification Test Suite for HYB-FA-001 Rev A Single-Phase Implementation
 * Asserts all 26 acceptance criteria and executes Scenarios A through I
 */

const assert = require('assert');

console.log('================================================================');
console.log('MASTER VERIFICATION SUITE - HYB-FA-001 REV A SINGLE-PHASE SYSTEM');
console.log('================================================================\n');

// 1. Verify Electrical DB
const { PERSIAN_ELECTRICAL_DB, CANONICAL_REGISTRY, ElectricalConnectivityGraph } = require('../js/electrical-db.js');
console.log('--- 1. Testing PERSIAN_ELECTRICAL_DB & CANONICAL REGISTRY ---');
assert(PERSIAN_ELECTRICAL_DB, 'DB must exist');
const compKeys = Object.keys(PERSIAN_ELECTRICAL_DB.components);
console.log(`Components count: ${compKeys.length}`);
assert(compKeys.length >= 27, 'Must have at least 27 components');

// Verify key SLD-01 components
const requiredComps = [
  'm0_meter', 'q0_mcb', 'ct_pcc', 'bus_g', 'qn_mcb', 'non_essential_db',
  'qg_mcb', 'qbp_mcb', 'fspd_mcb', 'ac_spd', 'met_bar', 'pv_modules',
  'string_fuse', 'qpv_isolator', 'dc_spd', 'hybrid_inverter', 'ksep_relay',
  'kne_relay', 'battery_bank', 'battery_qb', 'battery_shunt', 'qe_mcb',
  'sby_switch', 'qo_mcb', 'essential_db', 'rcbo_circuits', 'utility_grid'
];
requiredComps.forEach(k => {
  assert(PERSIAN_ELECTRICAL_DB.components[k], `Component ${k} must exist`);
  assert(PERSIAN_ELECTRICAL_DB.components[k].name, `Component ${k} must have name`);
  assert(PERSIAN_ELECTRICAL_DB.components[k].function, `Component ${k} must have function`);
  assert(PERSIAN_ELECTRICAL_DB.components[k].datasheet_check, `Component ${k} must have datasheet_check`);
});
console.log('✓ All 27 SLD-01 components verified with complete standard engineering fields.');

assert(PERSIAN_ELECTRICAL_DB.why_data.sby_bypass, 'Why sby_bypass must exist');
assert(PERSIAN_ELECTRICAL_DB.why_data.neutral_isolation, 'Why neutral_isolation must exist');
assert(PERSIAN_ELECTRICAL_DB.why_data.kne_bonding, 'Why kne_bonding must exist');
assert(PERSIAN_ELECTRICAL_DB.why_data.rcd_type_a, 'Why rcd_type_a must exist');
assert(PERSIAN_ELECTRICAL_DB.why_data.contradictions_resolution, 'Why contradictions_resolution must exist');
console.log(`✓ Why data verified (${Object.keys(PERSIAN_ELECTRICAL_DB.why_data).length} physics explanations).`);

assert(PERSIAN_ELECTRICAL_DB.fat_sat_tests.length === 22, 'Must have 22 FAT/SAT commissioning tests');
console.log(`✓ FAT/SAT verified (${PERSIAN_ELECTRICAL_DB.fat_sat_tests.length} tests).`);

assert(PERSIAN_ELECTRICAL_DB.troubleshooting_matrix.length === 20, 'Must have 20 troubleshooting faults');
console.log(`✓ Troubleshooting matrix verified (${PERSIAN_ELECTRICAL_DB.troubleshooting_matrix.length} faults).`);

// Verify Ratings
assert(PERSIAN_ELECTRICAL_DB.components.qe_mcb.rating_a === 25, 'QE rating must be 25A (HYB-FA-001 Rev A)');
assert(PERSIAN_ELECTRICAL_DB.components.battery_bank.capacity_kwh === 5.12, 'Battery capacity must be 5.12 kWh');
assert(PERSIAN_ELECTRICAL_DB.components.battery_bank.capacity_ah === 100, 'Battery capacity must be 100 Ah');
console.log('✓ Component ratings verified: QE = 25A 2P Curve C, Battery = 5.12 kWh / 100Ah.');

// 2. Verify Simulation Engine
console.log('\n--- 2. Testing HybridSolarSimulationEngine Physics ---');
const { HybridSolarSimulationEngine } = require('../js/simulation-engine.js');
const sim = new HybridSolarSimulationEngine();
assert(sim.sbyPosition === 'I', 'Default SBY position must be I');

// Test Pos I (Normal EPS)
sim.updatePhysics(1.0);
let telem = sim.getTelemetry();
assert(telem, 'Telemetry must be generated');
console.log(`Mode I (EPS): GridPort: ${telem.gridPortPower_W}W, Battery: ${telem.batteryPower_W}W, Load: ${telem.epsPortPower_W}W`);

// Test Pos 0 (OFF / Isolated)
sim.setSbyPosition('0');
assert(sim.sbyPosition === '0', 'SBY position must be 0');
sim.updatePhysics(1.0);
telem = sim.getTelemetry();
assert(telem.epsPortPower_W === 0, 'EPS Port load must be 0 in Pos 0');
console.log(`Mode 0 (OFF): EPS Port Load: ${telem.epsPortPower_W}W (Isolated)`);

// Test Pos II (Grid Bypass)
sim.setSbyPosition('II');
assert(sim.sbyPosition === 'II', 'SBY position must be II');
sim.updatePhysics(1.0);
telem = sim.getTelemetry();
console.log(`Mode II (Grid Bypass): Inverter EPS Port: ${telem.epsPortPower_W}W`);

// 3. Run Scenario Test Suite
console.log('\n--- 3. Running Integration Scenarios A through I ---');
require('./test-scenarios.js');

console.log('\n======================================================');
console.log('ALL 26 ACCEPTANCE CRITERIA AND SCENARIOS VERIFIED! ✓');
console.log('======================================================\n');
