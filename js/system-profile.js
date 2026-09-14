/**
 * ==============================================================================
 * SystemProfile Contract & Canonical Reference Specification
 * Phase 7: Multi-System Architecture (PLAN.md §7.3, Step 15a)
 * 
 * Provides an immutable, typed data contract defining the 4 decoupled domains:
 *   1. Equipment & Capabilities (ratings, voltages, limits, port types)
 *   2. Electrical Connectivity & Nodes (BUS-G, DC bus, EPS bus, PE / earthing)
 *   3. 3D Display Layout & Enclosures (cabinet positions, dimensions, mounting)
 *   4. SLD Mapping & Telemetry Anchors (SVG symbols <-> internal telemetry IDs)
 * 
 * Includes the canonical 5 kW single-phase hybrid reference profile:
 *   `profile-hyb-1p-5kw-v1`
 * 
 * PURE DATA CONTRACT: Zero runtime side effects. No DOM manipulation on load.
 * Compatible with Browser (`window.SystemProfiles`) and Node (`module.exports`).
 * ==============================================================================
 */

(function () {
  'use strict';

  // ============================================================================
  // 1. SCHEMA DEFINITION & VALIDATOR CONTRACT
  // ============================================================================

  const SystemProfileSchema = Object.freeze({
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'SystemProfile',
    description: 'Universal System Profile contract decoupling equipment, electrical topology, 3D presentation, and schematic telemetry.',
    version: '1.0.0',
    requiredFields: [
      'id',
      'name',
      'version',
      'familyId',
      'family',
      'status',
      'sldRef',
      'systemRatings',
      'equipment',
      'connectivity',
      'layout3D',
      'sldMapping'
    ],
    allowedFamilies: [
      '1p-hybrid',
      '1p-ongrid',
      '1p-offgrid',
      '3p-hybrid',
      '3p-ongrid',
      '3p-offgrid'
    ],
    allowedStatuses: [
      'active',
      'awaiting_sld',
      'draft',
      'validated'
    ]
  });

  /**
   * Comprehensive runtime validator for SystemProfile objects
   * @param {Object} profile - SystemProfile instance
   * @returns {{ valid: boolean, errors: string[] }}
   */
  function validateSystemProfile(profile) {
    const errors = [];

    if (!profile || typeof profile !== 'object') {
      return { valid: false, errors: ['Profile must be a non-null object'] };
    }

    // Header validation
    for (const f of SystemProfileSchema.requiredFields) {
      if (profile[f] === undefined || profile[f] === null) {
        errors.push(`Missing required top-level property: "${f}"`);
      }
    }

    if (profile.familyId && !SystemProfileSchema.allowedFamilies.includes(profile.familyId)) {
      errors.push(`Invalid familyId "${profile.familyId}". Allowed: ${SystemProfileSchema.allowedFamilies.join(', ')}`);
    }

    if (profile.status && !SystemProfileSchema.allowedStatuses.includes(profile.status)) {
      errors.push(`Invalid status "${profile.status}". Allowed: ${SystemProfileSchema.allowedStatuses.join(', ')}`);
    }

    // Family specification validation
    if (profile.family) {
      const { phaseCount, phases, topology } = profile.family;
      if (![1, 3].includes(phaseCount)) {
        errors.push(`family.phaseCount must be 1 or 3, got: ${phaseCount}`);
      }
      if (!Array.isArray(phases) || phases.length !== phaseCount) {
        errors.push(`family.phases must be an array of length ${phaseCount}`);
      }
      if (!['hybrid', 'on-grid', 'off-grid'].includes(topology)) {
        errors.push(`family.topology must be hybrid, on-grid, or off-grid; got: "${topology}"`);
      }
    }

    // SLD Reference validation
    if (profile.sldRef) {
      if (!profile.sldRef.drawingId || typeof profile.sldRef.drawingId !== 'string') {
        errors.push('sldRef.drawingId must be a valid string');
      }
      if (!profile.sldRef.revision || typeof profile.sldRef.revision !== 'string') {
        errors.push('sldRef.revision must be a valid string');
      }
    }

    // Domain 1: Equipment
    if (profile.equipment && typeof profile.equipment === 'object') {
      if (!profile.equipment.inverter) {
        errors.push('Domain 1 (equipment) must contain an "inverter" definition');
      }
    } else {
      errors.push('Domain 1 (equipment) must be an object');
    }

    // Domain 2: Connectivity
    if (profile.connectivity && typeof profile.connectivity === 'object') {
      if (!profile.connectivity.buses || typeof profile.connectivity.buses !== 'object') {
        errors.push('Domain 2 (connectivity) must specify "buses" object');
      }
      if (!profile.connectivity.circuits || typeof profile.connectivity.circuits !== 'object') {
        errors.push('Domain 2 (connectivity) must specify "circuits" object');
      }
    } else {
      errors.push('Domain 2 (connectivity) must be an object');
    }

    // Domain 3: 3D Layout
    if (profile.layout3D && typeof profile.layout3D === 'object') {
      if (!profile.layout3D.enclosures || typeof profile.layout3D.enclosures !== 'object') {
        errors.push('Domain 3 (layout3D) must specify "enclosures" object');
      }
    } else {
      errors.push('Domain 3 (layout3D) must be an object');
    }

    // Domain 4: SLD Mapping
    if (profile.sldMapping && typeof profile.sldMapping === 'object') {
      if (!profile.sldMapping.symbolMapping || typeof profile.sldMapping.symbolMapping !== 'object') {
        errors.push('Domain 4 (sldMapping) must specify "symbolMapping" dictionary');
      }
    } else {
      errors.push('Domain 4 (sldMapping) must be an object');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // ============================================================================
  // 2. CANONICAL REFERENCE PROFILE: profile-hyb-1p-5kw-v1
  // ============================================================================

  const canonicalProfileHyb1p5kwV1 = Object.freeze({
    // Identity & Meta
    id: 'profile-hyb-1p-5kw-v1',
    name: 'سامانه خورشیدی هیبرید ۵ کیلووات تک‌فاز با ذخیره‌ساز باتری',
    nameEn: '5kW Single-Phase Hybrid PV System with Battery Storage',
    version: '1.0.0',
    schemaVersion: '1.0.0',
    familyId: '1p-hybrid',
    description: 'سامانه استاندارد هیبرید تک‌فاز ۵kW منطبق با SLD-01 و مشخصات کاتالوگی فعلی شبیه‌ساز',

    // Family Architecture
    family: {
      familyId: '1p-hybrid',
      familyNameFa: 'هیبرید تک‌فاز (تا ۱۰ کیلووات)',
      familyNameEn: 'Single-Phase Hybrid (up to 10kW)',
      phaseCount: 1,
      phases: ['L1'],
      neutralPresent: true,
      pePresent: true,
      topology: 'hybrid',
      earthingSystem: 'TN-S' // Central MET bonding with dedicated PE and N separation
    },

    // Validation & SLD Linkage
    status: 'active',
    sldRef: {
      drawingId: 'SLD-01',
      titleFa: 'نقشه تک‌خطی تک‌فاز ۵kW (SLD-01)',
      standard: 'HYB-FA-001',
      revision: 'Rev B',
      date: '2026-09-13',
      requiresOwnerRedraw: false
    },

    // System Power & Electrical Limits (Strictly with Units)
    systemRatings: {
      // AC Grid Port
      acRatedPower_W: 5000,
      acMaxApparentPower_VA: 5500,
      acNominalVoltage_V: 230,
      acVoltageRange_V: { min: 184, max: 253 }, // -20% / +10%
      acNominalFrequency_Hz: 50.0,
      acFrequencyRange_Hz: { min: 47.5, max: 51.5 },
      acRatedCurrent_A: 21.7,
      acMaxCurrent_A: 24.0,

      // DC PV Array (Dual String)
      dcRatedTotalPower_W: 5600, // 2 strings x 2800W
      dcStringCount: 2,
      dcString1RatedPower_W: 2800,
      dcString2RatedPower_W: 2800,
      dcStringNominalVoc_V: 385,
      dcStringNominalVmp_V: 315,
      dcMpptVoltageRange_V: { min: 125, max: 500 },
      dcMaxInputVoltage_V: 550,
      dcMaxMpptCurrent_A: 15.0,
      dcTempCoeffP_pctPerC: -0.38,
      dcTempCoeffV_pctPerC: -0.28,

      // Battery Storage System (BESS)
      batteryPresent: true,
      batteryType: 'LiFePO4',
      batteryNominalVoltage_V: 51.2,
      batteryWorkingVoltageRange_V: { min: 48.0, max: 57.6 },
      batteryNominalCapacity_Ah: 100,
      batteryNominalCapacity_Wh: 5120,
      batteryMaxChargePower_W: 2500,
      batteryMaxDischargePower_W: 4000,
      batteryMaxContinuousCurrent_A: 100,
      batteryMinSOC_pct: 10,
      batteryReserveSOC_pct: 15,

      // EPS Backup Port
      epsRatedPower_W: 5000,
      epsMaxOverloadPower_W: 5200, // Threshold above which EPS trips
      epsNominalVoltage_V: 230,
      epsNominalFrequency_Hz: 50.0,
      epsTransferTime_ms: 10,
      epsRcdSensitivity_mA: 30,

      // Inverter Internal Dynamics
      inverterPeakEfficiency_pct: 97.4,
      inverterStandbyLoss_W: 25
    },

    // ==========================================================================
    // DOMAIN 1: EQUIPMENT & CAPABILITIES
    // Physical catalogue ratings, operating limits, port types, internal switchgear
    // ==========================================================================
    equipment: {
      // 1.1 PV Array Strings
      pvArray: {
        id: 'pv_array',
        nameFa: 'آرایه فتوولتائیک پشت‌بام (۱۲ پنل، ۲ استرینگ)',
        nameEn: 'Rooftop PV Array (12 Half-Cut Modules, 2 Strings)',
        type: 'solar_array',
        presence: true,
        manufacturer: 'Tier-1 Mono-PERC',
        moduleSpec: {
          model: 'Half-Cut 415W Mono-PERC 12BB',
          pMax_W: 415,
          vOc_V: 49.2,
          vMp_V: 41.5,
          iSc_A: 10.8,
          iMp_A: 10.0,
          efficiency_pct: 21.2
        },
        strings: [
          {
            id: 'string_1',
            nameFa: 'استرینگ خورشیدی شماره ۱',
            modulesCount: 6,
            ratedPower_W: 2800,
            nominalVoc_V: 385,
            nominalVmp_V: 315,
            ports: {
              dcPositive: { id: 'PORT_PV1_POS', type: 'dc', polarity: '+', maxV: 500, maxI: 15 },
              dcNegative: { id: 'PORT_PV1_NEG', type: 'dc', polarity: '-', maxV: 500, maxI: 15 },
              frameEarth: { id: 'PORT_PV1_PE', type: 'pe', maxI: 200 }
            }
          },
          {
            id: 'string_2',
            nameFa: 'استرینگ خورشیدی شماره ۲',
            modulesCount: 6,
            ratedPower_W: 2800,
            nominalVoc_V: 385,
            nominalVmp_V: 315,
            ports: {
              dcPositive: { id: 'PORT_PV2_POS', type: 'dc', polarity: '+', maxV: 500, maxI: 15 },
              dcNegative: { id: 'PORT_PV2_NEG', type: 'dc', polarity: '-', maxV: 500, maxI: 15 },
              frameEarth: { id: 'PORT_PV2_PE', type: 'pe', maxI: 200 }
            }
          }
        ]
      },

      // 1.2 DC Protection Combiner Box
      dcCombinerBox: {
        id: 'dc_combiner_box',
        nameFa: 'تابلوی حفاظت و ترکیب‌کننده DC خورشیدی (IP65)',
        nameEn: 'DC Protection Combiner Box (IP65)',
        type: 'combiner_box',
        presence: true,
        enclosure: {
          rating: 'IP65',
          material: 'Polycarbonate with transparent smoke cover',
          dimensions_m: { width: 0.90, height: 1.05, depth: 0.24 }
        },
        subcomponents: {
          fuses: [
            { id: 'FPV1_POS', name: 'gPV Fuse String 1 (+)', rating_A: 15, voltage_V: 1000, curve: 'gPV' },
            { id: 'FPV1_NEG', name: 'gPV Fuse String 1 (-)', rating_A: 15, voltage_V: 1000, curve: 'gPV' },
            { id: 'FPV2_POS', name: 'gPV Fuse String 2 (+)', rating_A: 15, voltage_V: 1000, curve: 'gPV' },
            { id: 'FPV2_NEG', name: 'gPV Fuse String 2 (-)', rating_A: 15, voltage_V: 1000, curve: 'gPV' }
          ],
          isolators: [
            {
              id: 'QPV1',
              internalSwitchId: 'dc_iso_1',
              nameFa: 'کلید ایزولاتور DC استرینگ ۱ (DC-PV2)',
              poles: 2,
              rating_A: 32,
              voltage_V: 1000,
              standard: 'IEC 60947-3 DC-PV2'
            },
            {
              id: 'QPV2',
              internalSwitchId: 'dc_iso_2',
              nameFa: 'کلید ایزولاتور DC استرینگ ۲ (DC-PV2)',
              poles: 2,
              rating_A: 32,
              voltage_V: 1000,
              standard: 'IEC 60947-3 DC-PV2'
            }
          ],
          spds: [
            {
              id: 'DC_SPD_1',
              name: 'DC Surge Protection Device (SPD 1)',
              type: 'Type 2',
              uc_V: 1000,
              in_kA: 20,
              imax_kA: 40,
              connection: 'Y-configuration (Positive, Negative, PE)'
            },
            {
              id: 'DC_SPD_2',
              name: 'DC Surge Protection Device (SPD 2)',
              type: 'Type 2',
              uc_V: 1000,
              in_kA: 20,
              imax_kA: 40,
              connection: 'Y-configuration (Positive, Negative, PE)'
            }
          ],
          peBusbar: {
            id: 'DC_PE_BAR',
            name: 'DC Combiner Protective Earth Busbar',
            material: 'Tin-plated brass / copper',
            connectionToMET: '16mm² Cu PE lead'
          }
        }
      },

      // 1.3 Hybrid Inverter
      inverter: {
        id: 'hybrid_inverter',
        nameFa: 'اینورتر هایبرید ۵ کیلووات تک‌فاز (Dual MPPT)',
        nameEn: '5kW Single-Phase Hybrid Inverter (Dual MPPT)',
        type: 'hybrid_inverter',
        presence: true,
        ratedContinuousPower_W: 5000,
        mpptTrackers: 2,
        internalArchitecture: {
          mppt1: { id: 'INV_MPPT1', vMin_V: 125, vMax_V: 500, maxI_A: 15 },
          mppt2: { id: 'INV_MPPT2', vMin_V: 125, vMax_V: 500, maxI_A: 15 },
          dcLinkBus: { id: 'INV_DC_BUS', nominalV_V: 400 },
          bidirectionalDcDc: { id: 'INV_DCDC_BAT', vNominal_V: 48, maxCurrent_A: 100, pMax_W: 4000 },
          fullBridgeSpwm: { id: 'INV_SPWM_BRIDGE', acRatedV_V: 230, pMax_W: 5000 },
          antiIslandingRelay: { id: 'KSEP', name: 'Anti-Islanding Grid Disconnect Relay', tripTime_ms: 20 },
          neutralEarthBondRelay: { id: 'KNE', name: 'Off-grid N-PE Bonding Contactor', normClosedOffgrid: true },
          rcmu: { id: 'RCMU', name: 'Residual Current Monitoring Unit', iDeltaN_mA: 30 }
        },
        ports: {
          pv1Input: { id: 'PORT_INV_PV1', type: 'dc', terminals: ['PV1+', 'PV1-'] },
          pv2Input: { id: 'PORT_INV_PV2', type: 'dc', terminals: ['PV2+', 'PV2-'] },
          batteryPort: { id: 'PORT_INV_BAT', type: 'dc', terminals: ['BAT+', 'BAT-'], vNominal: 48 },
          gridPort: { id: 'PORT_INV_GRID', type: 'ac', terminals: ['L_GRID', 'N_GRID', 'PE_GRID'] },
          epsPort: { id: 'PORT_INV_EPS', type: 'ac', terminals: ['L_EPS', 'N_EPS', 'PE_EPS'] },
          commsBms: { id: 'PORT_INV_CAN', type: 'signal', protocol: 'CAN/RS485' },
          commsMeter: { id: 'PORT_INV_METER', type: 'signal', protocol: 'RS485-Modbus' }
        }
      },

      // 1.4 Battery Energy Storage Rack
      batteryStorage: {
        id: 'battery_storage',
        nameFa: 'بانک ذخیره‌ساز لیتیوم آهن فسفات (LiFePO4 BESS)',
        nameEn: 'LiFePO4 Battery Energy Storage System (BESS)',
        type: 'battery_storage',
        presence: true,
        chemistry: 'LiFePO4 (16S Prismatics)',
        modulesCount: 2,
        moduleSpec: {
          voltage_V: 51.2,
          capacity_Ah: 50,
          energy_Wh: 2560
        },
        bankRatings: {
          voltageNominal_V: 51.2,
          voltageFloat_V: 54.4,
          capacityTotal_Ah: 100,
          energyTotal_Wh: 5120,
          maxContinuousDischarge_A: 100,
          maxChargePower_W: 2500,
          maxDischargePower_W: 4000
        },
        bms: {
          cellBalancing: 'Active smart balancing',
          overvoltageCutoff_V: 57.6,
          undervoltageCutoff_V: 44.0,
          thermalProtection_C: 55,
          telemetryBus: 'CAN 2.0B / RS485'
        }
      },

      // 1.5 External Battery OCPD & Disconnect Enclosure
      batteryDisconnect: {
        id: 'battery_disconnect',
        nameFa: 'کلید و فیوز حفاظت اضافه جریان باتری (QB)',
        nameEn: 'Battery Overcurrent Protection & Disconnect (QB)',
        type: 'disconnect_switch',
        presence: true,
        subcomponents: {
          mcb: {
            id: 'BAT_QB',
            internalSwitchId: 'battery_qb',
            name: '2P DC Circuit Breaker / Disconnect (QB)',
            rating_A: 125,
            breakingCapacity_kA: 10,
            voltage_V: 80,
            prechargeIntegrated: true
          }
        }
      },

      // 1.6 Main Earthing Terminal (MET)
      earthingMet: {
        id: 'earthing_met',
        nameFa: 'شین اصلی ارت زمین (MET)',
        nameEn: 'Main Earthing Terminal (MET) Solid Copper Busbar',
        type: 'grounding_terminal',
        presence: true,
        material: 'Solid electrolytic copper 50x5mm',
        electrodeResistance_Ohm: 2.0,
        bondingTerminals: [
          'Earth Electrode Rod (16mm²)',
          'PV Frame Earth (16mm²)',
          'DC Box PE (16mm²)',
          'Inverter PE (6mm²)',
          'Battery Frame PE (16mm²)',
          'MDB PE Busbar (16mm²)',
          'EPS PE Busbar (10mm²)'
        ]
      },

      // 1.7 Main AC Distribution Board (MDB)
      mainDistributionBoard: {
        id: 'main_distribution_board',
        nameFa: 'تابلو توزیع اصلی AC و مبادله با شبکه (MDB)',
        nameEn: 'Main AC Distribution Board (MDB)',
        type: 'distribution_board',
        presence: true,
        enclosure: {
          rating: 'IP40 / IK08',
          material: 'Industrial sheet steel with smoked polycarbonate door',
          dimensions_m: { width: 0.60, height: 0.80, depth: 0.22 }
        },
        subcomponents: {
          q0Mcb: {
            id: 'Q0',
            internalSwitchId: 'q0_mcb',
            nameFa: 'کلید مینیاتوری ورودی اصلی شبکه (Q0)',
            poles: 2,
            rating_A: 40,
            curve: 'C',
            breakingCapacity_kA: 10
          },
          smartMeter: {
            id: 'SMART_METER',
            model: 'Easton SDM230-Modbus Bi-Directional',
            accuracyClass: 1.0,
            comms: 'RS485 Modbus RTU'
          },
          ctSensor: {
            id: 'CT_SENSOR',
            name: 'Split-Core Current Transformer',
            ratio: '100A / 33.3mA',
            clampedConductor: 'Incoming Grid Phase L'
          },
          qgMcb: {
            id: 'QG',
            internalSwitchId: 'qg_mcb',
            nameFa: 'کلید مینیاتوری فیدر پورت شبکه اینورتر (QG)',
            poles: 2,
            rating_A: 25,
            curve: 'C',
            breakingCapacity_kA: 6
          },
          qbpMcb: {
            id: 'QBP',
            internalSwitchId: 'qbp_mcb',
            nameFa: 'کلید مینیاتوری مسیر بای‌پاس دستی شبکه (QBP)',
            poles: 2,
            rating_A: 25,
            curve: 'C',
            breakingCapacity_kA: 6
          },
          qnMcb: {
            id: 'QN',
            internalSwitchId: 'qn_mcb',
            nameFa: 'کلید مینیاتوری بارهای عادی خانگی (QN)',
            poles: 2,
            rating_A: 25,
            curve: 'C',
            breakingCapacity_kA: 6
          },
          fspdMcb: {
            id: 'FSPD',
            internalSwitchId: 'fspd_mcb',
            nameFa: 'فیوز مینیاتوری حفاظت سرج ارستر AC',
            poles: 2,
            rating_A: 25,
            curve: 'C'
          },
          acSpd: {
            id: 'AC_SPD',
            name: 'AC Surge Protection Device',
            type: 'Type 2',
            uc_V: 275,
            in_kA: 20,
            imax_kA: 40,
            leadLengthToMet_m: 0.35 // < 0.5m compliance
          },
          busG: {
            id: 'BUS_G',
            nameFa: 'شینه توزیع اصلی شبکه (BUS-G)',
            poles: 2,
            nominalV_V: 230,
            rating_A: 63
          }
        }
      },

      // 1.8 EPS Critical Loads Distribution Board
      epsDistributionBoard: {
        id: 'eps_distribution_board',
        nameFa: 'تابلو بارهای بحرانی و پشتیبان اضطراری (EPS Panel)',
        nameEn: 'Emergency Power Supply (EPS) Distribution Board',
        type: 'distribution_board',
        presence: true,
        enclosure: {
          rating: 'IP40 / IK08',
          material: 'Sheet steel with violet identification banner',
          dimensions_m: { width: 0.50, height: 0.80, depth: 0.22 }
        },
        subcomponents: {
          qeMcb: {
            id: 'QE',
            internalSwitchId: 'qe_mcb',
            nameFa: 'کلید مینیاتوری ورودی از پورت EPS اینورتر (QE)',
            poles: 2,
            rating_A: 25,
            curve: 'C',
            breakingCapacity_kA: 6
          },
          sbyChangeover: {
            id: 'SBY',
            internalSwitchId: 'sby_switch',
            nameFa: 'کلید گردان ۳ حالته تبدیل دستی (SBY)',
            type: 'rotary_manual_changeover',
            breakBeforeMake: true,
            positions: ['I', '0', 'II'],
            positionDefinitions: {
              'I': 'منبع ۱: پورت EPS اینورتر (Inverter Backed)',
              '0': 'خاموش / کاملاً ایزوله (Off/Isolated)',
              'II': 'منبع ۲: بای‌پاس مستقیم شبکه (Grid Bypass)'
            },
            poles: 2,
            rating_A: 40,
            standard: 'IEC 60947-6-1'
          },
          qoMcb: {
            id: 'QO',
            internalSwitchId: 'qo_mcb',
            nameFa: 'کلید ورودی اصلی به شینه بارهای بحرانی (QO)',
            poles: 2,
            rating_A: 25,
            curve: 'C',
            breakingCapacity_kA: 6
          },
          epsRcd: {
            id: 'EPS_RCD',
            internalSwitchId: 'eps_rcd',
            nameFa: 'کلید محافظ جان خطای زمین بارهای بحرانی (RCD/RCBO)',
            poles: 2,
            rating_A: 25,
            sensitivity_mA: 30,
            type: 'Type A'
          },
          epsBus: {
            id: 'BUS_EPS',
            nameFa: 'شینه بارهای اضطراری',
            nominalV_V: 230,
            rating_A: 40
          },
          isolatedNeutralBar: {
            id: 'EPS_N_BAR',
            nameFa: 'شینه نول اختصاصی کاملاً ایزوله N-EPS',
            isolation: 'Galvanically isolated from grid neutral in island mode'
          }
        }
      },

      // 1.9 Utility Service Entrance
      utilityService: {
        id: 'utility_service',
        nameFa: 'انشعاب شبکه توزیع برق منطقه‌ای',
        nameEn: 'Regional Utility Service Cutout & Incomer',
        type: 'utility_service',
        presence: true,
        phaseCount: 1,
        nominalVoltage_V: 230,
        serviceFuseRating_A: 100
      },

      // 1.10 Load Clusters
      nonCriticalLoads: {
        id: 'non_critical_loads',
        nameFa: 'بارهای عادی خانه (تهویه، شارژر، آبگرمکن)',
        nameEn: 'Non-Critical House Loads (HVAC, EVSE, Heaters)',
        type: 'load_cluster',
        presence: true,
        sheddableDuringBlackout: true,
        nominalPower_W: 2200
      },
      criticalLoads: {
        id: 'critical_loads',
        nameFa: 'بارهای بحرانی و بدون وقفه (روشنایی، یخچال، مودم، سرور)',
        nameEn: 'Critical Uninterruptible Loads (Lighting, Fridge, Router, IT)',
        type: 'load_cluster',
        presence: true,
        sheddableDuringBlackout: false,
        nominalPower_W: 1500,
        maxPermittedPower_W: 5200
      }
    },

    // ==========================================================================
    // DOMAIN 2: ELECTRICAL CONNECTIVITY & NODES
    // Network of buses, circuits, interlocks, and protection loops
    // ==========================================================================
    connectivity: {
      // 2.1 Major Electrical Buses
      buses: {
        'BUS-G': {
          id: 'BUS-G',
          nameFa: 'شینه توزیع شبکه AC تابلوی اصلی',
          voltageNominal_V: 230,
          currentRating_A: 63,
          phases: ['L1'],
          hasNeutral: true,
          liveWhen: 'grid_available AND q0_closed',
          fedBy: ['utility_incomer', 'inverter_grid_feed']
        },
        'DC-BUS': {
          id: 'DC-BUS',
          nameFa: 'باس DC داخلی اینورتر',
          voltageNominal_V: 400,
          liveWhen: 'pv_power > 20W OR battery_healthy OR grid_available',
          fedBy: ['mppt1', 'mppt2', 'dcdc_battery', 'ac_grid_rectifier']
        },
        'BUS-EPS': {
          id: 'BUS-EPS',
          nameFa: 'شینه تغذیه بارهای بحرانی',
          voltageNominal_V: 230,
          currentRating_A: 40,
          liveWhen: '(sbyPosition === "I" AND inverter_eps_powered) OR (sbyPosition === "II" AND bus_g_alive)',
          fedBy: ['inverter_eps_port', 'grid_bypass_feed']
        },
        'MET': {
          id: 'MET',
          nameFa: 'شینه هم‌بندی اصلی ارت زمین (MET)',
          voltageNominal_V: 0,
          equipotential: true,
          groundElectrodeResistance_Ohm: 2.0
        }
      },

      // 2.2 Functional Circuits & Wiring Pathways
      circuits: {
        pv1_dc_string: {
          id: 'circ_pv1_dc',
          name: 'PV String 1 DC Loop',
          from: 'pvArray.strings[0]',
          to: 'inverter.ports.pv1Input',
          via: ['dcCombinerBox.subcomponents.fuses[0,1]', 'dcCombinerBox.subcomponents.isolators[0]'],
          ratedCurrent_A: 15,
          ratedCapacity_W: 2800,
          conductorSpec: '4mm² Solar PV H1Z2Z2-K'
        },
        pv2_dc_string: {
          id: 'circ_pv2_dc',
          name: 'PV String 2 DC Loop',
          from: 'pvArray.strings[1]',
          to: 'inverter.ports.pv2Input',
          via: ['dcCombinerBox.subcomponents.fuses[2,3]', 'dcCombinerBox.subcomponents.isolators[1]'],
          ratedCurrent_A: 15,
          ratedCapacity_W: 2800,
          conductorSpec: '4mm² Solar PV H1Z2Z2-K'
        },
        battery_dc_feeder: {
          id: 'circ_bat_dc',
          name: 'Battery DC Storage Feeder',
          from: 'batteryStorage',
          to: 'inverter.ports.batteryPort',
          via: ['batteryDisconnect.subcomponents.mcb'],
          ratedCurrent_A: 100,
          ratedCapacity_W: 4000,
          conductorSpec: '35mm² Flexible Copper'
        },
        utility_service_incomer: {
          id: 'circ_utility_in',
          name: 'Utility PCC Service Incomer',
          from: 'utilityService',
          to: 'buses.BUS-G',
          via: ['smartMeter', 'q0Mcb', 'ctSensor'],
          ratedCurrent_A: 40,
          ratedCapacity_W: 9200,
          conductorSpec: '3x10mm² NYM-J'
        },
        inverter_grid_coupling: {
          id: 'circ_inverter_grid',
          name: 'Inverter AC Grid Port Coupling',
          from: 'inverter.ports.gridPort',
          to: 'buses.BUS-G',
          via: ['qgMcb'],
          ratedCurrent_A: 25,
          ratedCapacity_W: 5000,
          conductorSpec: '3x6mm² Cu PVC'
        },
        grid_bypass_feeder: {
          id: 'circ_bypass',
          name: 'Manual Grid Bypass Feeder to SBY',
          from: 'buses.BUS-G',
          to: 'epsDistributionBoard.subcomponents.sbyChangeover.positionDefinitions.II',
          via: ['qbpMcb'],
          ratedCurrent_A: 25,
          ratedCapacity_W: 5500,
          conductorSpec: '3x6mm² Cu PVC'
        },
        inverter_eps_feeder: {
          id: 'circ_eps_incomer',
          name: 'Inverter EPS Port Feeder to SBY',
          from: 'inverter.ports.epsPort',
          to: 'epsDistributionBoard.subcomponents.sbyChangeover.positionDefinitions.I',
          via: ['qeMcb'],
          ratedCurrent_A: 25,
          ratedCapacity_W: 5000,
          conductorSpec: '3x6mm² Cu PVC'
        },
        critical_loads_feeder: {
          id: 'circ_critical_load',
          name: 'Critical Loads Sub-feeder',
          from: 'epsDistributionBoard.subcomponents.sbyChangeover.commonOutput',
          to: 'criticalLoads',
          via: ['qoMcb', 'epsRcd'],
          ratedCurrent_A: 25,
          ratedCapacity_W: 5200,
          conductorSpec: '3x4mm² Cu PVC'
        },
        non_critical_loads_feeder: {
          id: 'circ_non_critical',
          name: 'Non-Critical Loads Feeder',
          from: 'buses.BUS-G',
          to: 'nonCriticalLoads',
          via: ['qnMcb'],
          ratedCurrent_A: 25,
          ratedCapacity_W: 5500,
          conductorSpec: '3x4mm² Cu PVC'
        },
        earthing_equipotential_network: {
          id: 'circ_earth',
          name: 'Main Earthing & Equipotential Bonding Network',
          from: 'earthingMet',
          to: 'All equipment chassis, SPDs, and earth electrode',
          conductorSpec: '6mm² to 16mm² Green/Yellow Cu'
        }
      },

      // 2.3 Operating Interlocks & Safety Constraints
      interlocks: [
        {
          id: 'INTLK_SBY_BBM',
          name: 'SBY Break-Before-Make Mechanical Interlock',
          rule: 'Position I (Inverter EPS) and Position II (Grid Bypass) are mutually exclusive. Position 0 enforces galvanic dead-break gap.'
        },
        {
          id: 'INTLK_ANTI_ISLANDING_KSEP',
          name: 'Anti-Islanding Protection (IEC 62116 / VDE-AR-N 4105)',
          rule: 'Upon utility grid loss (grid_blackout), KSEP opens within 20ms to decouple the inverter grid port from BUS-G.'
        },
        {
          id: 'INTLK_NEUTRAL_EARTH_KNE',
          name: 'Islanding Neutral Grounding Bond (IEC 60364-7-712 / AS4777.2)',
          rule: 'In island mode (off-grid), KNE relay bonds N_EPS to PE to guarantee RCD operational earth fault loop.'
        }
      ]
    },

    // ==========================================================================
    // DOMAIN 3: 3D DISPLAY LAYOUT & ENCLOSURES
    // Technical room coordinates, physical enclosure dimensions, mounting types,
    // camera framing bounds, and 3D cable trajectories
    // ==========================================================================
    layout3D: {
      room: {
        width_m: 12.0,
        height_m: 5.0,
        depth_m: 8.0,
        concreteWallZ_m: -2.3,
        floorY_m: 0.0
      },

      // Enclosure Coordinates & Dimensions in Technical Room (Verbatim from scene-3d.js)
      enclosures: {
        rooftopPV: {
          id: 'ROOFTOP_PV',
          position: { x: 0.0, y: 5.2, z: 0.0 },
          mounting: 'roof_unislit_strut_tilt_30deg',
          interactiveMeshId: 'roofGroup',
          floatingLabelOffset: { x: 0.0, y: 1.2, z: 0.0 }
        },
        dcCombinerBox: {
          id: 'DC_BOX',
          position: { x: -3.2, y: 2.4, z: -2.2 },
          dimensions: { width: 0.90, height: 1.05, depth: 0.24 },
          mounting: 'wall_bracket_galvanized',
          door: { hinged: 'left', transparent: true, defaultOpen: false },
          interactiveMeshId: 'dcEnclosure',
          floatingLabelOffset: { x: 0.0, y: 0.65, z: 0.0 }
        },
        hybridInverter: {
          id: 'INVERTER',
          position: { x: -1.0, y: 2.5, z: -2.2 },
          dimensions: { width: 0.92, height: 1.25, depth: 0.26 },
          mounting: 'wall_cleat_bracket',
          features: ['rear_extruded_heatsinks', 'status_halo_led_ring', 'oled_screen_60fps'],
          interactiveMeshId: 'inverterBodyMesh',
          floatingLabelOffset: { x: 0.0, y: 0.85, z: 0.0 }
        },
        batteryRack: {
          id: 'BATTERY',
          position: { x: 1.2, y: 1.4, z: 0.6 },
          dimensions: { width: 0.90, height: 1.40, depth: 0.70 },
          mounting: 'floor_standing_heavy_rack',
          modulesCount: 2,
          interactiveMeshId: 'bessGroup',
          floatingLabelOffset: { x: 0.0, y: 1.05, z: 0.0 }
        },
        batteryDisconnectBox: {
          id: 'BAT_DISC_BOX',
          position: { x: 1.2, y: 2.6, z: -2.2 },
          dimensions: { width: 0.42, height: 0.58, depth: 0.18 },
          mounting: 'wall',
          interactiveMeshId: 'bat_breaker'
        },
        earthingMet: {
          id: 'EARTHING_MET',
          position: { x: -0.5, y: 0.4, z: -2.3 },
          dimensions: { width: 0.78, height: 0.07, depth: 0.015 },
          mounting: 'wall_insulating_polyester_standoffs',
          interactiveMeshId: 'metGroup',
          floatingLabelOffset: { x: 0.0, y: 0.25, z: 0.0 }
        },
        mainDistributionBoard: {
          id: 'MDB_GRID',
          position: { x: 3.05, y: 2.40, z: -2.20 },
          dimensions: { width: 0.60, height: 0.80, depth: 0.22 },
          mounting: 'wall_flush_industrial',
          door: { hinged: 'left', transparent: true, defaultOpen: false, hingeMeshId: 'mdbDoorHinge' },
          interactiveMeshId: 'mdbGroup',
          floatingLabelOffset: { x: 0.0, y: 0.48, z: 0.0 }
        },
        epsDistributionBoard: {
          id: 'EPS_BACKUP',
          position: { x: 4.05, y: 2.40, z: -2.20 },
          dimensions: { width: 0.50, height: 0.80, depth: 0.22 },
          mounting: 'wall_side_by_side_0.50m_spacing',
          door: { hinged: 'left', transparent: true, defaultOpen: false, hingeMeshId: 'epsDoorHinge' },
          interactiveMeshId: 'epsGroup',
          floatingLabelOffset: { x: 0.0, y: 0.48, z: 0.0 }
        },
        ctSensor: {
          id: 'CT_SENSING',
          position: { x: 3.2, y: 1.7, z: -2.12 },
          mounting: 'clamped_around_grid_incoming_conductor',
          interactiveMeshId: 'ctGroup',
          floatingLabelOffset: { x: 0.0, y: 0.22, z: 0.0 }
        },
        utilityCutout: {
          id: 'UTILITY_CUTOUT',
          position: { x: 3.2, y: 0.95, z: -2.2 },
          dimensions: { width: 0.48, height: 0.65, depth: 0.18 },
          mounting: 'wall_low'
        },
        nonCriticalLoadsBlock: {
          id: 'LOAD_NON_CRIT',
          position: { x: 5.5, y: 0.4, z: -1.0 },
          dimensions: { width: 0.65, height: 0.75, depth: 0.45 },
          mounting: 'floor'
        },
        criticalLoadsBlock: {
          id: 'LOAD_CRIT',
          position: { x: 5.5, y: 1.5, z: -1.0 },
          dimensions: { width: 0.65, height: 0.85, depth: 0.45 },
          mounting: 'wall'
        }
      },

      // Camera Framing & Viewpoint Bounds
      cameraFraming: {
        roomBounds: {
          min: { x: -4.5, y: 0.0, z: -2.5 },
          max: { x: 6.5, y: 6.0, z: 2.0 }
        },
        homePreset: {
          pos: { x: 0, y: 3.8, z: 6.8 },
          target: { x: 0, y: 2.3, z: -0.6 }
        },
        viewpointPresets: {
          OVERVIEW: { pos: { x: 0, y: 3.8, z: 6.8 }, target: { x: 0, y: 2.3, z: -0.6 } },
          ROOFTOP: { pos: { x: 0, y: 7.0, z: 3.8 }, target: { x: 0, y: 4.6, z: 0.4 } },
          DC_PROTECTION: { pos: { x: -3.2, y: 2.4, z: -0.85 }, target: { x: -3.2, y: 2.4, z: -2.2 } },
          INVERTER: { pos: { x: -1.0, y: 2.5, z: -0.5 }, target: { x: -1.0, y: 2.5, z: -2.2 } },
          INVERTER_XRAY: { pos: { x: -1.0, y: 2.5, z: -1.1 }, target: { x: -1.0, y: 2.5, z: -2.2 } },
          BATTERY: { pos: { x: 1.2, y: 1.4, z: 0.6 }, target: { x: 1.2, y: 1.0, z: -1.8 } },
          MDB_GRID: { pos: { x: 3.05, y: 2.40, z: -1.35 }, target: { x: 3.05, y: 2.40, z: -2.18 } },
          EPS_BACKUP: { pos: { x: 4.05, y: 2.40, z: -1.35 }, target: { x: 4.05, y: 2.40, z: -2.18 } },
          CT_SENSING: { pos: { x: 3.00, y: 2.46, z: -1.82 }, target: { x: 3.00, y: 2.46, z: -2.18 } },
          EARTHING_MET: { pos: { x: -0.5, y: 0.6, z: -1.0 }, target: { x: -0.5, y: 0.4, z: -2.3 } }
        }
      },

      // 3D Cable Trajectories & Particle Scaling Parameters (Mitigates V13)
      cabling3D: {
        pv1: {
          points: [[-2.2, 4.4, 0.0], [-3.2, 3.8, -1.8], [-3.2, 2.9, -2.18], [-3.4, 1.9, -2.18], [-2.2, 1.6, -2.18], [-1.35, 1.85, -2.2]],
          radius: 0.016,
          colorHex: 0xd97706,
          flowColorHex: 0xf59e0b,
          ratedCapacity_W: 2800
        },
        pv2: {
          points: [[2.2, 4.4, 0.0], [-0.5, 3.8, -1.8], [-3.0, 2.9, -2.18], [-3.1, 1.9, -2.18], [-2.0, 1.5, -2.18], [-1.25, 1.85, -2.2]],
          radius: 0.016,
          colorHex: 0xb45309,
          flowColorHex: 0xfbbf24,
          ratedCapacity_W: 2800
        },
        battery: {
          points: [[1.4, 0.9, -1.5], [1.2, 1.8, -2.18], [1.2, 2.3, -2.18], [1.2, 2.9, -2.18], [0.1, 2.0, -2.18], [-0.85, 1.85, -2.2]],
          radius: 0.024,
          colorHex: 0x059669,
          flowColorHex: 0x34d399,
          ratedCapacity_W: 4000
        },
        grid_in: {
          points: [[3.2, 0.6, -2.2], [3.2, 1.3, -2.15], [3.05, 1.65, -2.18], [2.88, 2.0, -2.20]],
          radius: 0.022,
          colorHex: 0x854d0e,
          flowColorHex: 0x60a5fa,
          ratedCapacity_W: 9200
        },
        inv_grid: {
          points: [[-0.75, 1.85, -2.2], [0.5, 1.5, -2.18], [2.5, 1.5, -2.18], [2.98, 2.0, -2.20]],
          radius: 0.020,
          colorHex: 0x2563eb,
          flowColorHex: 0x38bdf8,
          ratedCapacity_W: 5000
        },
        load_non_critical: {
          points: [[3.28, 2.0, -2.20], [3.6, 1.7, -2.18], [4.5, 1.2, -1.8], [5.2, 0.5, -1.0]],
          radius: 0.016,
          colorHex: 0x475569,
          flowColorHex: 0x94a3b8,
          ratedCapacity_W: 5500
        },
        inv_eps: {
          points: [[-0.65, 1.85, -2.2], [0.8, 1.35, -2.18], [3.4, 1.35, -2.18], [3.92, 2.0, -2.20]],
          radius: 0.018,
          colorHex: 0x7c3aed,
          flowColorHex: 0xc084fc,
          ratedCapacity_W: 5000
        },
        load_critical: {
          points: [[4.05, 2.0, -2.20], [4.6, 1.8, -1.8], [5.2, 1.6, -1.0]],
          radius: 0.018,
          colorHex: 0x9333ea,
          flowColorHex: 0xd8b4fe,
          ratedCapacity_W: 5200
        },
        grid_bypass: {
          points: [[3.20, 2.0, -2.20], [3.55, 1.8, -2.18], [3.88, 2.0, -2.20]],
          radius: 0.018,
          colorHex: 0xeab308,
          flowColorHex: 0xfde047,
          ratedCapacity_W: 5500
        },
        earthing: {
          points: [[-0.78, 0.0, -2.3], [-0.78, 0.4, -2.3], [-0.5, 0.4, -2.3], [-1.0, 0.8, -2.25], [-3.2, 0.8, -2.25]],
          radius: 0.014,
          colorHex: 0x65a30d,
          flowColorHex: 0xa3e635,
          ratedCapacity_W: 10000
        }
      }
    },

    // ==========================================================================
    // DOMAIN 4: SLD MAPPING & TELEMETRY ANCHORS
    // Bi-directional bridge between schematic SVG symbols and runtime simulator
    // ==========================================================================
    sldMapping: {
      schematicId: 'SLD-01',
      standard: 'HYB-FA-001 Rev B',

      // Bi-directional Symbol Mapping Table: SVG element IDs <-> Internal switchgear & components
      symbolMapping: {
        // Main Incomer MCB
        q0_mcb: {
          svgNodeId: 'sld-q0-mcb',
          bladeSelector: '#q0-mcb-blade',
          dataBreaker: 'q0_mcb',
          componentType: 'BREAKER',
          poles: 2,
          labelFa: 'Q0: کلید اصلی انشعاب شبکه'
        },
        // Inverter Grid Port MCB
        qg_mcb: {
          svgNodeId: 'sld-qg-mcb',
          bladeSelector: '#qg-mcb-blade',
          dataBreaker: 'qg_mcb',
          componentType: 'BREAKER',
          poles: 2,
          labelFa: 'QG: کلید اتصال پورت شبکه اینورتر'
        },
        // Non-Critical Loads MCB
        qn_mcb: {
          svgNodeId: 'sld-qn-mcb',
          bladeSelector: '#qn-mcb-blade',
          dataBreaker: 'qn_mcb',
          componentType: 'BREAKER',
          poles: 2,
          labelFa: 'QN: کلید بارهای عادی'
        },
        // Grid Bypass MCB
        qbp_mcb: {
          svgNodeId: 'sld-qbp-mcb',
          bladeSelector: '#qbp-mcb-blade',
          dataBreaker: 'qbp_mcb',
          componentType: 'BREAKER',
          poles: 2,
          labelFa: 'QBP: کلید مسیر بای‌پاس دستی شبکه'
        },
        // AC SPD OCPD Fuse/MCB
        fspd_mcb: {
          svgNodeId: 'sld-fspd-mcb',
          bladeSelector: null,
          dataBreaker: 'fspd_mcb',
          componentType: 'FUSE',
          poles: 2,
          labelFa: 'FSPD: فیوز حفاظت سرج ارستر AC'
        },
        // DC Isolator Switches (DC Combiner Box)
        dc_iso_1: {
          svgNodeId: 'sld-dc-isolator',
          bladeSelector: '#dc-isolator-blade, #dc-isolator-blade-2',
          dataBreaker: 'dc_isolator',
          componentType: 'ISOLATOR',
          poles: 2,
          labelFa: 'QPV1: کلید ایزولاتور استرینگ ۱'
        },
        dc_iso_2: {
          svgNodeId: 'sld-dc-isolator',
          bladeSelector: '#dc-isolator-blade-3, #dc-isolator-blade-4',
          dataBreaker: 'dc_isolator',
          componentType: 'ISOLATOR',
          poles: 2,
          labelFa: 'QPV2: کلید ایزولاتور استرینگ ۲'
        },
        // Battery DC Disconnect (QB)
        battery_qb: {
          svgNodeId: 'sld-bat-breaker',
          bladeSelector: '#bat-breaker-blade',
          dataBreaker: 'battery_ocpd',
          componentType: 'BREAKER',
          poles: 2,
          labelFa: 'QB: کلید حفاظت و قطع باتری DC'
        },
        // Inverter EPS Port MCB
        qe_mcb: {
          svgNodeId: 'sld-qe-mcb',
          bladeSelector: '#eps-mcb-blade',
          dataBreaker: 'eps_mcb',
          componentType: 'BREAKER',
          poles: 2,
          labelFa: 'QE: کلید خروجی اضطراری EPS اینورتر'
        },
        // 3-Position SBY Rotary Changeover
        sby_switch: {
          svgNodeId: 'sld-sby-switch',
          bladeSelector: '#sby-blade',
          badgeSelector: '#sld-sby-badge',
          dataBreaker: 'sby_switch',
          componentType: 'CHANGEOVER',
          positions: ['I', '0', 'II'],
          bladeTransforms: {
            'I': { x1: 0, y1: 40, x2: -45, y2: -10, stroke: '#22c55e' },
            '0': { x1: 0, y1: 40, x2: 0, y2: 12, stroke: '#eab308' },
            'II': { x1: 0, y1: 40, x2: 45, y2: 20, stroke: '#0284c7' }
          },
          labelFa: 'SBY: کلید تبدیل منبع بارهای بحرانی'
        },
        // Critical Loads Sub-Panel Incomer MCB
        qo_mcb: {
          svgNodeId: 'sld-qo-mcb',
          bladeSelector: '#qo-mcb-blade',
          dataBreaker: 'qo_mcb',
          componentType: 'BREAKER',
          poles: 2,
          labelFa: 'QO: کلید اصلی ورودی تابلوی بارهای بحرانی'
        },
        // Critical Loads RCD Ground Fault Protection
        eps_rcd: {
          svgNodeId: 'sld-eps-rcd',
          bladeSelector: '#eps-rcd-blade',
          dataBreaker: 'eps_rcd',
          componentType: 'RCD',
          poles: 2,
          labelFa: 'کلید محافظ جان خطای زمین بارهای بحرانی'
        }
      },

      // SLD Live Telemetry Anchors (Matching DOM IDs to telemetry payload keys)
      telemetryAnchors: {
        pvArray: {
          domId: 'sld-telemetry-pv',
          format: (telem) => `${(telem.pv?.v || 0).toFixed(0)}V / ${(telem.pv?.p || 0).toFixed(0)}W`
        },
        battery: {
          domId: 'sld-telemetry-bat',
          format: (telem) => `${(telem.battery?.v || 0).toFixed(1)}V / ${(telem.battery?.p >= 0 ? '+' : '')}${(telem.battery?.p || 0).toFixed(0)}W`
        },
        grid: {
          domId: 'sld-telemetry-grid',
          format: (telem) => `${(telem.grid?.v || 0).toFixed(0)}V / ${(telem.grid?.p || 0).toFixed(0)}W`
        },
        eps: {
          domId: 'sld-telemetry-eps',
          format: (telem) => `${(telem.eps?.v || 0).toFixed(0)}V / ${(telem.eps?.p || 0).toFixed(0)}W`
        }
      },

      // SLD Dynamic Flow Line Overlays
      flowOverlays: {
        pv: { svgId: 'flow-pv-dc', activeCondition: 'pv.p > 20' },
        battery: { svgId: 'flow-bat-dc', activeCondition: 'Math.abs(battery.p) > 20' },
        grid: { svgId: 'flow-grid-ac', activeCondition: 'Math.abs(grid.p) > 20' },
        bypass: { svgId: 'flow-bypass-ac', activeCondition: 'sbyPosition === "II" && grid.v > 0' }
      }
    }
  });

  // ============================================================================
  // 3. APPROVED PROFILE: profile-ong-1p-5kw-v1 (On-Grid Single-Phase 5 kW)
  // ============================================================================
  const profileOng1p5kwV1 = Object.freeze({
    id: 'profile-ong-1p-5kw-v1',
    name: '۵ کیلووات تکفاز متصل به شبکه On-Grid (بدون باتری)',
    nameEn: '5kW Single-Phase Grid-Tied (On-Grid) PV System',
    version: '1.0.0',
    schemaVersion: '1.0.0',
    familyId: '1p-ongrid',
    description: 'سامانه متصل به شبکه (On-Grid) ۵ کیلووات تک‌فاز فاقد باتری و خروجی پشتیبان اضطراری (EPS)',

    family: {
      familyId: '1p-ongrid',
      familyNameFa: 'متصل به شبکه تک‌فاز (On-Grid)',
      familyNameEn: 'Single-Phase On-Grid (up to 10kW)',
      phaseCount: 1,
      phases: ['L1'],
      neutralPresent: true,
      pePresent: true,
      topology: 'on-grid',
      earthingSystem: 'TN-S'
    },

    status: 'active',
    sldRef: {
      drawingId: 'SLD-ONG-01',
      titleFa: 'نقشه تک‌خطی متصل به شبکه تک‌فاز ۵kW (SLD-ONG-01)',
      standard: 'ONG-FA-001',
      revision: 'Rev A',
      date: '2026-09-14',
      requiresOwnerRedraw: false
    },

    systemRatings: {
      acRatedPower_W: 5000,
      acMaxApparentPower_VA: 5500,
      acNominalVoltage_V: 230,
      acVoltageRange_V: { min: 184, max: 253 },
      acNominalFrequency_Hz: 50.0,
      acFrequencyRange_Hz: { min: 47.5, max: 51.5 },
      acRatedCurrent_A: 21.7,
      acMaxCurrent_A: 24.0,

      dcRatedTotalPower_W: 5600,
      dcStringCount: 2,
      dcString1RatedPower_W: 2800,
      dcString2RatedPower_W: 2800,
      dcStringNominalVoc_V: 385,
      dcStringNominalVmp_V: 315,
      dcMpptVoltageRange_V: { min: 125, max: 500 },
      dcMaxInputVoltage_V: 550,
      dcMaxMpptCurrent_A: 15.0,
      dcTempCoeffP_pctPerC: -0.38,
      dcTempCoeffV_pctPerC: -0.28,

      batteryPresent: false,
      batteryNominalCapacity_Wh: 0,

      epsRatedPower_W: 0,
      epsMaxOverloadPower_W: 0,
      epsNominalVoltage_V: 0,
      epsNominalFrequency_Hz: 50.0,
      epsTransferTime_ms: 0,
      epsRcdSensitivity_mA: 30,

      inverterPeakEfficiency_pct: 97.6,
      inverterStandbyLoss_W: 15
    },

    equipment: {
      pvArray: canonicalProfileHyb1p5kwV1.equipment.pvArray,
      dcCombinerBox: canonicalProfileHyb1p5kwV1.equipment.dcCombinerBox,
      inverter: {
        id: 'grid_tied_inverter',
        nameFa: 'اینورتر متصل به شبکه ۵ کیلووات تک‌فاز',
        nameEn: '5kW Single-Phase Grid-Tied Inverter',
        type: 'grid_tied_inverter',
        presence: true,
        ratedContinuousPower_W: 5000,
        acRating_W: 5000,
        mpptTrackers: 2,
        internalArchitecture: {
          mppt1: { id: 'INV_MPPT1', vMin_V: 125, vMax_V: 500, maxI_A: 15 },
          mppt2: { id: 'INV_MPPT2', vMin_V: 125, vMax_V: 500, maxI_A: 15 },
          dcLinkBus: { id: 'INV_DC_BUS', nominalV_V: 400 },
          fullBridgeSpwm: { id: 'INV_SPWM_BRIDGE', acRatedV_V: 230, pMax_W: 5000 },
          antiIslandingRelay: { id: 'KSEP', name: 'Anti-Islanding Grid Disconnect Relay', tripTime_ms: 20 },
          rcmu: { id: 'RCMU', name: 'Residual Current Monitoring Unit', iDeltaN_mA: 30 }
        },
        ports: {
          pv1Input: { id: 'PORT_INV_PV1', type: 'dc', terminals: ['PV1+', 'PV1-'] },
          pv2Input: { id: 'PORT_INV_PV2', type: 'dc', terminals: ['PV2+', 'PV2-'] },
          gridPort: { id: 'PORT_INV_GRID', type: 'ac', terminals: ['L_GRID', 'N_GRID', 'PE_GRID'] },
          commsMeter: { id: 'PORT_INV_METER', type: 'signal', protocol: 'RS485-Modbus' }
        }
      },
      batteryBank: { present: false, capacity_Wh: 0 },
      batteryStorage: { presence: false, present: false },
      batteryDisconnect: { presence: false, present: false },
      earthingMet: canonicalProfileHyb1p5kwV1.equipment.earthingMet,
      mainDistributionBoard: {
        id: 'main_distribution_board',
        nameFa: 'تابلو توزیع اصلی AC و مبادله با شبکه (MDB)',
        nameEn: 'Main AC Distribution Board (MDB)',
        type: 'distribution_board',
        presence: true,
        enclosure: canonicalProfileHyb1p5kwV1.equipment.mainDistributionBoard.enclosure,
        subcomponents: {
          q0Mcb: canonicalProfileHyb1p5kwV1.equipment.mainDistributionBoard.subcomponents.q0Mcb,
          smartMeter: canonicalProfileHyb1p5kwV1.equipment.mainDistributionBoard.subcomponents.smartMeter,
          ctSensor: canonicalProfileHyb1p5kwV1.equipment.mainDistributionBoard.subcomponents.ctSensor,
          qgMcb: canonicalProfileHyb1p5kwV1.equipment.mainDistributionBoard.subcomponents.qgMcb,
          qnMcb: canonicalProfileHyb1p5kwV1.equipment.mainDistributionBoard.subcomponents.qnMcb,
          fspdMcb: canonicalProfileHyb1p5kwV1.equipment.mainDistributionBoard.subcomponents.fspdMcb,
          acSpd: canonicalProfileHyb1p5kwV1.equipment.mainDistributionBoard.subcomponents.acSpd,
          busG: canonicalProfileHyb1p5kwV1.equipment.mainDistributionBoard.subcomponents.busG
        }
      },
      epsDistributionBoard: { presence: false, present: false },
      utilityService: canonicalProfileHyb1p5kwV1.equipment.utilityService,
      nonCriticalLoads: canonicalProfileHyb1p5kwV1.equipment.nonCriticalLoads,
      criticalLoads: { presence: false, present: false }
    },

    connectivity: {
      buses: {
        'BUS-G': canonicalProfileHyb1p5kwV1.connectivity.buses['BUS-G'],
        'DC-BUS': {
          id: 'DC-BUS',
          nameFa: 'باس DC داخلی اینورتر',
          voltageNominal_V: 400,
          liveWhen: 'pv_power > 20W OR grid_available',
          fedBy: ['mppt1', 'mppt2', 'ac_grid_rectifier']
        },
        'BUS-EPS': {
          id: 'BUS-EPS',
          present: false,
          presence: false,
          nameFa: 'شینه تغذیه بارهای اضطراری (غیرفعال در سامانه متصل به شبکه)'
        },
        'MET': canonicalProfileHyb1p5kwV1.connectivity.buses['MET']
      },
      circuits: {
        pv1_dc_string: canonicalProfileHyb1p5kwV1.connectivity.circuits.pv1_dc_string,
        pv2_dc_string: canonicalProfileHyb1p5kwV1.connectivity.circuits.pv2_dc_string,
        utility_service_incomer: canonicalProfileHyb1p5kwV1.connectivity.circuits.utility_service_incomer,
        inverter_grid_coupling: canonicalProfileHyb1p5kwV1.connectivity.circuits.inverter_grid_coupling,
        non_critical_loads_feeder: canonicalProfileHyb1p5kwV1.connectivity.circuits.non_critical_loads_feeder,
        earthing_equipotential_network: canonicalProfileHyb1p5kwV1.connectivity.circuits.earthing_equipotential_network
      },
      interlocks: [
        canonicalProfileHyb1p5kwV1.connectivity.interlocks[1]
      ]
    },

    layout3D: {
      room: canonicalProfileHyb1p5kwV1.layout3D.room,
      enclosures: {
        rooftopPV: canonicalProfileHyb1p5kwV1.layout3D.enclosures.rooftopPV,
        dcCombinerBox: canonicalProfileHyb1p5kwV1.layout3D.enclosures.dcCombinerBox,
        hybridInverter: canonicalProfileHyb1p5kwV1.layout3D.enclosures.hybridInverter,
        earthingMet: canonicalProfileHyb1p5kwV1.layout3D.enclosures.earthingMet,
        mainDistributionBoard: canonicalProfileHyb1p5kwV1.layout3D.enclosures.mainDistributionBoard,
        ctSensor: canonicalProfileHyb1p5kwV1.layout3D.enclosures.ctSensor,
        utilityCutout: canonicalProfileHyb1p5kwV1.layout3D.enclosures.utilityCutout,
        nonCriticalLoadsBlock: canonicalProfileHyb1p5kwV1.layout3D.enclosures.nonCriticalLoadsBlock
      },
      cameraFraming: canonicalProfileHyb1p5kwV1.layout3D.cameraFraming,
      cabling3D: {
        pv1: canonicalProfileHyb1p5kwV1.layout3D.cabling3D.pv1,
        pv2: canonicalProfileHyb1p5kwV1.layout3D.cabling3D.pv2,
        grid_in: canonicalProfileHyb1p5kwV1.layout3D.cabling3D.grid_in,
        inv_grid: canonicalProfileHyb1p5kwV1.layout3D.cabling3D.inv_grid,
        load_non_critical: canonicalProfileHyb1p5kwV1.layout3D.cabling3D.load_non_critical,
        earthing: canonicalProfileHyb1p5kwV1.layout3D.cabling3D.earthing
      }
    },

    sldMapping: {
      schematicId: 'SLD-ONG-01',
      standard: 'ONG-FA-001 Rev A',
      symbolMapping: {
        q0_mcb: canonicalProfileHyb1p5kwV1.sldMapping.symbolMapping.q0_mcb,
        qg_mcb: canonicalProfileHyb1p5kwV1.sldMapping.symbolMapping.qg_mcb,
        qn_mcb: canonicalProfileHyb1p5kwV1.sldMapping.symbolMapping.qn_mcb,
        fspd_mcb: canonicalProfileHyb1p5kwV1.sldMapping.symbolMapping.fspd_mcb,
        dc_iso_1: canonicalProfileHyb1p5kwV1.sldMapping.symbolMapping.dc_iso_1,
        dc_iso_2: canonicalProfileHyb1p5kwV1.sldMapping.symbolMapping.dc_iso_2
      },
      telemetryAnchors: {
        pvArray: canonicalProfileHyb1p5kwV1.sldMapping.telemetryAnchors.pvArray,
        grid: canonicalProfileHyb1p5kwV1.sldMapping.telemetryAnchors.grid
      },
      flowOverlays: {
        pv: canonicalProfileHyb1p5kwV1.sldMapping.flowOverlays.pv,
        grid: canonicalProfileHyb1p5kwV1.sldMapping.flowOverlays.grid
      }
    }
  });

  // ============================================================================
  // 4. APPROVED PROFILE: profile-hyb-1p-10kw-v1 (10 kW Single-Phase Hybrid)
  // ============================================================================
  const profileHyb1p10kwV1 = Object.freeze({
    id: 'profile-hyb-1p-10kw-v1',
    name: '۱۰ کیلووات تکفاز هایبرید (ظرفیت دوبرابر)',
    nameEn: '10kW Single-Phase Hybrid PV System with Battery Storage',
    version: '1.0.0',
    schemaVersion: '1.0.0',
    familyId: '1p-hybrid',
    description: 'سامانه ارتقایافته هیبرید تک‌فاز ۱۰kW با اینورتر ۱۰kW، دو استرینگ ۵۵۰۰W و باتری ۱۰۲۴۰Wh',

    family: {
      familyId: '1p-hybrid',
      familyNameFa: 'هیبرید تک‌فاز (تا ۱۰ کیلووات)',
      familyNameEn: 'Single-Phase Hybrid (up to 10kW)',
      phaseCount: 1,
      phases: ['L1'],
      neutralPresent: true,
      pePresent: true,
      topology: 'hybrid',
      earthingSystem: 'TN-S'
    },

    status: 'active',
    sldRef: {
      drawingId: 'SLD-HYB-10K',
      titleFa: 'نقشه تک‌خطی تک‌فاز ۱۰kW (SLD-HYB-10K)',
      standard: 'HYB-FA-002',
      revision: 'Rev A',
      date: '2026-09-14',
      requiresOwnerRedraw: false
    },

    systemRatings: {
      acRatedPower_W: 10000,
      acMaxApparentPower_VA: 11000,
      acNominalVoltage_V: 230,
      acVoltageRange_V: { min: 184, max: 253 },
      acNominalFrequency_Hz: 50.0,
      acFrequencyRange_Hz: { min: 47.5, max: 51.5 },
      acRatedCurrent_A: 43.5,
      acMaxCurrent_A: 48.0,

      dcRatedTotalPower_W: 11000,
      dcStringCount: 2,
      dcString1RatedPower_W: 5500,
      dcString2RatedPower_W: 5500,
      dcStringNominalVoc_V: 450,
      dcStringNominalVmp_V: 370,
      dcMpptVoltageRange_V: { min: 150, max: 550 },
      dcMaxInputVoltage_V: 600,
      dcMaxMpptCurrent_A: 25.0,
      dcTempCoeffP_pctPerC: -0.38,
      dcTempCoeffV_pctPerC: -0.28,

      batteryPresent: true,
      batteryType: 'LiFePO4',
      batteryNominalVoltage_V: 51.2,
      batteryWorkingVoltageRange_V: { min: 48.0, max: 57.6 },
      batteryNominalCapacity_Ah: 200,
      batteryNominalCapacity_Wh: 10240,
      batteryMaxChargePower_W: 5000,
      batteryMaxDischargePower_W: 8000,
      batteryMaxContinuousCurrent_A: 200,
      batteryMinSOC_pct: 10,
      batteryReserveSOC_pct: 15,

      epsRatedPower_W: 10000,
      epsMaxOverloadPower_W: 10400,
      epsNominalVoltage_V: 230,
      epsNominalFrequency_Hz: 50.0,
      epsTransferTime_ms: 10,
      epsRcdSensitivity_mA: 30,

      inverterPeakEfficiency_pct: 97.8,
      inverterStandbyLoss_W: 35
    },

    equipment: {
      pvArray: {
        id: 'pv_array',
        nameFa: 'آرایه فتوولتائیک پشت‌بام (۲۴ پنل، ۲ استرینگ ۵.۵kW)',
        nameEn: 'Rooftop PV Array (24 Modules, 2 Strings x 5.5kW)',
        type: 'solar_array',
        presence: true,
        manufacturer: 'Tier-1 Mono-PERC 460W',
        strings: [
          {
            id: 'string_1',
            nameFa: 'استرینگ خورشیدی شماره ۱ (۵۵۰۰ وات)',
            modulesCount: 12,
            ratedPower_W: 5500,
            nominalVoc_V: 450,
            nominalVmp_V: 370,
            ports: canonicalProfileHyb1p5kwV1.equipment.pvArray.strings[0].ports
          },
          {
            id: 'string_2',
            nameFa: 'استرینگ خورشیدی شماره ۲ (۵۵۰۰ وات)',
            modulesCount: 12,
            ratedPower_W: 5500,
            nominalVoc_V: 450,
            nominalVmp_V: 370,
            ports: canonicalProfileHyb1p5kwV1.equipment.pvArray.strings[1].ports
          }
        ]
      },
      dcCombinerBox: canonicalProfileHyb1p5kwV1.equipment.dcCombinerBox,
      inverter: {
        id: 'hybrid_inverter_10kw',
        nameFa: 'اینورتر هایبرید ۱۰ کیلووات تک‌فاز (Dual MPPT)',
        nameEn: '10kW Single-Phase Hybrid Inverter (Dual MPPT)',
        type: 'hybrid_inverter',
        presence: true,
        ratedContinuousPower_W: 10000,
        acRating_W: 10000,
        mpptTrackers: 2,
        internalArchitecture: {
          mppt1: { id: 'INV_MPPT1', vMin_V: 150, vMax_V: 550, maxI_A: 25 },
          mppt2: { id: 'INV_MPPT2', vMin_V: 150, vMax_V: 550, maxI_A: 25 },
          dcLinkBus: { id: 'INV_DC_BUS', nominalV_V: 400 },
          bidirectionalDcDc: { id: 'INV_DCDC_BAT', vNominal_V: 48, maxCurrent_A: 200, pMax_W: 8000 },
          fullBridgeSpwm: { id: 'INV_SPWM_BRIDGE', acRatedV_V: 230, pMax_W: 10000 },
          antiIslandingRelay: { id: 'KSEP', name: 'Anti-Islanding Grid Disconnect Relay', tripTime_ms: 20 },
          neutralEarthBondRelay: { id: 'KNE', name: 'Off-grid N-PE Bonding Contactor', normClosedOffgrid: true },
          rcmu: { id: 'RCMU', name: 'Residual Current Monitoring Unit', iDeltaN_mA: 30 }
        },
        ports: canonicalProfileHyb1p5kwV1.equipment.inverter.ports
      },
      batteryBank: {
        present: true,
        capacity_Wh: 10240
      },
      batteryStorage: {
        id: 'battery_storage_10kwh',
        nameFa: 'بانک ذخیره‌ساز لیتیوم آهن فسفات ۱۰.۲۴ کیلووات‌ساعت (LiFePO4 BESS)',
        nameEn: '10.24kWh LiFePO4 Battery Energy Storage System (BESS)',
        type: 'battery_storage',
        presence: true,
        chemistry: 'LiFePO4',
        modulesCount: 4,
        bankRatings: {
          voltageNominal_V: 51.2,
          voltageFloat_V: 54.4,
          capacityTotal_Ah: 200,
          energyTotal_Wh: 10240,
          maxContinuousDischarge_A: 200,
          maxChargePower_W: 5000,
          maxDischargePower_W: 8000
        },
        bms: canonicalProfileHyb1p5kwV1.equipment.batteryStorage.bms
      },
      batteryDisconnect: canonicalProfileHyb1p5kwV1.equipment.batteryDisconnect,
      earthingMet: canonicalProfileHyb1p5kwV1.equipment.earthingMet,
      mainDistributionBoard: canonicalProfileHyb1p5kwV1.equipment.mainDistributionBoard,
      epsDistributionBoard: canonicalProfileHyb1p5kwV1.equipment.epsDistributionBoard,
      utilityService: canonicalProfileHyb1p5kwV1.equipment.utilityService,
      nonCriticalLoads: {
        id: 'non_critical_loads',
        nameFa: 'بارهای عادی خانه (تهویه، شارژر، آبگرمکن)',
        nameEn: 'Non-Critical House Loads',
        type: 'load_cluster',
        presence: true,
        sheddableDuringBlackout: true,
        nominalPower_W: 4400
      },
      criticalLoads: {
        id: 'critical_loads',
        nameFa: 'بارهای بحرانی و بدون وقفه',
        nameEn: 'Critical Uninterruptible Loads',
        type: 'load_cluster',
        presence: true,
        sheddableDuringBlackout: false,
        nominalPower_W: 3000,
        maxPermittedPower_W: 10400
      }
    },

    connectivity: {
      buses: {
        'BUS-G': {
          id: 'BUS-G',
          nameFa: 'شینه توزیع شبکه AC تابلوی اصلی',
          voltageNominal_V: 230,
          currentRating_A: 80,
          phases: ['L1'],
          hasNeutral: true,
          liveWhen: 'grid_available AND q0_closed',
          fedBy: ['utility_incomer', 'inverter_grid_feed']
        },
        'DC-BUS': canonicalProfileHyb1p5kwV1.connectivity.buses['DC-BUS'],
        'BUS-EPS': {
          id: 'BUS-EPS',
          nameFa: 'شینه تغذیه بارهای بحرانی',
          voltageNominal_V: 230,
          currentRating_A: 63,
          liveWhen: '(sbyPosition === "I" AND inverter_eps_powered) OR (sbyPosition === "II" AND bus_g_alive)',
          fedBy: ['inverter_eps_port', 'grid_bypass_feed']
        },
        'MET': canonicalProfileHyb1p5kwV1.connectivity.buses['MET']
      },
      circuits: canonicalProfileHyb1p5kwV1.connectivity.circuits,
      interlocks: canonicalProfileHyb1p5kwV1.connectivity.interlocks
    },

    layout3D: {
      room: canonicalProfileHyb1p5kwV1.layout3D.room,
      enclosures: canonicalProfileHyb1p5kwV1.layout3D.enclosures,
      cameraFraming: canonicalProfileHyb1p5kwV1.layout3D.cameraFraming,
      cabling3D: {
        ...canonicalProfileHyb1p5kwV1.layout3D.cabling3D,
        pv1: { ...canonicalProfileHyb1p5kwV1.layout3D.cabling3D.pv1, ratedCapacity_W: 5500 },
        pv2: { ...canonicalProfileHyb1p5kwV1.layout3D.cabling3D.pv2, ratedCapacity_W: 5500 },
        battery: { ...canonicalProfileHyb1p5kwV1.layout3D.cabling3D.battery, ratedCapacity_W: 8000 },
        inv_grid: { ...canonicalProfileHyb1p5kwV1.layout3D.cabling3D.inv_grid, ratedCapacity_W: 10000 },
        inv_eps: { ...canonicalProfileHyb1p5kwV1.layout3D.cabling3D.inv_eps, ratedCapacity_W: 10000 }
      }
    },

    sldMapping: canonicalProfileHyb1p5kwV1.sldMapping
  });

  // ============================================================================
  // 5. APPROVED PROFILE: profile-off-1p-5kw-v1 (5 kW Single-Phase Off-Grid)
  // ============================================================================
  const profileOff1p5kwV1 = Object.freeze({
    id: 'profile-off-1p-5kw-v1',
    name: '۵ کیلووات تکفاز مستقل از شبکه Off-Grid',
    nameEn: '5kW Single-Phase Off-Grid PV System',
    version: '1.0.0',
    schemaVersion: '1.0.0',
    familyId: '1p-offgrid',
    description: 'سامانه خورشیدی مستقل از شبکه ۵kW با باتری ذخیره‌ساز و ورودی ژنراتور اضطراری',

    family: {
      familyId: '1p-offgrid',
      familyNameFa: 'مستقل از شبکه تک‌فاز (Off-Grid)',
      familyNameEn: 'Single-Phase Off-Grid (up to 10kW)',
      phaseCount: 1,
      phases: ['L1'],
      neutralPresent: true,
      pePresent: true,
      topology: 'off-grid',
      earthingSystem: 'TN-S'
    },

    status: 'active',
    sldRef: {
      drawingId: 'SLD-OFF-01',
      titleFa: 'نقشه تک‌خطی مستقل از شبکه ۵kW (SLD-OFF-01)',
      standard: 'OFF-FA-001',
      revision: 'Rev A',
      date: '2026-09-14',
      requiresOwnerRedraw: false
    },

    systemRatings: {
      acRatedPower_W: 5000,
      acMaxApparentPower_VA: 5500,
      acNominalVoltage_V: 230,
      acVoltageRange_V: { min: 207, max: 243 },
      acNominalFrequency_Hz: 50.0,
      acFrequencyRange_Hz: { min: 49.0, max: 51.0 },
      acRatedCurrent_A: 21.7,
      acMaxCurrent_A: 24.0,

      dcRatedTotalPower_W: 5600,
      dcStringCount: 2,
      dcString1RatedPower_W: 2800,
      dcString2RatedPower_W: 2800,
      dcStringNominalVoc_V: 385,
      dcStringNominalVmp_V: 315,
      dcMpptVoltageRange_V: { min: 125, max: 500 },
      dcMaxInputVoltage_V: 550,
      dcMaxMpptCurrent_A: 15.0,
      dcTempCoeffP_pctPerC: -0.38,
      dcTempCoeffV_pctPerC: -0.28,

      batteryPresent: true,
      batteryType: 'LiFePO4',
      batteryNominalVoltage_V: 51.2,
      batteryWorkingVoltageRange_V: { min: 48.0, max: 57.6 },
      batteryNominalCapacity_Ah: 100,
      batteryNominalCapacity_Wh: 5120,
      batteryMaxChargePower_W: 2500,
      batteryMaxDischargePower_W: 4000,
      batteryMaxContinuousCurrent_A: 100,
      batteryMinSOC_pct: 10,
      batteryReserveSOC_pct: 15,

      epsRatedPower_W: 5000,
      epsMaxOverloadPower_W: 5200,
      epsNominalVoltage_V: 230,
      epsNominalFrequency_Hz: 50.0,
      epsTransferTime_ms: 0,
      epsRcdSensitivity_mA: 30,

      inverterPeakEfficiency_pct: 96.8,
      inverterStandbyLoss_W: 30
    },

    equipment: {
      pvArray: canonicalProfileHyb1p5kwV1.equipment.pvArray,
      dcCombinerBox: canonicalProfileHyb1p5kwV1.equipment.dcCombinerBox,
      inverter: {
        id: 'offgrid_inverter',
        nameFa: 'اینورتر مستقل از شبکه ۵ کیلووات تک‌فاز (Off-Grid Inverter)',
        nameEn: '5kW Single-Phase Off-Grid Inverter',
        type: 'offgrid_inverter',
        presence: true,
        ratedContinuousPower_W: 5000,
        acRating_W: 5000,
        mpptTrackers: 2,
        internalArchitecture: canonicalProfileHyb1p5kwV1.equipment.inverter.internalArchitecture,
        ports: {
          pv1Input: canonicalProfileHyb1p5kwV1.equipment.inverter.ports.pv1Input,
          pv2Input: canonicalProfileHyb1p5kwV1.equipment.inverter.ports.pv2Input,
          batteryPort: canonicalProfileHyb1p5kwV1.equipment.inverter.ports.batteryPort,
          epsPort: canonicalProfileHyb1p5kwV1.equipment.inverter.ports.epsPort,
          genInputPort: { id: 'PORT_INV_GEN', type: 'ac', terminals: ['L_GEN', 'N_GEN', 'PE_GEN'] }
        }
      },
      batteryBank: { present: true, capacity_Wh: 5120 },
      batteryStorage: canonicalProfileHyb1p5kwV1.equipment.batteryStorage,
      batteryDisconnect: canonicalProfileHyb1p5kwV1.equipment.batteryDisconnect,
      earthingMet: canonicalProfileHyb1p5kwV1.equipment.earthingMet,
      mainDistributionBoard: { presence: false, present: false },
      epsDistributionBoard: canonicalProfileHyb1p5kwV1.equipment.epsDistributionBoard,
      utilityService: {
        id: 'generator_service',
        nameFa: 'ورودی ژنراتور اضطراری (فاقد اتصال به شبکه سراسری)',
        nameEn: 'Backup Diesel Generator Incomer',
        type: 'generator_service',
        presence: false,
        present: false
      },
      nonCriticalLoads: { presence: false, present: false },
      criticalLoads: {
        id: 'ac_loads',
        nameFa: 'بارهای اصلی ساختمان مستقل از شبکه',
        nameEn: 'Off-Grid AC Loads',
        type: 'load_cluster',
        presence: true,
        sheddableDuringBlackout: false,
        nominalPower_W: 2500,
        maxPermittedPower_W: 5200
      }
    },

    connectivity: {
      buses: {
        'BUS-G': {
          id: 'BUS-G',
          present: false,
          presence: false,
          nameFa: 'شینه شبکه سراسری (فاقد اتصال شبکه - آف‌گرید)'
        },
        'DC-BUS': canonicalProfileHyb1p5kwV1.connectivity.buses['DC-BUS'],
        'BUS-EPS': canonicalProfileHyb1p5kwV1.connectivity.buses['BUS-EPS'],
        'MET': canonicalProfileHyb1p5kwV1.connectivity.buses['MET']
      },
      circuits: {
        pv1_dc_string: canonicalProfileHyb1p5kwV1.connectivity.circuits.pv1_dc_string,
        pv2_dc_string: canonicalProfileHyb1p5kwV1.connectivity.circuits.pv2_dc_string,
        battery_dc_feeder: canonicalProfileHyb1p5kwV1.connectivity.circuits.battery_dc_feeder,
        inverter_eps_feeder: canonicalProfileHyb1p5kwV1.connectivity.circuits.inverter_eps_feeder,
        critical_loads_feeder: canonicalProfileHyb1p5kwV1.connectivity.circuits.critical_loads_feeder,
        earthing_equipotential_network: canonicalProfileHyb1p5kwV1.connectivity.circuits.earthing_equipotential_network
      },
      interlocks: [
        canonicalProfileHyb1p5kwV1.connectivity.interlocks[0],
        canonicalProfileHyb1p5kwV1.connectivity.interlocks[2]
      ]
    },

    layout3D: {
      room: canonicalProfileHyb1p5kwV1.layout3D.room,
      enclosures: {
        rooftopPV: canonicalProfileHyb1p5kwV1.layout3D.enclosures.rooftopPV,
        dcCombinerBox: canonicalProfileHyb1p5kwV1.layout3D.enclosures.dcCombinerBox,
        hybridInverter: canonicalProfileHyb1p5kwV1.layout3D.enclosures.hybridInverter,
        batteryRack: canonicalProfileHyb1p5kwV1.layout3D.enclosures.batteryRack,
        batteryDisconnectBox: canonicalProfileHyb1p5kwV1.layout3D.enclosures.batteryDisconnectBox,
        earthingMet: canonicalProfileHyb1p5kwV1.layout3D.enclosures.earthingMet,
        epsDistributionBoard: canonicalProfileHyb1p5kwV1.layout3D.enclosures.epsDistributionBoard,
        criticalLoadsBlock: canonicalProfileHyb1p5kwV1.layout3D.enclosures.criticalLoadsBlock
      },
      cameraFraming: canonicalProfileHyb1p5kwV1.layout3D.cameraFraming,
      cabling3D: {
        pv1: canonicalProfileHyb1p5kwV1.layout3D.cabling3D.pv1,
        pv2: canonicalProfileHyb1p5kwV1.layout3D.cabling3D.pv2,
        battery: canonicalProfileHyb1p5kwV1.layout3D.cabling3D.battery,
        inv_eps: canonicalProfileHyb1p5kwV1.layout3D.cabling3D.inv_eps,
        load_critical: canonicalProfileHyb1p5kwV1.layout3D.cabling3D.load_critical,
        earthing: canonicalProfileHyb1p5kwV1.layout3D.cabling3D.earthing
      }
    },

    sldMapping: {
      schematicId: 'SLD-OFF-01',
      standard: 'OFF-FA-001 Rev A',
      symbolMapping: {
        dc_iso_1: canonicalProfileHyb1p5kwV1.sldMapping.symbolMapping.dc_iso_1,
        dc_iso_2: canonicalProfileHyb1p5kwV1.sldMapping.symbolMapping.dc_iso_2,
        battery_qb: canonicalProfileHyb1p5kwV1.sldMapping.symbolMapping.battery_qb,
        qe_mcb: canonicalProfileHyb1p5kwV1.sldMapping.symbolMapping.qe_mcb,
        qo_mcb: canonicalProfileHyb1p5kwV1.sldMapping.symbolMapping.qo_mcb,
        eps_rcd: canonicalProfileHyb1p5kwV1.sldMapping.symbolMapping.eps_rcd
      },
      telemetryAnchors: {
        pvArray: canonicalProfileHyb1p5kwV1.sldMapping.telemetryAnchors.pvArray,
        battery: canonicalProfileHyb1p5kwV1.sldMapping.telemetryAnchors.battery,
        eps: canonicalProfileHyb1p5kwV1.sldMapping.telemetryAnchors.eps
      },
      flowOverlays: {
        pv: canonicalProfileHyb1p5kwV1.sldMapping.flowOverlays.pv,
        battery: canonicalProfileHyb1p5kwV1.sldMapping.flowOverlays.battery
      }
    }
  });

  // ============================================================================
  // 6. APPROVED PROFILE: profile-hyb-3p-15kw-v1 (15 kW Three-Phase Hybrid)
  // ============================================================================
  const profileHyb3p15kwV1 = Object.freeze({
    id: 'profile-hyb-3p-15kw-v1',
    name: '۱۵ کیلووات سهفاز هایبرید (۳ فاز ۴۰۰ ولت)',
    nameEn: '15kW Three-Phase Hybrid PV System with Battery Storage',
    version: '1.0.0',
    schemaVersion: '1.0.0',
    familyId: '3p-hybrid',
    description: 'سامانه استاندارد هیبرید سه‌فاز ۱۵kW (۴۰۰ ولت فاز به فاز / ۲۳۰ ولت فاز به نول) با ذخیره‌ساز باتری ولتاژ بالا',

    family: {
      familyId: '3p-hybrid',
      familyNameFa: 'هیبرید سه‌فاز (۵ تا ۱۰۰ کیلووات)',
      familyNameEn: 'Three-Phase Hybrid (5 to 100kW)',
      phaseCount: 3,
      phases: ['L1', 'L2', 'L3'],
      neutralPresent: true,
      pePresent: true,
      topology: 'hybrid',
      earthingSystem: 'TN-S'
    },

    status: 'active',
    sldRef: {
      drawingId: 'SLD-02',
      titleFa: 'نقشه تک‌خطی سه‌فاز ۱۵kW (SLD-02)',
      standard: 'HYB-3P-001',
      revision: 'Rev B',
      date: '2026-09-14',
      requiresOwnerRedraw: false
    },

    systemRatings: {
      acRatedPower_W: 15000,
      acMaxApparentPower_VA: 16500,
      acNominalVoltage_V: 400,
      acLineToLineVoltage_V: 400,
      acLineToNeutralVoltage_V: 230,
      acVoltageRange_V: { min: 320, max: 440 },
      acNominalFrequency_Hz: 50.0,
      acFrequencyRange_Hz: { min: 47.5, max: 51.5 },
      acRatedCurrent_A: 21.7,
      acMaxCurrent_A: 24.0,

      dcRatedTotalPower_W: 16500,
      dcStringCount: 3,
      dcString1RatedPower_W: 5500,
      dcString2RatedPower_W: 5500,
      dcString3RatedPower_W: 5500,
      dcStringNominalVoc_V: 650,
      dcStringNominalVmp_V: 540,
      dcMpptVoltageRange_V: { min: 200, max: 850 },
      dcMaxInputVoltage_V: 1000,
      dcMaxMpptCurrent_A: 26.0,
      dcTempCoeffP_pctPerC: -0.38,
      dcTempCoeffV_pctPerC: -0.28,

      batteryPresent: true,
      batteryType: 'LiFePO4 High-Voltage',
      batteryNominalVoltage_V: 307.2,
      batteryWorkingVoltageRange_V: { min: 270, max: 345 },
      batteryNominalCapacity_Ah: 50,
      batteryNominalCapacity_Wh: 15360,
      batteryMaxChargePower_W: 10000,
      batteryMaxDischargePower_W: 15000,
      batteryMaxContinuousCurrent_A: 50,
      batteryMinSOC_pct: 10,
      batteryReserveSOC_pct: 15,

      epsRatedPower_W: 15000,
      epsMaxOverloadPower_W: 16500,
      epsNominalVoltage_V: 400,
      epsNominalFrequency_Hz: 50.0,
      epsTransferTime_ms: 10,
      epsRcdSensitivity_mA: 30,

      inverterPeakEfficiency_pct: 98.2,
      inverterStandbyLoss_W: 60
    },

    equipment: {
      pvArray: {
        id: 'pv_array_3p',
        nameFa: 'آرایه خورشیدی سه‌فاز (۳ استرینگ ۵.۵kW)',
        nameEn: 'Three-Phase PV Array (3 Strings x 5.5kW)',
        type: 'solar_array',
        presence: true,
        manufacturer: 'Tier-1 Mono-PERC 500W',
        strings: [
          { id: 'string_1', modulesCount: 11, ratedPower_W: 5500, nominalVoc_V: 650, nominalVmp_V: 540, ports: canonicalProfileHyb1p5kwV1.equipment.pvArray.strings[0].ports },
          { id: 'string_2', modulesCount: 11, ratedPower_W: 5500, nominalVoc_V: 650, nominalVmp_V: 540, ports: canonicalProfileHyb1p5kwV1.equipment.pvArray.strings[1].ports },
          { id: 'string_3', modulesCount: 11, ratedPower_W: 5500, nominalVoc_V: 650, nominalVmp_V: 540, ports: canonicalProfileHyb1p5kwV1.equipment.pvArray.strings[0].ports }
        ]
      },
      dcCombinerBox: canonicalProfileHyb1p5kwV1.equipment.dcCombinerBox,
      inverter: {
        id: 'hybrid_inverter_3p',
        nameFa: 'اینورتر هایبرید ۱۵ کیلووات سه‌فاز (Three-Phase Hybrid)',
        nameEn: '15kW Three-Phase Hybrid Inverter',
        type: '3p_hybrid_inverter',
        presence: true,
        ratedContinuousPower_W: 15000,
        acRating_W: 15000,
        mpptTrackers: 2,
        internalArchitecture: canonicalProfileHyb1p5kwV1.equipment.inverter.internalArchitecture,
        ports: {
          ...canonicalProfileHyb1p5kwV1.equipment.inverter.ports,
          gridPort: { id: 'PORT_INV_GRID_3P', type: 'ac', terminals: ['L1_GRID', 'L2_GRID', 'L3_GRID', 'N_GRID', 'PE_GRID'] },
          epsPort: { id: 'PORT_INV_EPS_3P', type: 'ac', terminals: ['L1_EPS', 'L2_EPS', 'L3_EPS', 'N_EPS', 'PE_EPS'] }
        }
      },
      batteryBank: { present: true, capacity_Wh: 15360 },
      batteryStorage: {
        id: 'battery_storage_hv',
        nameFa: 'بانک باتری ولتاژ بالا ۱۵.۳۶ کیلووات‌ساعت (High-Voltage BESS)',
        nameEn: '15.36kWh High-Voltage LiFePO4 Battery System',
        type: 'battery_storage',
        presence: true,
        chemistry: 'LiFePO4 (96S)',
        modulesCount: 3,
        bankRatings: {
          voltageNominal_V: 307.2,
          voltageFloat_V: 326.4,
          capacityTotal_Ah: 50,
          energyTotal_Wh: 15360,
          maxContinuousDischarge_A: 50,
          maxChargePower_W: 10000,
          maxDischargePower_W: 15000
        },
        bms: canonicalProfileHyb1p5kwV1.equipment.batteryStorage.bms
      },
      batteryDisconnect: canonicalProfileHyb1p5kwV1.equipment.batteryDisconnect,
      earthingMet: canonicalProfileHyb1p5kwV1.equipment.earthingMet,
      mainDistributionBoard: canonicalProfileHyb1p5kwV1.equipment.mainDistributionBoard,
      epsDistributionBoard: canonicalProfileHyb1p5kwV1.equipment.epsDistributionBoard,
      utilityService: {
        id: 'utility_service_3p',
        nameFa: 'انشعاب شبکه توزیع برق منطقه‌ای سه‌فاز (۴۰۰ ولت)',
        nameEn: 'Three-Phase 400V Utility Service Cutout',
        type: 'utility_service',
        presence: true,
        phaseCount: 3,
        nominalVoltage_V: 400,
        serviceFuseRating_A: 63
      },
      nonCriticalLoads: {
        id: 'non_critical_loads_3p',
        nameFa: 'بارهای عادی سه‌فاز متعادل (۶.۶ کیلووات)',
        nameEn: 'Three-Phase Balanced House Loads',
        type: 'load_cluster',
        presence: true,
        sheddableDuringBlackout: true,
        nominalPower_W: 6600
      },
      criticalLoads: {
        id: 'critical_loads_3p',
        nameFa: 'بارهای بحرانی سه‌فاز (۴.۵ کیلووات)',
        nameEn: 'Three-Phase Critical Uninterruptible Loads',
        type: 'load_cluster',
        presence: true,
        sheddableDuringBlackout: false,
        nominalPower_W: 4500,
        maxPermittedPower_W: 16500
      }
    },

    connectivity: {
      buses: {
        'BUS-G': {
          id: 'BUS-G',
          nameFa: 'شینه توزیع شبکه سه‌فاز AC (۴۰۰ ولت)',
          voltageNominal_V: 400,
          currentRating_A: 40,
          phases: ['L1', 'L2', 'L3'],
          hasNeutral: true,
          liveWhen: 'grid_available AND q0_closed',
          fedBy: ['utility_incomer', 'inverter_grid_feed']
        },
        'DC-BUS': {
          id: 'DC-BUS',
          nameFa: 'باس DC داخلی اینورتر',
          voltageNominal_V: 750,
          liveWhen: 'pv_power > 20W OR battery_healthy OR grid_available',
          fedBy: ['mppt1', 'mppt2', 'dcdc_battery', 'ac_grid_rectifier']
        },
        'BUS-EPS': {
          id: 'BUS-EPS',
          nameFa: 'شینه تغذیه بارهای بحرانی سه‌فاز (۴۰۰ ولت)',
          voltageNominal_V: 400,
          currentRating_A: 32,
          phases: ['L1', 'L2', 'L3'],
          hasNeutral: true,
          liveWhen: '(sbyPosition === "I" AND inverter_eps_powered) OR (sbyPosition === "II" AND bus_g_alive)',
          fedBy: ['inverter_eps_port', 'grid_bypass_feed']
        },
        'MET': canonicalProfileHyb1p5kwV1.connectivity.buses['MET']
      },
      circuits: canonicalProfileHyb1p5kwV1.connectivity.circuits,
      interlocks: canonicalProfileHyb1p5kwV1.connectivity.interlocks
    },

    layout3D: {
      room: canonicalProfileHyb1p5kwV1.layout3D.room,
      enclosures: canonicalProfileHyb1p5kwV1.layout3D.enclosures,
      cameraFraming: canonicalProfileHyb1p5kwV1.layout3D.cameraFraming,
      cabling3D: {
        ...canonicalProfileHyb1p5kwV1.layout3D.cabling3D,
        pv1: { ...canonicalProfileHyb1p5kwV1.layout3D.cabling3D.pv1, ratedCapacity_W: 5500 },
        pv2: { ...canonicalProfileHyb1p5kwV1.layout3D.cabling3D.pv2, ratedCapacity_W: 5500 },
        battery: { ...canonicalProfileHyb1p5kwV1.layout3D.cabling3D.battery, ratedCapacity_W: 15000 },
        inv_grid: { ...canonicalProfileHyb1p5kwV1.layout3D.cabling3D.inv_grid, ratedCapacity_W: 15000 },
        inv_eps: { ...canonicalProfileHyb1p5kwV1.layout3D.cabling3D.inv_eps, ratedCapacity_W: 15000 }
      }
    },

    sldMapping: canonicalProfileHyb1p5kwV1.sldMapping
  });

  // ============================================================================
  // 7. SYSTEM PROFILES REGISTRY & EXTENSION API
  // ============================================================================

  const registry = new Map();

  /**
   * Registers a validated SystemProfile
   * @param {Object} profile - SystemProfile document
   */
  function registerProfile(profile) {
    const check = validateSystemProfile(profile);
    if (!check.valid) {
      throw new Error(`[SystemProfiles] Cannot register invalid profile "${profile?.id}": ${check.errors.join('; ')}`);
    }
    registry.set(profile.id, Object.freeze(JSON.parse(JSON.stringify(profile))));
    return true;
  }

  // Auto-register canonical reference profile & approved family profiles
  registerProfile(canonicalProfileHyb1p5kwV1);
  registerProfile(profileOng1p5kwV1);
  registerProfile(profileHyb1p10kwV1);
  registerProfile(profileOff1p5kwV1);
  registerProfile(profileHyb3p15kwV1);

  const SystemProfiles = Object.freeze({
    SCHEMA_VERSION: SystemProfileSchema.version,
    Schema: SystemProfileSchema,
    validate: validateSystemProfile,
    register: registerProfile,
    get: (id) => registry.get(id) || null,
    getAll: () => Array.from(registry.values()),
    getApprovedConfigurations: (familyId) => {
      return Array.from(registry.values()).filter(p => p.familyId === familyId && p.status === 'active');
    },
    CANONICAL_HYBRID_1P_5KW: canonicalProfileHyb1p5kwV1,
    PROFILE_ONG_1P_5KW: profileOng1p5kwV1,
    PROFILE_HYB_1P_10KW: profileHyb1p10kwV1,
    PROFILE_OFF_1P_5KW: profileOff1p5kwV1,
    PROFILE_HYB_3P_15KW: profileHyb3p15kwV1
  });

  // Clean Browser Export
  if (typeof window !== 'undefined') {
    window.SystemProfiles = SystemProfiles;
    window.SystemProfileSchema = SystemProfileSchema;
  }

  // Clean Node.js / CommonJS Export
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      SystemProfiles,
      SystemProfileSchema,
      validateSystemProfile,
      canonicalProfileHyb1p5kwV1,
      profileOng1p5kwV1,
      profileHyb1p10kwV1,
      profileOff1p5kwV1,
      profileHyb3p15kwV1
    };
  }
})();
