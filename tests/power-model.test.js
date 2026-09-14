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
  },
  {
    id: 'P9',
    name: 'profile parameterization (batteryBank.present=false: battery bypassed, load supplied by grid)',
    input: {
      irradiance: 0, temperature: 25, normalLoadPower: 2200, criticalLoadPower: 1500, batterySOC: 80,
      operatingMode: 'evening_peak', sbyPosition: 'I', breakers: defBreakers, failures: defFailures
    },
    profile: {
      equipment: {
        batteryBank: { present: false }
      }
    },
    expectedBatteryP: 0,
    expectedGridP: 3700 // Battery bypassed: battery.p=0, load (2200+1500) supplied by grid -> 3700
  }
];

let passed = 0;

scenarios.forEach(tc => {
  const res = computePowerModel(tc.input, tc.profile);
  let matches = false;
  if (tc.expectedEpsP !== undefined) {
    matches = (res.eps.p === tc.expectedEpsP && res.eps.v === tc.expectedEpsV);
    if (matches) passed++;
    console.log(`${tc.id} [${tc.name}]:`);
    console.log(`   eps.p = ${res.eps.p} W | expected = ${tc.expectedEpsP} W`);
    console.log(`   eps.v = ${res.eps.v} V | expected = ${tc.expectedEpsV} V`);
    console.log(`   Status: ${matches ? '✓ PASS' : '✗ FAIL'}\n`);
  } else if (tc.expectedBatteryP !== undefined) {
    matches = (res.battery.p === tc.expectedBatteryP && (tc.expectedGridP === undefined || res.grid.p === tc.expectedGridP));
    if (matches) passed++;
    console.log(`${tc.id} [${tc.name}]:`);
    console.log(`   battery.p = ${res.battery.p} W | expected = ${tc.expectedBatteryP} W`);
    if (tc.expectedGridP !== undefined) {
      console.log(`   grid.p    = ${res.grid.p} W | expected = ${tc.expectedGridP} W`);
    }
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

// Additional assertion: load supplied by PV when battery is bypassed
const resPvBypass = computePowerModel({
  irradiance: 850, temperature: 25, normalLoadPower: 2200, criticalLoadPower: 1500, batterySOC: 75,
  operatingMode: 'normal_day', sbyPosition: 'I', breakers: defBreakers, failures: defFailures
}, {
  equipment: {
    batteryBank: { present: false }
  }
});
assert.strictEqual(resPvBypass.battery.p, 0, 'P9-PV: battery.p must be 0');
assert.strictEqual(resPvBypass.grid.p, -870, 'P9-PV: PV covers full load (3700W) with surplus 870W exported');
console.log('P9-PV [profile parameterization: batteryBank.present=false with solar PV]:');
console.log(`   battery.p = ${resPvBypass.battery.p} W | expected = 0 W`);
console.log(`   grid.p    = ${resPvBypass.grid.p} W | expected = -870 W (load covered by PV)`);
console.log('   Status: ✓ PASS\n');

console.log('----------------------------------------------------');
console.log(`VERIFICATION RESULT: ${passed} of ${scenarios.length} tests passed.`);
console.log('----------------------------------------------------\n');

assert.strictEqual(passed, scenarios.length, 'All 8 scenarios must pass');
console.log('ALL P1..P8 POWER MODEL TESTS PASSED! ✓\n');

// ====================================================
// SYSTEM PROFILE CONTRACT & REGRESSION TESTS (STEP 15)
// ====================================================
console.log('====================================================');
console.log('RUNNING SYSTEM PROFILE REGRESSION TESTS');
console.log('====================================================\n');

const { SystemProfiles, validateSystemProfile } = require('../js/system-profile.js');

const profileScenarios = [
  {
    id: 'PR1',
    name: 'canonical profile-hyb-1p-5kw-v1 schema validation',
    check: () => {
      assert.ok(SystemProfiles, 'SystemProfiles registry must exist');
      const p = SystemProfiles.get('profile-hyb-1p-5kw-v1');
      assert.ok(p, 'profile-hyb-1p-5kw-v1 must be registered');
      assert.strictEqual(p.familyId, '1p-hybrid', 'familyId must be 1p-hybrid');
      assert.strictEqual(p.status, 'active', 'profile status must be active');
      const val = validateSystemProfile(p);
      assert.strictEqual(val.valid, true, `Profile must be valid: ${val.errors.join(', ')}`);
      assert.strictEqual(val.errors.length, 0, 'Profile validation errors must be 0');
      return true;
    }
  },
  {
    id: 'PR2',
    name: 'decoupled 4 domains completeness & ratings alignment',
    check: () => {
      const p = SystemProfiles.get('profile-hyb-1p-5kw-v1');
      // Domain 1: Equipment
      assert.ok(p.equipment && p.equipment.inverter && p.equipment.pvArray && p.equipment.batteryStorage, 'Domain 1 (Equipment) missing subcomponents');
      assert.strictEqual(p.systemRatings.acRatedPower_W, 5000, 'Inverter rating must be 5000 W');
      assert.strictEqual(p.systemRatings.dcString1RatedPower_W, 2800, 'String 1 nominal power must be 2800 W');
      assert.strictEqual(p.systemRatings.dcString2RatedPower_W, 2800, 'String 2 nominal power must be 2800 W');
      assert.strictEqual(p.systemRatings.batteryNominalVoltage_V, 51.2, 'Battery nominal voltage must be 51.2 V');
      assert.strictEqual(p.systemRatings.batteryNominalCapacity_Ah, 100, 'Battery nominal capacity must be 100 Ah');
      assert.strictEqual(p.systemRatings.inverterPeakEfficiency_pct, 97.4, 'Inverter efficiency must be 97.4%');
      // Domain 2: Connectivity
      assert.ok(p.connectivity && p.connectivity.buses, 'Domain 2 (Connectivity) missing buses');
      const busKeys = Object.keys(p.connectivity.buses);
      assert.ok(busKeys.includes('BUS-G'), 'Connectivity must define BUS-G');
      assert.ok(busKeys.includes('DC-BUS'), 'Connectivity must define DC-BUS');
      assert.ok(busKeys.includes('BUS-EPS'), 'Connectivity must define BUS-EPS');
      assert.ok(busKeys.includes('MET'), 'Connectivity must define MET');
      // Domain 3: Layout3D
      assert.ok(p.layout3D && p.layout3D.enclosures, 'Domain 3 (Layout3D) missing enclosures');
      const encKeys = Object.keys(p.layout3D.enclosures);
      assert.ok(encKeys.includes('mainDistributionBoard'), 'Layout3D must include mainDistributionBoard');
      assert.ok(encKeys.includes('dcCombinerBox'), 'Layout3D must include dcCombinerBox');
      assert.ok(encKeys.includes('epsDistributionBoard'), 'Layout3D must include epsDistributionBoard');
      // Domain 4: SLDMapping
      assert.ok(p.sldMapping && p.sldMapping.schematicId, 'Domain 4 (SLDMapping) missing schematicId');
      assert.strictEqual(p.sldMapping.schematicId, 'SLD-01', 'schematicId must match SLD-01');
      assert.strictEqual(p.sldRef.drawingId, 'SLD-01', 'sldRef.drawingId must match SLD-01');
      return true;
    }
  },
  {
    id: 'PR3',
    name: 'approved configurations query & registry immutability',
    check: () => {
      const approved = SystemProfiles.getApprovedConfigurations('1p-hybrid');
      assert.ok(Array.isArray(approved) && approved.length >= 1, 'Approved configurations for 1p-hybrid must have >= 1 profile');
      assert.strictEqual(approved[0].id, 'profile-hyb-1p-5kw-v1', 'First approved profile must be canonical 5kW');
      const p = SystemProfiles.get('profile-hyb-1p-5kw-v1');
      assert.ok(Object.isFrozen(p), 'Registered profile must be frozen');
      return true;
    }
  }
];

let profilePassed = 0;
profileScenarios.forEach(tc => {
  try {
    tc.check();
    profilePassed++;
    console.log(`${tc.id} [${tc.name}]:`);
    console.log(`   Status: ✓ PASS\n`);
  } catch (err) {
    console.log(`${tc.id} [${tc.name}]:`);
    console.log(`   Error: ${err.message}`);
    console.log(`   Status: ✗ FAIL\n`);
  }
});

console.log('----------------------------------------------------');
console.log(`PROFILE TESTS RESULT: ${profilePassed} of ${profileScenarios.length} passed.`);
console.log('----------------------------------------------------\n');

assert.strictEqual(profilePassed, profileScenarios.length, 'All profile scenarios must pass');
console.log('ALL PROFILE & POWER MODEL TESTS PASSED VERBATIM! ✓\n');
