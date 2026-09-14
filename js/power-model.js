/**
 * Pure power-balance model. No DOM, no globals, no side effects.
 * Extracted verbatim from app.js computeElectricalState() — behaviour must not change.
 */
function computePowerModel(input, profile) {
  const f = input.failures || {};
  const b = input.breakers || {};

  // 0. Resolve System Profile & Parameterized Ratings
  let activeProfile = profile;
  if (!activeProfile) {
    activeProfile = (typeof window !== 'undefined' && window.SystemProfiles && typeof window.SystemProfiles.get === 'function')
      ? window.SystemProfiles.get('profile-hyb-1p-5kw-v1')
      : null;
  }

  // PV string capacities: read from profile.equipment.pvArray.strings or fallback to 2800W
  const pvStrings = activeProfile?.equipment?.pvArray?.strings;
  const getPvStringCapacity = (str, fallback = 2800) => {
    if (typeof str === 'number') return str;
    if (str && typeof str === 'object') {
      return str.ratedPower_W ?? str.capacity_W ?? str.capacity ?? str.pMax_W ?? fallback;
    }
    return fallback;
  };
  const pv1Capacity = getPvStringCapacity(Array.isArray(pvStrings) ? pvStrings[0] : null, 2800);
  const pv2Capacity = getPvStringCapacity(Array.isArray(pvStrings) ? pvStrings[1] : null, 2800);

  // Max inverter power: read from profile.equipment.inverter.acRating_W or fallback to 5000W
  const maxInverterPower = activeProfile?.equipment?.inverter?.acRating_W
    ?? activeProfile?.equipment?.inverter?.ratedContinuousPower_W
    ?? activeProfile?.systemRatings?.acRatedPower_W
    ?? 5000;

  // Battery capacity: read from profile.equipment.batteryBank.capacity_Wh or fallback to 5120Wh
  const batteryCapacity = activeProfile?.equipment?.batteryBank?.capacity_Wh
    ?? activeProfile?.equipment?.batteryStorage?.bankRatings?.energyTotal_Wh
    ?? activeProfile?.systemRatings?.batteryNominalCapacity_Wh
    ?? 5120;

  // Nominal AC voltage: read from profile.connectivity.buses['BUS-G'].nominalVoltage_V or fallback to 230V
  const nominalAcVoltage = activeProfile?.connectivity?.buses?.['BUS-G']?.nominalVoltage_V
    ?? activeProfile?.connectivity?.buses?.['BUS-G']?.voltageNominal_V
    ?? activeProfile?.systemRatings?.acNominalVoltage_V
    ?? 230;

  // Topological presence flags
  const batteryPresent = !(
    activeProfile?.equipment?.batteryBank?.present === false ||
    activeProfile?.equipment?.batteryStorage?.presence === false ||
    activeProfile?.systemRatings?.batteryPresent === false
  );

  const epsBusPresent = !(
    activeProfile?.connectivity?.buses?.['BUS-EPS']?.present === false ||
    activeProfile?.connectivity?.buses?.['BUS-EPS']?.presence === false
  );

  // 1. Grid Availability & Bus-G
  // Q0 protects incoming utility service entrance
  const utilityPhysicalAvailable = !f.grid_blackout;
  const q0Closed = (b.q0_mcb !== false) && (b.grid_mcb !== false);
  const busGAlive = utilityPhysicalAvailable && q0Closed;
  const gridVoltage = busGAlive
    ? (f.grid_brownout ? Math.round(nominalAcVoltage * (165 / 230)) : nominalAcVoltage)
    : 0;

  // QG: Inverter Grid Port MCB
  // Opening QG disconnects inverter grid port, making grid unavailable to inverter!
  const qgClosed = (b.qg_mcb !== false) && (b.inv_grid_mcb !== false);
  const inverterGridAvailable = busGAlive && qgClosed && (input.operatingMode !== 'grid_outage');

  // 2. Solar PV Generation Model (Two Independent Strings)
  // String 1: DC Isolator 1 + Fuses
  const pv1Healthy = (b.dc_iso_1 !== false && b.dc_isolator !== false) && !f.dc_arc_fault && !f.blown_pv_fuse && !f.surge_overvoltage;
  let pv1Power = 0;
  let pv1Voltage = 0;
  if (pv1Healthy && input.irradiance > 0) {
    const tempFactor = 1.0 + (-0.0038 * (input.temperature - 25));
    const irrFactor = input.irradiance / 1000.0;
    pv1Power = Math.max(0, pv1Capacity * irrFactor * tempFactor * 0.96);
    pv1Voltage = Math.round(385 * (1.0 - 0.0028 * (input.temperature - 25)));
  }

  // String 2: DC Isolator 2 + Fuses
  const pv2Healthy = (b.dc_iso_2 !== false) && !f.dc_arc_fault && !f.blown_pv_fuse && !f.surge_overvoltage;
  let pv2Power = 0;
  let pv2Voltage = 0;
  if (pv2Healthy && input.irradiance > 0) {
    const tempFactor = 1.0 + (-0.0038 * (input.temperature - 25));
    const irrFactor = input.irradiance / 1000.0;
    pv2Power = Math.max(0, pv2Capacity * irrFactor * tempFactor * 0.96);
    pv2Voltage = Math.round(385 * (1.0 - 0.0028 * (input.temperature - 25)));
  }

  const totalPvPower = pv1Power + pv2Power;
  const effectivePvVoltage = (pv1Voltage > 0 || pv2Voltage > 0) ? Math.max(pv1Voltage, pv2Voltage) : 0;
  const totalPvCurrent = effectivePvVoltage > 0 ? parseFloat((totalPvPower / effectivePvVoltage).toFixed(1)) : 0.0;

  const pv = {
    v: effectivePvVoltage,
    i: totalPvCurrent,
    p: Math.round(totalPvPower),
    pv1Power: Math.round(pv1Power),
    pv2Power: Math.round(pv2Power),
    pv1Voltage,
    pv2Voltage
  };

  // 3. Battery Bank Availability & Voltage
  const batteryConnected = batteryPresent && (b.battery_qb !== false && b.battery_ocpd !== false);
  const batteryHealthy = batteryConnected && !f.battery_thermal && (input.batterySOC > 10);
  const batVoltage = batteryConnected ? (48.0 + (input.batterySOC / 100.0) * 5.6) : 0;

  // 4. Inverter Operating Condition & EPS Generation Capability
  // Inverter can operate ONLY IF at least one energy source is available:
  // (Grid connected via QG) OR (PV power > 20W) OR (Battery healthy)
  const pvAvailable = totalPvPower > 20;
  const inverterPowered = inverterGridAvailable || pvAvailable || batteryHealthy;

  // 5. Load Demands & SBY 3-Position Routing Logic
  let normalDemand = input.normalLoadPower || 0;
  let criticalDemand = epsBusPresent ? (input.criticalLoadPower || 0) : 0;
  if (epsBusPresent && f.eps_overload) {
    criticalDemand = 5600;
  }

  const qoClosed = b.qo_mcb !== false;
  // The RCD is both a manually-operable switch and a protective trip.
  const rcdOpen = (b.eps_rcd === false);
  const rcdTripped = f.ground_fault || rcdOpen;

  let epsPowered = false;
  let epsPower = 0;
  let bypassPower = 0;

  if (epsBusPresent && qoClosed && !rcdTripped) {
    if (input.sbyPosition === 'I') {
      // Source I: Inverter EPS Port (via QE MCB)
      const qeClosed = (b.qe_mcb !== false) && (b.eps_mcb !== false);
      const epsOverloadLimit = activeProfile?.systemRatings?.epsMaxOverloadPower_W ?? Math.round(maxInverterPower * 1.04);
      epsPowered = inverterPowered && qeClosed && (criticalDemand <= epsOverloadLimit);
      epsPower = epsPowered ? criticalDemand : 0;
    } else if (input.sbyPosition === 'II') {
      // Source II: Grid Bypass (via QBP MCB from BUS-G)
      const qbpClosed = b.qbp_mcb !== false;
      epsPowered = busGAlive && qbpClosed;
      epsPower = epsPowered ? criticalDemand : 0;
      bypassPower = epsPower; // Directly drawn from Grid
    } else {
      // Position 0: Fully isolated and de-energized
      epsPowered = false;
      epsPower = 0;
    }
  }

  const eps = {
    v: epsPowered ? nominalAcVoltage : 0,
    p: Math.round(epsPower),
    isPowered: epsPowered
  };

  // Normal Loads Status (fed from BUS-G via QN)
  const normalPowered = busGAlive && (b.qn_mcb !== false);
  const normalPower = normalPowered ? normalDemand : 0;
  const normalLoad = {
    p: Math.round(normalPower),
    isPowered: normalPowered
  };

  // 6. Battery Power Dispatch
  let batPower = 0; // Positive = Charging, Negative = Discharging
  const inverterEpsDemand = (input.sbyPosition === 'I') ? epsPower : 0;
  const totalLoadToInverter = inverterEpsDemand + (inverterGridAvailable ? normalPower : 0);

  if (!batteryPresent) {
    // Battery Bank bypassed cleanly via profile topology configuration
    batPower = 0;
  } else if (inverterPowered) {
    if (input.operatingMode === 'normal_day' && inverterGridAvailable) {
      if (totalPvPower >= totalLoadToInverter) {
        const surplus = totalPvPower - totalLoadToInverter;
        if (batteryHealthy && input.batterySOC < 100) {
          batPower = Math.min(2500, surplus);
        }
      } else {
        const deficit = totalLoadToInverter - totalPvPower;
        if (batteryHealthy && input.batterySOC > 15) {
          batPower = -Math.min(3500, deficit);
        }
      }
    } else if (input.operatingMode === 'evening_peak' && inverterGridAvailable) {
      if (batteryHealthy && input.batterySOC > 20) {
        batPower = -Math.min(4000, totalLoadToInverter);
      }
    } else if (!inverterGridAvailable || input.operatingMode === 'grid_outage') {
      // Islanding / Off-grid Mode
      if (totalPvPower >= epsPower) {
        const surplus = totalPvPower - epsPower;
        if (batteryHealthy && input.batterySOC < 98) {
          batPower = Math.min(2500, surplus);
        }
      } else {
        const deficit = epsPower - totalPvPower;
        if (batteryHealthy) {
          batPower = -deficit;
        } else {
          // Battery tripped/dead: collapse EPS
          eps.isPowered = false;
          eps.p = 0;
          eps.v = 0;
          epsPowered = false;
          epsPower = 0;
        }
      }
    } else if (input.operatingMode === 'night_charge' && inverterGridAvailable) {
      if (batteryHealthy && input.batterySOC < 100) {
        batPower = 2500;
      }
    }
  } else {
    // Total source loss: battery cannot charge or discharge
    batPower = 0;
  }

  const batCurrent = (batVoltage > 0 && Math.abs(batPower) > 0) ? (Math.abs(batPower) / batVoltage) : 0;
  const battery = {
    v: parseFloat(batVoltage.toFixed(1)),
    i: parseFloat(batCurrent.toFixed(1)),
    p: Math.round(batPower),
    soc: Math.round(input.batterySOC),
    capacity_Wh: batteryPresent ? batteryCapacity : 0,
    state: !batteryPresent ? 'عدم حضور باتری (پروفایل فاقد BESS)' : (!batteryConnected ? 'قطع فیزیکی (QB باز)' : (batPower > 50 ? 'در حال شارژ' : (batPower < -50 ? 'در حال دشارژ' : 'آماده‌به‌کار')))
  };

  // 7. Grid Power Exchange (Import / Export)
  // Node balance at BUS-G. The grid supplies the loads connected to BUS-G, minus
  // whatever the inverter exports into BUS-G. normalPower must appear exactly ONCE.
  // Note: inverterEpsDemand (not epsPower) — in bypass the grid feeds the critical
  // load directly via bypassPower, and the inverter serves nothing.
  let gridPower = 0;
  if (busGAlive) {
    const inverterNetExport = inverterGridAvailable
      ? (totalPvPower
         + (batPower < 0 ? -batPower : 0)   // discharging adds to the bus
         - (batPower > 0 ? batPower : 0)    // charging draws from the bus
         - inverterEpsDemand)               // EPS load the inverter itself serves
      : 0;
    gridPower = normalPower + bypassPower - inverterNetExport;
    if (f.ct_inverted) {
      gridPower = -gridPower;
    }
  }

  const grid = {
    v: gridVoltage,
    isBlackout: !busGAlive,
    p: Math.round(gridPower)
  };

  // 8. Inverter Overall Telemetry
  const invFreq = inverterGridAvailable ? 50.0 : (epsPowered && inverterPowered ? 50.0 : 0.0);
  const inverter = {
    pOut: Math.round(epsPower + (inverterGridAvailable && gridPower < 0 ? Math.abs(gridPower) : 0)),
    acRating_W: maxInverterPower,
    efficiency: inverterPowered ? 97.4 : 0.0,
    freq: invFreq,
    status: !inverterPowered ? 'خاموش / بدون منبع تغذیه' : (!inverterGridAvailable ? (epsPowered ? 'عملکرد جزیره‌ای (EPS)' : 'آماده‌باش جزیره') : 'سنکرون با شبکه')
  };

  return {
    pv,
    battery,
    inverter,
    grid,
    eps,
    normalLoad,
    _internals: {
      busGAlive,
      inverterGridAvailable,
      inverterPowered,
      pv1Healthy,
      pv2Healthy,
      pv1Power,
      pv2Power,
      batteryHealthy,
      batteryConnected,
      batPower,
      normalPowered,
      normalPower,
      bypassPower,
      epsPowered,
      epsPower,
      gridVoltage,
      pv1Capacity,
      pv2Capacity,
      maxInverterPower,
      batteryCapacity,
      nominalAcVoltage,
      batteryPresent,
      epsBusPresent
    }
  };
}

if (typeof window !== 'undefined') window.computePowerModel = computePowerModel;
if (typeof module !== 'undefined' && module.exports) module.exports = { computePowerModel };
