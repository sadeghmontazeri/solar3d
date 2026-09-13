/**
 * Pure power-balance model. No DOM, no globals, no side effects.
 * Extracted verbatim from app.js computeElectricalState() — behaviour must not change.
 */
function computePowerModel(input) {
  const f = input.failures || {};
  const b = input.breakers || {};

  // 1. Grid Availability & Bus-G
  // Q0 protects incoming utility service entrance
  const utilityPhysicalAvailable = !f.grid_blackout;
  const q0Closed = (b.q0_mcb !== false) && (b.grid_mcb !== false);
  const busGAlive = utilityPhysicalAvailable && q0Closed;
  const gridVoltage = busGAlive ? (f.grid_brownout ? 165 : 230) : 0;

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
    pv1Power = Math.max(0, 2800 * irrFactor * tempFactor * 0.96);
    pv1Voltage = Math.round(385 * (1.0 - 0.0028 * (input.temperature - 25)));
  }

  // String 2: DC Isolator 2 + Fuses
  const pv2Healthy = (b.dc_iso_2 !== false) && !f.dc_arc_fault && !f.blown_pv_fuse && !f.surge_overvoltage;
  let pv2Power = 0;
  let pv2Voltage = 0;
  if (pv2Healthy && input.irradiance > 0) {
    const tempFactor = 1.0 + (-0.0038 * (input.temperature - 25));
    const irrFactor = input.irradiance / 1000.0;
    pv2Power = Math.max(0, 2800 * irrFactor * tempFactor * 0.96);
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
  const batteryConnected = (b.battery_qb !== false && b.battery_ocpd !== false);
  const batteryHealthy = batteryConnected && !f.battery_thermal && (input.batterySOC > 10);
  const batVoltage = batteryConnected ? (48.0 + (input.batterySOC / 100.0) * 5.6) : 0;

  // 4. Inverter Operating Condition & EPS Generation Capability
  // Inverter can operate ONLY IF at least one energy source is available:
  // (Grid connected via QG) OR (PV power > 20W) OR (Battery healthy)
  const pvAvailable = totalPvPower > 20;
  const inverterPowered = inverterGridAvailable || pvAvailable || batteryHealthy;

  // 5. Load Demands & SBY 3-Position Routing Logic
  let normalDemand = input.normalLoadPower || 0;
  let criticalDemand = input.criticalLoadPower || 0;
  if (f.eps_overload) {
    criticalDemand = 5600;
  }

  const qoClosed = b.qo_mcb !== false;
  const rcdTripped = f.ground_fault;

  let epsPowered = false;
  let epsPower = 0;
  let bypassPower = 0;

  if (qoClosed && !rcdTripped) {
    if (input.sbyPosition === 'I') {
      // Source I: Inverter EPS Port (via QE MCB)
      const qeClosed = (b.qe_mcb !== false) && (b.eps_mcb !== false);
      epsPowered = inverterPowered && qeClosed && (criticalDemand <= 5200);
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
    v: epsPowered ? 230 : 0,
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

  if (inverterPowered) {
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
    state: !batteryConnected ? 'قطع فیزیکی (QB باز)' : (batPower > 50 ? 'در حال شارژ' : (batPower < -50 ? 'در حال دشارژ' : 'آماده‌به‌کار'))
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
      gridVoltage
    }
  };
}

if (typeof window !== 'undefined') window.computePowerModel = computePowerModel;
if (typeof module !== 'undefined' && module.exports) module.exports = { computePowerModel };
