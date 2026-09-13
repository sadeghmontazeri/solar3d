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
    expectedGridP: 0 // PV 4570 covers loads 3700 + battery 870 -> grid 0
  },
  {
    id: 'P2',
    name: 'QG open (REGRESSION GUARD)',
    input: {
      irradiance: 0, temperature: 25, normalLoadPower: 2200, criticalLoadPower: 1500, batterySOC: 75,
      operatingMode: 'normal_day', sbyPosition: 'I',
      breakers: { ...defBreakers, qg_mcb: false, battery_qb: false, battery_ocpd: false },
      failures: defFailures
    },
    expectedGridP: 2200 // Grid supplies normal load directly, inverter isolated -> 2200
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
    expectedGridP: 3700 // Grid supplies 2200 normal + 1500 bypass critical -> 3700
  },
  {
    id: 'P4',
    name: 'PV surplus export',
    input: {
      irradiance: 1200, temperature: 25, normalLoadPower: 1000, criticalLoadPower: 500, batterySOC: 100,
      operatingMode: 'normal_day', sbyPosition: 'I', breakers: defBreakers, failures: defFailures
    },
    expectedGridP: -4951 // PV 6451.2 - 1500 loads -> -4951 exported
  },
  {
    id: 'P5',
    name: 'battery discharging',
    input: {
      irradiance: 0, temperature: 25, normalLoadPower: 2200, criticalLoadPower: 1500, batterySOC: 80,
      operatingMode: 'evening_peak', sbyPosition: 'I', breakers: defBreakers, failures: defFailures
    },
    expectedGridP: 0 // Battery discharges 3700, covering full 2200+1500 load -> grid 0
  },
  {
    id: 'P6',
    name: 'night charge',
    input: {
      irradiance: 0, temperature: 25, normalLoadPower: 2200, criticalLoadPower: 0, batterySOC: 50,
      operatingMode: 'night_charge', sbyPosition: 'I', breakers: defBreakers, failures: defFailures
    },
    expectedGridP: 4700 // Normal 2200 + battery charging 2500 -> 4700
  },
  {
    id: 'P7',
    name: 'grid dead (REGRESSION GUARD)',
    input: {
      irradiance: 850, temperature: 25, normalLoadPower: 2200, criticalLoadPower: 1500, batterySOC: 75,
      operatingMode: 'normal_day', sbyPosition: 'I', breakers: defBreakers,
      failures: { ...defFailures, grid_blackout: true }
    },
    expectedGridP: 0 // Grid dead -> 0
  },
  {
    id: 'P8',
    name: 'eps_rcd open (dead switch honesty)',
    input: {
      irradiance: 850, temperature: 25, normalLoadPower: 2200, criticalLoadPower: 1500, batterySOC: 75,
      operatingMode: 'normal_day', sbyPosition: 'I',
      breakers: { ...defBreakers, eps_rcd: false },
      failures: defFailures
    },
    expectedEpsP: 0,
    expectedEpsV: 0
  }
];

let passed = 0;

scenarios.forEach(tc => {
  const res = computePowerModel(tc.input);
  let matches = false;
  if (tc.expectedEpsP !== undefined) {
    matches = (res.eps.p === tc.expectedEpsP && res.eps.v === tc.expectedEpsV);
    if (matches) passed++;
    console.log(`${tc.id} [${tc.name}]:`);
    console.log(`   eps.p = ${res.eps.p} W | expected = ${tc.expectedEpsP} W`);
    console.log(`   eps.v = ${res.eps.v} V | expected = ${tc.expectedEpsV} V`);
    console.log(`   Status: ${matches ? '✓ PASS' : '✗ FAIL'}\n`);
  } else {
    const gridP = res.grid.p;
    matches = (gridP === tc.expectedGridP);
    if (matches) passed++;
    console.log(`${tc.id} [${tc.name}]:`);
    console.log(`   grid.p = ${gridP} W | expected = ${tc.expectedGridP} W`);
    console.log(`   Status: ${matches ? '✓ PASS' : '✗ FAIL'}\n`);
  }
});

console.log('----------------------------------------------------');
console.log(`VERIFICATION RESULT: ${passed} of ${scenarios.length} tests passed.`);
console.log('----------------------------------------------------\n');

assert.strictEqual(passed, scenarios.length, 'All 8 scenarios must pass');
console.log('ALL STEP 8 POWER MODEL TESTS PASSED! ✓\n');
