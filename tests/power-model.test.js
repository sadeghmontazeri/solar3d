const assert = require('assert');
const { computePowerModel } = require('../js/power-model.js');

console.log('====================================================');
console.log('RUNNING GOLDEN BASELINE TESTS FOR PURE POWER MODEL');
console.log('====================================================\n');

const defBreakers = {
  q0_mcb: true, grid_mcb: true, qn_mcb: true, qg_mcb: true, inv_grid_mcb: true,
  qbp_mcb: true, fspd_mcb: true, dc_isolator: true, qpv_isolator: true, dc_iso_1: true,
  dc_iso_2: true, battery_ocpd: true, battery_qb: true, eps_mcb: true, qe_mcb: true,
  qo_mcb: true, eps_rcd: true
};

const defFailures = {
  dc_arc_fault: false, surge_overvoltage: false, grid_blackout: false,
  grid_brownout: false, ground_fault: false, battery_thermal: false,
  eps_overload: false, blown_pv_fuse: false, ct_inverted: false
};

const scenarios = [
  {
    id: 'P1',
    name: 'defaults, SBY=I, QG closed',
    input: {
      irradiance: 850, temperature: 25, normalLoadPower: 2200, criticalLoadPower: 1500, batterySOC: 75,
      operatingMode: 'normal_day', sbyPosition: 'I', breakers: defBreakers, failures: defFailures
    },
    planExpected: 2200,
    actualAppExpected: 2200
  },
  {
    id: 'P2',
    name: 'QG open',
    input: {
      irradiance: 0, temperature: 25, normalLoadPower: 2200, criticalLoadPower: 1500, batterySOC: 75,
      operatingMode: 'normal_day', sbyPosition: 'I',
      breakers: { ...defBreakers, qg_mcb: false, battery_qb: false, battery_ocpd: false },
      failures: defFailures
    },
    planExpected: 2200,
    actualAppExpected: 2200
  },
  {
    id: 'P3',
    name: 'SBY=II bypass',
    input: {
      irradiance: 0, temperature: 25, normalLoadPower: 2200, criticalLoadPower: 1500, batterySOC: 75,
      operatingMode: 'normal_day', sbyPosition: 'II',
      breakers: { ...defBreakers, battery_qb: false, battery_ocpd: false },
      failures: defFailures
    },
    planExpected: 5900,
    actualAppExpected: 5900
  },
  {
    id: 'P4',
    name: 'PV surplus export',
    input: {
      irradiance: 1200, temperature: 25, normalLoadPower: 1000, criticalLoadPower: 500, batterySOC: 100,
      operatingMode: 'normal_day', sbyPosition: 'I', breakers: defBreakers, failures: defFailures
    },
    planExpected: -3500,
    actualAppExpected: -3951
  },
  {
    id: 'P5',
    name: 'battery discharging',
    input: {
      irradiance: 0, temperature: 25, normalLoadPower: 2200, criticalLoadPower: 1500, batterySOC: 80,
      operatingMode: 'evening_peak', sbyPosition: 'I', breakers: defBreakers, failures: defFailures
    },
    planExpected: 3900,
    actualAppExpected: 2200
  },
  {
    id: 'P6',
    name: 'night charge',
    input: {
      irradiance: 0, temperature: 25, normalLoadPower: 2200, criticalLoadPower: 0, batterySOC: 50,
      operatingMode: 'night_charge', sbyPosition: 'I', breakers: defBreakers, failures: defFailures
    },
    planExpected: 6900,
    actualAppExpected: 6900
  },
  {
    id: 'P7',
    name: 'grid dead',
    input: {
      irradiance: 850, temperature: 25, normalLoadPower: 2200, criticalLoadPower: 1500, batterySOC: 75,
      operatingMode: 'normal_day', sbyPosition: 'I', breakers: defBreakers,
      failures: { ...defFailures, grid_blackout: true }
    },
    planExpected: 0,
    actualAppExpected: 0
  }
];

let passed = 0;
let planMatches = 0;

scenarios.forEach(tc => {
  const res = computePowerModel(tc.input);
  const gridP = res.grid.p;
  const matchesActual = (gridP === tc.actualAppExpected);
  const matchesPlan = (gridP === tc.planExpected);

  if (matchesActual) passed++;
  if (matchesPlan) planMatches++;

  console.log(`${tc.id} [${tc.name}]:`);
  console.log(`   grid.p = ${gridP} W | app.js truth = ${tc.actualAppExpected} W | PLAN.md spec = ${tc.planExpected} W`);
  console.log(`   Matches verbatim app.js behaviour: ${matchesActual ? '✓ YES' : '✗ NO'}`);
  if (!matchesPlan) {
    console.log(`   ⚠️ Discrepancy with PLAN.md hand-calculation: diff = ${gridP - tc.planExpected} W`);
  }
  console.log('');
});

console.log('----------------------------------------------------');
console.log(`VERIFICATION RESULT: ${passed} of ${scenarios.length} match verbatim app.js behaviour.`);
console.log(`PLAN.md hand-calculation matches: ${planMatches} of ${scenarios.length}`);
console.log('----------------------------------------------------\n');

assert.strictEqual(passed, scenarios.length, 'All 7 scenarios must match verbatim app.js behaviour');
console.log('ALL GOLDEN BASELINE BEHAVIOURAL TESTS PASSED! ✓\n');
