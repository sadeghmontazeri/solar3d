/**
 * Builder script to generate js/sld-schematic.js
 * Implements HYB-FA-001 Rev A (Single-Phase SLD-01) with Interactive SBY Changeover Switch
 */

const fs = require('fs');
const path = require('path');

const sldScript = `/**
 * ==============================================================================
 * 5kW Single-Phase Hybrid Solar PV 3D Simulator
 * Interactive Single Line Diagram (SLD-01) per HYB-FA-001 Rev A & IEC 60364-7-712
 * ==============================================================================
 */

(function () {
  let svgContainer = null;
  let currentZoom = 1.0;
  let panX = 0;
  let panY = 0;
  let isPanning = false;
  let startX = 0;
  let startY = 0;

  // Breaker and switch states
  const breakerStates = {
    q0_mcb: true,        // Main Grid Incomer MCB
    qn_mcb: true,        // Non-essential Loads MCB
    qg_mcb: true,        // Inverter Grid Port MCB
    qbp_mcb: true,       // Bypass Source II MCB
    fspd_mcb: true,      // AC-SPD Backup MCB
    dc_isolator: true,   // DC Isolator QPV
    qpv_isolator: true,  // Alias
    battery_ocpd: true,  // Battery DC Breaker QB
    battery_qb: true,    // Alias
    eps_mcb: true,       // EPS Output MCB QE
    qe_mcb: true,        // Alias
    sby_switch: 'I',     // SBY 3-Position Switch: 'I' (EPS), '0' (OFF), 'II' (Grid Bypass)
    qo_mcb: true         // Essential DB Incomer MCB
  };

  /**
   * Initializes the SLD Schematic inside the specified container ID
   */
  function init(containerId) {
    svgContainer = document.getElementById(containerId);
    if (!svgContainer) return;

    renderSvgSchematic();
    setupPanAndZoom();
    bindSymbolEvents();
  }

  /**
   * Renders the complete HYB-FA-001 SLD-01 SVG Schematic
   */
  function renderSvgSchematic() {
    // Canvas dimensions: 1280 x 780
    const svgMarkup = \`
    <svg id="sld-svg-canvas" viewBox="0 0 1280 780" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- Gradients -->
        <linearGradient id="invGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1e293b" />
          <stop offset="100%" stop-color="#0f172a" />
        </linearGradient>
        <linearGradient id="pvGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.35" />
          <stop offset="100%" stop-color="#1e3a8a" stop-opacity="0.65" />
        </linearGradient>
        <linearGradient id="batGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#059669" stop-opacity="0.3" />
          <stop offset="100%" stop-color="#064e3b" stop-opacity="0.6" />
        </linearGradient>
        <linearGradient id="panelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1e293b" />
          <stop offset="100%" stop-color="#0f172a" />
        </linearGradient>
        <linearGradient id="bypassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0284c7" stop-opacity="0.25" />
          <stop offset="100%" stop-color="#0369a1" stop-opacity="0.45" />
        </linearGradient>

        <!-- Glow Filters -->
        <filter id="glow-solar" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="glow-grid" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      <!-- Blueprint Grid Background -->
      <g stroke="rgba(255,255,255,0.03)" stroke-width="1">
        \${Array.from({ length: 26 }).map((_, i) => \`<line x1="\${i * 50}" y1="0" x2="\${i * 50}" y2="780" />\`).join('')}
        \${Array.from({ length: 16 }).map((_, i) => \`<line x1="0" y1="\${i * 50}" x2="1280" y2="\${i * 50}" />\`).join('')}
      </g>

      <!-- Standard Specification Header -->
      <text x="640" y="28" fill="#94a3b8" font-size="13" font-family="'Vazirmatn', sans-serif" font-weight="700" text-anchor="middle">
        نقشه تک‌خطی سامانه خورشیدی هیبرید ۵ کیلووات (SLD-01) — استاندارد HYB-FA-001 Rev A و IEC 60364-7-712
      </text>

      <!-- Main Transformation / Pan-Zoom Group -->
      <g id="sld-pan-zoom-group" transform="translate(0, 0) scale(1)">

        <!-- ================================================================= -->
        <!-- 1. DC-01: SOLAR PV SUBSYSTEM (TOP LEFT)                           -->
        <!-- ================================================================= -->
        <!-- PV String 1 -->
        <g class="sld-component-node" data-component="pv_modules" transform="translate(50, 55)" style="cursor:pointer">
          <rect width="110" height="65" rx="8" fill="url(#pvGrad)" stroke="#38bdf8" stroke-width="1.8" />
          <line x1="18" y1="18" x2="92" y2="18" stroke="#38bdf8" stroke-width="0.8" opacity="0.6"/>
          <line x1="18" y1="32" x2="92" y2="32" stroke="#38bdf8" stroke-width="0.8" opacity="0.6"/>
          <line x1="18" y1="46" x2="92" y2="46" stroke="#38bdf8" stroke-width="0.8" opacity="0.6"/>
          <line x1="42" y1="10" x2="42" y2="54" stroke="#38bdf8" stroke-width="0.8" opacity="0.6"/>
          <line x1="68" y1="10" x2="68" y2="54" stroke="#38bdf8" stroke-width="0.8" opacity="0.6"/>
          <text x="55" y="-8" fill="#f59e0b" font-size="11" font-weight="700" text-anchor="middle">استرینگ خورشیدی ۱</text>
          <text x="55" y="60" fill="#94a3b8" font-size="8.5" text-anchor="middle">7x 400W (Voc 385V)</text>
        </g>

        <!-- PV String 2 -->
        <g class="sld-component-node" data-component="pv_modules" transform="translate(50, 150)" style="cursor:pointer">
          <rect width="110" height="65" rx="8" fill="url(#pvGrad)" stroke="#38bdf8" stroke-width="1.8" />
          <line x1="18" y1="18" x2="92" y2="18" stroke="#38bdf8" stroke-width="0.8" opacity="0.6"/>
          <line x1="18" y1="32" x2="92" y2="32" stroke="#38bdf8" stroke-width="0.8" opacity="0.6"/>
          <line x1="18" y1="46" x2="92" y2="46" stroke="#38bdf8" stroke-width="0.8" opacity="0.6"/>
          <line x1="42" y1="10" x2="42" y2="54" stroke="#38bdf8" stroke-width="0.8" opacity="0.6"/>
          <line x1="68" y1="10" x2="68" y2="54" stroke="#38bdf8" stroke-width="0.8" opacity="0.6"/>
          <text x="55" y="-8" fill="#f59e0b" font-size="11" font-weight="700" text-anchor="middle">استرینگ خورشیدی ۲</text>
          <text x="55" y="60" fill="#94a3b8" font-size="8.5" text-anchor="middle">7x 400W (Voc 385V)</text>
        </g>

        <!-- gPV Cylindrical Fuses (+ & - poles) -->
        <g class="sld-component-node" data-component="string_fuse" transform="translate(195, 87)" style="cursor:pointer">
          <rect x="-12" y="-16" width="24" height="32" rx="4" fill="#1e293b" stroke="#f59e0b" stroke-width="1.5" />
          <line x1="0" y1="-16" x2="0" y2="16" stroke="#f59e0b" stroke-width="2" />
          <text x="0" y="-22" fill="#fbbf24" font-size="8.5" font-weight="700" text-anchor="middle">gPV 15A (+/-)</text>
        </g>
        <g class="sld-component-node" data-component="string_fuse" transform="translate(195, 182)" style="cursor:pointer">
          <rect x="-12" y="-16" width="24" height="32" rx="4" fill="#1e293b" stroke="#f59e0b" stroke-width="1.5" />
          <line x1="0" y1="-16" x2="0" y2="16" stroke="#f59e0b" stroke-width="2" />
          <text x="0" y="-22" fill="#fbbf24" font-size="8.5" font-weight="700" text-anchor="middle">gPV 15A (+/-)</text>
        </g>

        <!-- QPV: DC Switch-Disconnector (DC-PV2 1000V 32A) -->
        <g class="sld-component-node sld-breaker-symbol" id="sld-dc-isolator" data-component="qpv_isolator" data-breaker="dc_isolator" transform="translate(275, 135)" style="cursor:pointer">
          <circle cx="0" cy="0" r="22" fill="#1e293b" stroke="#f59e0b" stroke-width="2" />
          <line id="dc-isolator-blade" x1="-10" y1="8" x2="10" y2="-8" stroke="#22c55e" stroke-width="3.5" stroke-linecap="round" />
          <circle cx="-10" cy="8" r="3" fill="#fff" />
          <circle cx="10" cy="-8" r="3" fill="#fff" />
          <text x="0" y="-28" fill="#f59e0b" font-size="9.5" font-weight="700" text-anchor="middle">QPV: ایزولاتور DC</text>
          <text x="0" y="36" fill="#94a3b8" font-size="8.5" text-anchor="middle">1000V 32A DC-PV2</text>
        </g>

        <!-- DC SPD Type II -->
        <g class="sld-component-node" data-component="dc_spd" transform="translate(355, 180)" style="cursor:pointer">
          <rect x="-16" y="-22" width="32" height="44" rx="4" fill="#1e293b" stroke="#ef4444" stroke-width="1.5" />
          <path d="M-8,-12 L8,12 M-12,-12 L-8,-12 M8,12 L12,12" stroke="#ef4444" stroke-width="2" fill="none" />
          <text x="0" y="-28" fill="#ef4444" font-size="8.5" font-weight="700" text-anchor="middle">ارستر DC</text>
          <text x="0" y="34" fill="#94a3b8" font-size="8" text-anchor="middle">Type 2 600V</text>
        </g>

        <!-- DC Wiring Lines -->
        <line x1="160" y1="87" x2="183" y2="87" stroke="#f59e0b" stroke-width="2.5" />
        <line x1="207" y1="87" x2="245" y2="87" stroke="#f59e0b" stroke-width="2.5" />
        <line x1="245" y1="87" x2="245" y2="135" stroke="#f59e0b" stroke-width="2.5" />
        <line x1="245" y1="135" x2="253" y2="135" stroke="#f59e0b" stroke-width="2.5" />

        <line x1="160" y1="182" x2="183" y2="182" stroke="#f59e0b" stroke-width="2.5" />
        <line x1="207" y1="182" x2="245" y2="182" stroke="#f59e0b" stroke-width="2.5" />
        <line x1="245" y1="182" x2="245" y2="135" stroke="#f59e0b" stroke-width="2.5" />

        <line x1="297" y1="135" x2="415" y2="135" stroke="#f59e0b" stroke-width="2.5" />
        <!-- DC SPD shunt -->
        <line x1="355" y1="135" x2="355" y2="158" stroke="#f59e0b" stroke-width="1.8" />
        <line x1="355" y1="202" x2="355" y2="650" stroke="#22c55e" stroke-width="1.8" stroke-dasharray="4,3" />

        <!-- Animated DC PV Flow -->
        <line id="flow-pv-dc" x1="160" y1="87" x2="415" y2="135" stroke="#fde047" stroke-width="3.5" class="flow-anim" stroke-linecap="round" opacity="0.85" />

        <!-- ================================================================= -->
        <!-- 2. DC-02: BATTERY STORAGE SUBSYSTEM (BOTTOM LEFT)                 -->
        <!-- ================================================================= -->
        <!-- Battery Bank LiFePO4 -->
        <g class="sld-component-node" data-component="battery_bank" transform="translate(50, 440)" style="cursor:pointer">
          <rect width="130" height="90" rx="10" fill="url(#batGrad)" stroke="#10b981" stroke-width="2" />
          <line x1="35" y1="35" x2="95" y2="35" stroke="#10b981" stroke-width="4" />
          <line x1="45" y1="45" x2="85" y2="45" stroke="#10b981" stroke-width="2.5" />
          <line x1="35" y1="55" x2="95" y2="55" stroke="#10b981" stroke-width="4" />
          <line x1="45" y1="65" x2="85" y2="65" stroke="#10b981" stroke-width="2.5" />
          <text x="65" y="-10" fill="#10b981" font-size="11" font-weight="700" text-anchor="middle">بانک باتری LiFePO4 (BESS)</text>
          <text x="65" y="24" fill="#34d399" font-size="8.5" text-anchor="middle">51.2V 100Ah (5.12kWh)</text>
        </g>

        <!-- Current Shunt & BMS Interface -->
        <g class="sld-component-node" data-component="battery_shunt" transform="translate(210, 455)" style="cursor:pointer">
          <rect x="-18" y="-22" width="36" height="44" rx="6" fill="#1e293b" stroke="#06b6d4" stroke-width="1.8" />
          <text x="0" y="-4" fill="#06b6d4" font-size="8.5" font-weight="700" text-anchor="middle">BMS/شنت</text>
          <text x="0" y="12" fill="#94a3b8" font-size="7.5" text-anchor="middle">CAN Bus</text>
        </g>
        <!-- BMS Data Line to Inverter -->
        <line x1="210" y1="433" x2="210" y2="385" stroke="#06b6d4" stroke-width="1.5" stroke-dasharray="3,2" />
        <line x1="210" y1="385" x2="415" y2="385" stroke="#06b6d4" stroke-width="1.5" stroke-dasharray="3,2" />
        <text x="310" y="380" fill="#06b6d4" font-size="7.5" text-anchor="middle">دیتای ایزوله CAN/RS485</text>

        <!-- QB: Battery DC Breaker / OCPD 125A + Pre-charge -->
        <g class="sld-component-node sld-breaker-symbol" id="sld-bat-breaker" data-component="battery_qb" data-breaker="battery_ocpd" transform="translate(305, 455)" style="cursor:pointer">
          <circle cx="0" cy="0" r="22" fill="#1e293b" stroke="#10b981" stroke-width="2" />
          <line id="bat-breaker-blade" x1="-10" y1="8" x2="10" y2="-8" stroke="#22c55e" stroke-width="3.5" stroke-linecap="round" />
          <circle cx="-10" cy="8" r="3" fill="#fff" />
          <circle cx="10" cy="-8" r="3" fill="#fff" />
          <text x="0" y="-28" fill="#10b981" font-size="9.5" font-weight="700" text-anchor="middle">QB: بریکر باتری DC</text>
          <text x="0" y="36" fill="#94a3b8" font-size="8.5" text-anchor="middle">125A DC 10kA + پیش‌شارژ</text>
        </g>

        <!-- Battery Power Lines -->
        <line x1="180" y1="455" x2="192" y2="455" stroke="#10b981" stroke-width="3.5" />
        <line x1="228" y1="455" x2="283" y2="455" stroke="#10b981" stroke-width="3.5" />
        <line x1="327" y1="455" x2="415" y2="455" stroke="#10b981" stroke-width="3.5" />

        <!-- Animated Battery Flow Overlay -->
        <line id="flow-bat-dc" x1="180" y1="455" x2="415" y2="455" stroke="#34d399" stroke-width="3.5" class="flow-anim" stroke-linecap="round" opacity="0.85" />

        <!-- ================================================================= -->
        <!-- 3. HYBRID INVERTER 5KW (CENTER CORE)                              -->
        <!-- ================================================================= -->
        <g class="sld-component-node" data-component="hybrid_inverter" transform="translate(415, 75)" style="cursor:pointer">
          <!-- Outer Box -->
          <rect width="250" height="430" rx="14" fill="url(#invGrad)" stroke="#f59e0b" stroke-width="2.5" />
          <rect x="10" y="10" width="230" height="28" rx="6" fill="rgba(0,0,0,0.45)" />
          <text x="125" y="29" fill="#f59e0b" font-size="11.5" font-weight="800" text-anchor="middle">اینورتر هایبرید ۵ کیلووات (HYB-5K)</text>

          <!-- MPPT Stage -->
          <g transform="translate(15, 50)">
            <rect width="85" height="48" rx="6" fill="#1e293b" stroke="#38bdf8" stroke-width="1.2" />
            <text x="42" y="22" fill="#38bdf8" font-size="8.5" font-weight="700" text-anchor="middle">Dual MPPT</text>
            <text x="42" y="38" fill="#94a3b8" font-size="7.5" text-anchor="middle">125V - 500V</text>
          </g>

          <!-- Internal 400V DC Bus -->
          <line x1="110" y1="74" x2="145" y2="74" stroke="#f59e0b" stroke-width="4" />
          <text x="128" y="66" fill="#fbbf24" font-size="7.5" text-anchor="middle">باس DC</text>

          <!-- Bidirectional DC/DC Battery Stage -->
          <g transform="translate(15, 330)">
            <rect width="85" height="48" rx="6" fill="#1e293b" stroke="#10b981" stroke-width="1.2" />
            <text x="42" y="22" fill="#10b981" font-size="8.5" font-weight="700" text-anchor="middle">DC/DC دوطرفه</text>
            <text x="42" y="38" fill="#94a3b8" font-size="7.5" text-anchor="middle">48V / 100A</text>
          </g>
          <line x1="110" y1="354" x2="145" y2="354" stroke="#f59e0b" stroke-width="4" />

          <!-- Main SPWM Inverter Stage -->
          <g transform="translate(145, 115)">
            <rect width="90" height="85" rx="8" fill="#1e293b" stroke="#f59e0b" stroke-width="1.5" />
            <line x1="10" y1="75" x2="80" y2="10" stroke="#64748b" stroke-width="1" />
            <text x="22" y="32" fill="#f59e0b" font-size="12" font-weight="800">=</text>
            <path d="M 55,60 Q 62,45 70,60 T 85,60" stroke="#3b82f6" stroke-width="2" fill="none" />
            <text x="45" y="75" fill="#e2e8f0" font-size="8" text-anchor="middle">پل SPWM تمام‌موج</text>
          </g>

          <!-- KSEP & KNE Relays Unit -->
          <g class="sld-component-node" data-component="ksep_relay" transform="translate(145, 225)" style="cursor:pointer">
            <rect width="90" height="65" rx="6" fill="#111827" stroke="#a855f7" stroke-width="1.2" />
            <text x="45" y="18" fill="#c084fc" font-size="8" font-weight="700" text-anchor="middle">KSEP: رله ضدجزیره</text>
            <text x="45" y="34" fill="#94a3b8" font-size="7.5" text-anchor="middle">&lt;20ms ایزولاسیون شبکه</text>
            <text x="45" y="52" fill="#34d399" font-size="8" font-weight="700" text-anchor="middle">KNE: پیوند N-PE جزیره</text>
          </g>

          <!-- Internal Bus lines -->
          <line x1="58" y1="98" x2="58" y2="330" stroke="#f59e0b" stroke-width="2.5" />
          <line x1="58" y1="157" x2="145" y2="157" stroke="#f59e0b" stroke-width="2.5" />
          <line x1="190" y1="200" x2="190" y2="225" stroke="#3b82f6" stroke-width="2.5" />

          <!-- Inverter Terminals -->
          <text x="242" y="160" fill="#3b82f6" font-size="9.5" font-weight="700">GRID</text>
          <text x="242" y="380" fill="#a855f7" font-size="9.5" font-weight="700">EPS</text>
          <text x="5" y="60" fill="#f59e0b" font-size="9.5" font-weight="700" text-anchor="end">PV IN</text>
          <text x="5" y="365" fill="#10b981" font-size="9.5" font-weight="700" text-anchor="end">BAT IN</text>
        </g>

        <!-- ================================================================= -->
        <!-- 4. UTILITY PCC, BUS-G & GRID DISTRIBUTION (TOP RIGHT)             -->
        <!-- ================================================================= -->

        <!-- Utility PCC Entrance (M0 Meter) -->
        <g class="sld-component-node" data-component="m0_meter" transform="translate(1140, 90)" style="cursor:pointer">
          <rect x="-30" y="-22" width="60" height="44" rx="6" fill="#1e3a8a" stroke="#3b82f6" stroke-width="2" />
          <text x="0" y="-4" fill="#93c5fd" font-size="8.5" font-weight="800" text-anchor="middle">M0: کنتور برق</text>
          <text x="0" y="12" fill="#bfdbfe" font-size="7.5" text-anchor="middle">دوطرفه PCC</text>
        </g>

        <!-- Q0: Main Grid Incomer MCB 2P 40A Curve C -->
        <g class="sld-component-node sld-breaker-symbol" id="sld-q0-mcb" data-component="q0_mcb" data-breaker="q0_mcb" transform="translate(1045, 90)" style="cursor:pointer">
          <circle cx="0" cy="0" r="20" fill="#1e293b" stroke="#3b82f6" stroke-width="2" />
          <line id="q0-mcb-blade" x1="-9" y1="7" x2="9" y2="-7" stroke="#22c55e" stroke-width="3.5" stroke-linecap="round" />
          <circle cx="-9" cy="7" r="2.5" fill="#fff" />
          <circle cx="9" cy="-7" r="2.5" fill="#fff" />
          <text x="0" y="-26" fill="#3b82f6" font-size="9" font-weight="800" text-anchor="middle">Q0: کلید اصلی انشعاب</text>
          <text x="0" y="32" fill="#94a3b8" font-size="8" text-anchor="middle">2P 40A Curve C (10kA)</text>
        </g>

        <!-- Split-Core CT Toroid (P1 -> P2 arrow towards loads) -->
        <g class="sld-component-node" data-component="ct_pcc" transform="translate(965, 90)" style="cursor:pointer">
          <circle cx="0" cy="0" r="14" fill="#0f172a" stroke="#f59e0b" stroke-width="2.5" />
          <line x1="-7" y1="-7" x2="7" y2="7" stroke="#f59e0b" stroke-width="2" />
          <text x="0" y="-18" fill="#f59e0b" font-size="8.5" font-weight="700" text-anchor="middle">ترانس CT</text>
          <text x="0" y="24" fill="#94a3b8" font-size="7.5" text-anchor="middle">K ▶▶ L (Zero-Exp)</text>
        </g>

        <!-- CT signal cable to Inverter -->
        <line x1="965" y1="104" x2="965" y2="120" stroke="#f59e0b" stroke-width="1.2" stroke-dasharray="3,2" />
        <line x1="965" y1="120" x2="665" y2="120" stroke="#f59e0b" stroke-width="1.2" stroke-dasharray="3,2" />

        <!-- Line from M0 to Q0 to CT to BUS-G -->
        <line x1="1110" y1="90" x2="1065" y2="90" stroke="#3b82f6" stroke-width="3.5" />
        <line x1="1025" y1="90" x2="979" y2="90" stroke="#3b82f6" stroke-width="3.5" />
        <line x1="951" y1="90" x2="910" y2="90" stroke="#3b82f6" stroke-width="3.5" />

        <!-- BUS-G: Main Grid Distribution Busbar (Heavy Copper) -->
        <g class="sld-component-node" data-component="bus_g" transform="translate(885, 75)" style="cursor:pointer">
          <rect x="0" y="0" width="25" height="210" rx="4" fill="#d97706" stroke="#f59e0b" stroke-width="1.5" />
          <text x="12" y="105" fill="#ffffff" font-size="9" font-weight="800" text-anchor="middle" transform="rotate(-90, 12, 105)">شینه توزیع شبکه BUS-G (63A 2P)</text>
        </g>

        <!-- Feeder 1: QN -> Non-Essential DB -->
        <line x1="885" y1="115" x2="840" y2="115" stroke="#3b82f6" stroke-width="2.5" />
        <g class="sld-component-node sld-breaker-symbol" id="sld-qn-mcb" data-component="qn_mcb" data-breaker="qn_mcb" transform="translate(820, 115)" style="cursor:pointer">
          <circle cx="0" cy="0" r="16" fill="#1e293b" stroke="#3b82f6" stroke-width="1.8" />
          <line id="qn-mcb-blade" x1="-7" y1="5" x2="7" y2="-5" stroke="#22c55e" stroke-width="3" stroke-linecap="round" />
          <text x="0" y="-20" fill="#3b82f6" font-size="8" font-weight="700" text-anchor="middle">QN: مینیاتوری عادی</text>
        </g>
        <line x1="804" y1="115" x2="760" y2="115" stroke="#3b82f6" stroke-width="2.5" />

        <!-- Non-Essential Sub-Panel (A/C, EV, Heaters) -->
        <g class="sld-component-node" data-component="non_essential_db" transform="translate(685, 95)" style="cursor:pointer">
          <rect width="75" height="42" rx="4" fill="#0f172a" stroke="#475569" stroke-width="1.2" />
          <text x="37" y="18" fill="#94a3b8" font-size="8" font-weight="700" text-anchor="middle">بارهای عادی</text>
          <text x="37" y="32" fill="#64748b" font-size="7.5" text-anchor="middle">کولر / شارژر / هیتر</text>
        </g>

        <!-- Feeder 2: QG -> Inverter Grid Port -->
        <line x1="885" y1="175" x2="780" y2="175" stroke="#3b82f6" stroke-width="3" />
        <g class="sld-component-node sld-breaker-symbol" id="sld-qg-mcb" data-component="qg_mcb" data-breaker="qg_mcb" transform="translate(760, 175)" style="cursor:pointer">
          <circle cx="0" cy="0" r="18" fill="#1e293b" stroke="#3b82f6" stroke-width="2" />
          <line id="qg-mcb-blade" x1="-8" y1="6" x2="8" y2="-6" stroke="#22c55e" stroke-width="3" stroke-linecap="round" />
          <circle cx="-8" cy="6" r="2" fill="#fff" />
          <circle cx="8" cy="-6" r="2" fill="#fff" />
          <text x="0" y="-23" fill="#3b82f6" font-size="8.5" font-weight="700" text-anchor="middle">QG: پورت شبکه اینورتر</text>
          <text x="0" y="28" fill="#94a3b8" font-size="7.5" text-anchor="middle">2P 25A Curve C</text>
        </g>
        <line x1="742" y1="175" x2="665" y2="175" stroke="#3b82f6" stroke-width="3" />

        <!-- Feeder 3: QBP -> SBY Bypass Source II -->
        <line x1="885" y1="235" x2="980" y2="235" stroke="#0284c7" stroke-width="2.5" />
        <g class="sld-component-node sld-breaker-symbol" id="sld-qbp-mcb" data-component="qbp_mcb" data-breaker="qbp_mcb" transform="translate(1005, 235)" style="cursor:pointer">
          <circle cx="0" cy="0" r="18" fill="#1e293b" stroke="#0284c7" stroke-width="2" />
          <line id="qbp-mcb-blade" x1="-8" y1="6" x2="8" y2="-6" stroke="#22c55e" stroke-width="3" stroke-linecap="round" />
          <circle cx="-8" cy="6" r="2" fill="#fff" />
          <circle cx="8" cy="-6" r="2" fill="#fff" />
          <text x="0" y="-23" fill="#38bdf8" font-size="8.5" font-weight="700" text-anchor="middle">QBP: فیدر بای‌پس دستی</text>
          <text x="0" y="28" fill="#94a3b8" font-size="7.5" text-anchor="middle">2P 25A Curve C</text>
        </g>
        <!-- Bypass line routing down to SBY Terminal II -->
        <line x1="1023" y1="235" x2="1080" y2="235" stroke="#0284c7" stroke-width="2.5" />
        <line x1="1080" y1="235" x2="1080" y2="445" stroke="#0284c7" stroke-width="2.5" />
        <line x1="1080" y1="445" x2="965" y2="445" stroke="#0284c7" stroke-width="2.5" />

        <!-- Feeder 4: FSPD -> AC-SPD -> MET -->
        <line x1="910" y1="265" x2="960" y2="265" stroke="#3b82f6" stroke-width="2" />
        <g class="sld-component-node sld-breaker-symbol" id="sld-fspd-mcb" data-component="fspd_mcb" data-breaker="fspd_mcb" transform="translate(980, 265)" style="cursor:pointer">
          <rect x="-10" y="-12" width="20" height="24" rx="3" fill="#1e293b" stroke="#ef4444" stroke-width="1.5" />
          <line x1="0" y1="-12" x2="0" y2="12" stroke="#ef4444" stroke-width="1.8" />
          <text x="0" y="-16" fill="#ef4444" font-size="7.5" font-weight="700" text-anchor="middle">FSPD (25A)</text>
        </g>
        <line x1="990" y1="265" x2="1025" y2="265" stroke="#3b82f6" stroke-width="2" />
        <g class="sld-component-node" data-component="ac_spd" transform="translate(1045, 265)" style="cursor:pointer">
          <rect x="-18" y="-16" width="36" height="32" rx="4" fill="#1e293b" stroke="#0284c7" stroke-width="1.5" />
          <text x="0" y="-4" fill="#38bdf8" font-size="8" font-weight="700" text-anchor="middle">AC-SPD</text>
          <text x="0" y="10" fill="#94a3b8" font-size="7" text-anchor="middle">Type 2 In=20kA</text>
        </g>
        <!-- SPD lead to MET (<0.5m standard compliance) -->
        <line x1="1045" y1="281" x2="1045" y2="650" stroke="#22c55e" stroke-width="2" stroke-dasharray="4,3" />

        <!-- Animated Grid Flow Line -->
        <line id="flow-grid-ac" x1="1110" y1="90" x2="665" y2="175" stroke="#60a5fa" stroke-width="3" class="flow-anim" stroke-linecap="round" opacity="0.85" />
        <line id="flow-bypass-ac" x1="1023" y1="235" x2="965" y2="445" stroke="#38bdf8" stroke-width="3" class="flow-anim" stroke-linecap="round" style="display:none" />

        <!-- ================================================================= -->
        <!-- 5. EPS OUTPUT, SBY CHANGEOVER SWITCH & ESSENTIAL DB (BOTTOM RIGHT)-->
        <!-- ================================================================= -->

        <!-- Inverter EPS Port Outfeed -->
        <line x1="665" y1="415" x2="735" y2="415" stroke="#7c3aed" stroke-width="3.5" />

        <!-- QE: Inverter EPS Output MCB (2P 25A Curve C) -->
        <g class="sld-component-node sld-breaker-symbol" id="sld-qe-mcb" data-component="qe_mcb" data-breaker="eps_mcb" transform="translate(755, 415)" style="cursor:pointer">
          <circle cx="0" cy="0" r="18" fill="#1e293b" stroke="#7c3aed" stroke-width="2" />
          <line id="eps-mcb-blade" x1="-8" y1="6" x2="8" y2="-6" stroke="#22c55e" stroke-width="3" stroke-linecap="round" />
          <circle cx="-8" cy="6" r="2" fill="#fff" />
          <circle cx="8" cy="-6" r="2" fill="#fff" />
          <text x="0" y="-24" fill="#a855f7" font-size="8.5" font-weight="700" text-anchor="middle">QE: خروجی اضطراری EPS</text>
          <text x="0" y="28" fill="#94a3b8" font-size="7.5" text-anchor="middle">2P 25A Curve C</text>
        </g>
        <line x1="773" y1="415" x2="845" y2="415" stroke="#7c3aed" stroke-width="3.5" />

        <!-- SBY: 3-Position Changeover / Bypass Switch (I - 0 - II, Break-Before-Make) -->
        <g class="sld-component-node sld-breaker-symbol" id="sld-sby-switch" data-component="sby_switch" data-breaker="sby_switch" transform="translate(905, 430)" style="cursor:pointer">
          <!-- Outer Switch Housing -->
          <rect x="-65" y="-55" width="130" height="110" rx="8" fill="#1e293b" stroke="#f59e0b" stroke-width="2" />
          <text x="0" y="-40" fill="#f59e0b" font-size="9.5" font-weight="800" text-anchor="middle">کلید گردان تبدیل دستی SBY</text>
          <text x="0" y="-26" fill="#94a3b8" font-size="7.5" text-anchor="middle">2P Break-Before-Make (I - 0 - II)</text>

          <!-- Source I Contact (Top: EPS) -->
          <circle cx="-45" cy="-10" r="5" fill="#7c3aed" />
          <text x="-45" y="-18" fill="#c084fc" font-size="8.5" font-weight="800" text-anchor="middle">I (EPS)</text>

          <!-- Position 0 (Middle: OFF/Isolated) -->
          <circle cx="0" cy="5" r="4" fill="#64748b" />
          <text x="0" y="20" fill="#94a3b8" font-size="8" font-weight="800" text-anchor="middle">0 (قطع)</text>

          <!-- Source II Contact (Bottom: Grid Bypass) -->
          <circle cx="45" cy="20" r="5" fill="#0284c7" />
          <text x="45" y="36" fill="#38bdf8" font-size="8.5" font-weight="800" text-anchor="middle">II (بای‌پاس)</text>

          <!-- Common Output Pivot Terminal (Bottom Center) -->
          <circle cx="0" cy="40" r="4" fill="#22c55e" />

          <!-- Dynamic Rotary Changeover Blade -->
          <line id="sby-blade" x1="0" y1="40" x2="-45" y2="-10" stroke="#22c55e" stroke-width="4" stroke-linecap="round" />

          <!-- Click Hint -->
          <text x="0" y="52" fill="#fbbf24" font-size="7" font-weight="700" text-anchor="middle">کلیک جهت تغییر منبع (I - 0 - II)</text>
        </g>

        <!-- Connecting lead from QE to SBY Terminal I -->
        <line x1="845" y1="415" x2="860" y2="420" stroke="#7c3aed" stroke-width="3" />

        <!-- Output from SBY Common to QO -->
        <line x1="905" y1="485" x2="905" y2="520" stroke="#f59e0b" stroke-width="3" />
        <line x1="905" y1="520" x2="945" y2="520" stroke="#f59e0b" stroke-width="3" />

        <!-- QO: Essential DB Incomer MCB (2P 25A Curve C) -->
        <g class="sld-component-node sld-breaker-symbol" id="sld-qo-mcb" data-component="qo_mcb" data-breaker="qo_mcb" transform="translate(970, 520)" style="cursor:pointer">
          <circle cx="0" cy="0" r="18" fill="#1e293b" stroke="#f59e0b" stroke-width="2" />
          <line id="qo-mcb-blade" x1="-8" y1="6" x2="8" y2="-6" stroke="#22c55e" stroke-width="3" stroke-linecap="round" />
          <circle cx="-8" cy="6" r="2" fill="#fff" />
          <circle cx="8" cy="-6" r="2" fill="#fff" />
          <text x="0" y="-23" fill="#f59e0b" font-size="8.5" font-weight="700" text-anchor="middle">QO: ورودی تابلوی بحرانی</text>
          <text x="0" y="28" fill="#94a3b8" font-size="7.5" text-anchor="middle">2P 25A Curve C (6kA)</text>
        </g>
        <line x1="988" y1="520" x2="1035" y2="520" stroke="#f59e0b" stroke-width="3" />

        <!-- Essential DB Enclosure & Dedicated Circuits -->
        <g class="sld-component-node" data-component="essential_db" transform="translate(1035, 410)" style="cursor:pointer">
          <rect width="215" height="205" rx="8" fill="url(#panelGrad)" stroke="#7c3aed" stroke-width="2" />
          <rect x="0" y="0" width="215" height="24" rx="4" fill="#7c3aed" />
          <text x="107" y="16" fill="#ffffff" font-size="10" font-weight="800" text-anchor="middle">تابلوی بارهای بحرانی (Essential DB)</text>

          <!-- Dedicated Isolated Neutral Bar -->
          <rect x="10" y="30" width="195" height="22" rx="3" fill="#083344" stroke="#06b6d4" stroke-width="1.2" />
          <text x="107" y="45" fill="#22d3ee" font-size="8" font-weight="800" text-anchor="middle">شینه نول ایزوله N-EPS (بدون اتصال به شبکه)</text>

          <!-- Branch RCBOs Group -->
          <g transform="translate(10, 60)">
            <rect width="195" height="135" rx="4" fill="#0f172a" stroke="#7e22ce" stroke-width="1" />
            <text x="97" y="18" fill="#f0abfc" font-size="9" font-weight="700" text-anchor="middle">کلیدهای محافظ جان ترکیبی (RCBOs)</text>
            
            <!-- Circuit 1: Lighting -->
            <rect x="8" y="26" width="179" height="22" rx="3" fill="#1e293b" stroke="#334155" />
            <text x="16" y="41" fill="#fde047" font-size="8" font-weight="700">روشنایی اضطراری</text>
            <text x="180" y="41" fill="#94a3b8" font-size="7.5" text-anchor="end">RCBO 10A 30mA (تیپ A)</text>

            <!-- Circuit 2: Fridge -->
            <rect x="8" y="52" width="179" height="22" rx="3" fill="#1e293b" stroke="#334155" />
            <text x="16" y="67" fill="#67e8f9" font-size="8" font-weight="700">یخچال و فریزر</text>
            <text x="180" y="67" fill="#94a3b8" font-size="7.5" text-anchor="end">RCBO 16A 30mA (تیپ A)</text>

            <!-- Circuit 3: Security & CCTV -->
            <rect x="8" y="78" width="179" height="22" rx="3" fill="#1e293b" stroke="#334155" />
            <text x="16" y="93" fill="#86efac" font-size="8" font-weight="700">دوربین، دزدگیر، سرور</text>
            <text x="180" y="93" fill="#94a3b8" font-size="7.5" text-anchor="end">RCBO 16A 30mA (تیپ A)</text>

            <!-- Circuit 4: Medical / Critical -->
            <rect x="8" y="104" width="179" height="22" rx="3" fill="#1e293b" stroke="#334155" />
            <text x="16" y="119" fill="#f472b6" font-size="8" font-weight="700">تجهیزات پزشکی / پکیج</text>
            <text x="180" y="119" fill="#94a3b8" font-size="7.5" text-anchor="end">RCBO 16A 30mA (تیپ A)</text>
          </g>
        </g>

        <!-- Animated EPS Flow Line -->
        <line id="flow-eps-ac" x1="665" y1="415" x2="1035" y2="520" stroke="#c084fc" stroke-width="3.5" class="flow-anim" stroke-linecap="round" opacity="0.85" />

        <!-- ================================================================= -->
        <!-- 6. MAIN EARTHING & BONDING SYSTEM (MET BAR)                       -->
        <!-- ================================================================= -->
        <g class="sld-component-node" data-component="met_bar" transform="translate(180, 650)" style="cursor:pointer">
          <rect width="920" height="18" rx="4" fill="#b45309" stroke="#f59e0b" stroke-width="1.5" />
          <text x="460" y="34" fill="#22c55e" font-size="11" font-weight="800" text-anchor="middle">شینه اصلی اتصال زمین و هم‌پتانسیل‌سازی (Main Earthing Terminal - MET Bar مس خالص ۳۰x۵ میلی‌متر)</text>
          
          <!-- Earth electrode connection -->
          <line x1="140" y1="18" x2="140" y2="65" stroke="#22c55e" stroke-width="3" />
          <g transform="translate(140, 65)">
            <line x1="-24" y1="0" x2="24" y2="0" stroke="#22c55e" stroke-width="3" />
            <line x1="-16" y1="6" x2="16" y2="6" stroke="#22c55e" stroke-width="2.5" />
            <line x1="-8" y1="12" x2="8" y2="12" stroke="#22c55e" stroke-width="2" />
            <line x1="-2" y1="18" x2="2" y2="18" stroke="#22c55e" stroke-width="1.5" />
            <text x="40" y="10" fill="#22c55e" font-size="10" font-weight="700">چاه ارت اختصاصی (R &lt; 2.0Ω)</text>
          </g>
        </g>

        <!-- Earth Bonding Connections to MET -->
        <line x1="540" y1="505" x2="540" y2="650" stroke="#22c55e" stroke-width="2.2" stroke-dasharray="5,3" />
        <line x1="115" y1="530" x2="115" y2="650" stroke="#22c55e" stroke-width="2" stroke-dasharray="5,3" />
        <line x1="1100" y1="310" x2="1100" y2="650" stroke="#22c55e" stroke-width="2.2" stroke-dasharray="5,3" />
        <line x1="1040" y1="615" x2="1040" y2="650" stroke="#22c55e" stroke-width="2.2" stroke-dasharray="5,3" />

        <!-- ================================================================= -->
        <!-- 7. LIVE TELEMETRY LABELS ON SCHEMATIC NODES                       -->
        <!-- ================================================================= -->
        <!-- PV Node Telemetry -->
        <g transform="translate(195, 40)">
          <rect x="-10" y="-12" width="95" height="22" rx="4" fill="rgba(0,0,0,0.8)" stroke="#f59e0b" stroke-width="1" />
          <text id="sld-telemetry-pv" class="sld-telemetry-text" x="37" y="3" text-anchor="middle" fill="#fbbf24">385V / 3800W</text>
        </g>

        <!-- Battery Node Telemetry -->
        <g transform="translate(195, 410)">
          <rect x="-10" y="-12" width="95" height="22" rx="4" fill="rgba(0,0,0,0.8)" stroke="#10b981" stroke-width="1" />
          <text id="sld-telemetry-bat" class="sld-telemetry-text" x="37" y="3" text-anchor="middle" fill="#34d399">51.2V / +850W</text>
        </g>

        <!-- Grid Node Telemetry -->
        <g transform="translate(710, 145)">
          <rect x="-10" y="-12" width="95" height="22" rx="4" fill="rgba(0,0,0,0.8)" stroke="#3b82f6" stroke-width="1" />
          <text id="sld-telemetry-grid" class="sld-telemetry-text" x="37" y="3" text-anchor="middle" fill="#60a5fa">230V / -750W</text>
        </g>

        <!-- EPS / Essential Node Telemetry -->
        <g transform="translate(710, 445)">
          <rect x="-10" y="-12" width="95" height="22" rx="4" fill="rgba(0,0,0,0.8)" stroke="#a855f7" stroke-width="1" />
          <text id="sld-telemetry-eps" class="sld-telemetry-text" x="37" y="3" text-anchor="middle" fill="#f0abfc">230V / 1500W</text>
        </g>

        <!-- SBY Switch Status Badge -->
        <g transform="translate(905, 360)">
          <rect x="-65" y="-12" width="130" height="22" rx="4" fill="rgba(15,23,42,0.9)" stroke="#f59e0b" stroke-width="1" />
          <text id="sld-sby-badge" x="0" y="3" text-anchor="middle" fill="#f59e0b" font-size="8.5" font-weight="700">وضعیت SBY: I (اینورتر EPS)</text>
        </g>
      </g>
    </svg>
    \`;

    svgContainer.innerHTML = svgMarkup;
  }

  /**
   * Sets up Pan and Zoom behavior on the SVG canvas
   */
  function setupPanAndZoom() {
    const svg = document.getElementById('sld-svg-canvas');
    const group = document.getElementById('sld-pan-zoom-group');
    if (!svg || !group) return;

    svg.addEventListener('mousedown', (e) => {
      // Don't pan if clicking an interactive node
      if (e.target.closest('.sld-component-node')) return;
      isPanning = true;
      startX = e.clientX - panX;
      startY = e.clientY - panY;
      svg.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', (e) => {
      if (!isPanning) return;
      panX = e.clientX - startX;
      panY = e.clientY - startY;
      applyTransform();
    });

    window.addEventListener('mouseup', () => {
      isPanning = false;
      if (svg) svg.style.cursor = 'default';
    });

    svg.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      currentZoom = Math.max(0.5, Math.min(3.0, currentZoom * zoomFactor));
      applyTransform();
    });
  }

  function applyTransform() {
    const group = document.getElementById('sld-pan-zoom-group');
    if (group) {
      group.setAttribute('transform', \`translate(\${panX}, \${panY}) scale(\${currentZoom})\`);
    }
  }

  /**
   * Binds click events to symbols for opening inspector drawer or toggling breakers/switches
   */
  function bindSymbolEvents() {
    const nodes = svgContainer.querySelectorAll('.sld-component-node');
    nodes.forEach((node) => {
      node.addEventListener('click', (e) => {
        e.stopPropagation();
        const componentId = node.getAttribute('data-component');
        const breakerId = node.getAttribute('data-breaker');

        // Play click sound
        if (window.soundEngine && typeof window.soundEngine.playClick === 'function') {
          window.soundEngine.playClick();
        }

        // If clicking SBY switch specifically, cycle its position
        if (breakerId === 'sby_switch' || e.target.closest('#sld-sby-switch')) {
          cycleSbySwitch();
        }
        // If clicking breaker symbol specifically, toggle state
        else if (breakerId && e.target.closest('.sld-breaker-symbol')) {
          toggleBreaker(breakerId);
        }

        // Open Inspector Drawer for this component
        if (window.AppOrchestrator && typeof window.AppOrchestrator.openInspectorForComponent === 'function') {
          window.AppOrchestrator.openInspectorForComponent(componentId);
        }
      });
    });
  }

  /**
   * Cycles the 3-position SBY switch: 'I' -> '0' -> 'II' -> 'I'
   */
  function cycleSbySwitch() {
    let nextPos = 'I';
    if (breakerStates.sby_switch === 'I') nextPos = '0';
    else if (breakerStates.sby_switch === '0') nextPos = 'II';
    else nextPos = 'I';

    setSbyPosition(nextPos);
  }

  /**
   * Explicitly sets the SBY switch position ('I', '0', 'II')
   */
  function setSbyPosition(pos) {
    if (!['I', '0', 'II'].includes(pos)) return;
    breakerStates.sby_switch = pos;

    // Play cam switch mechanical sound
    if (window.soundEngine && typeof window.soundEngine.playSbySwitch === 'function') {
      window.soundEngine.playSbySwitch(pos);
    } else if (window.soundEngine && typeof window.soundEngine.playBreakerSnap === 'function') {
      window.soundEngine.playBreakerSnap();
    }

    // Update Visual Blade
    updateSbyVisual(pos);

    // Notify App Orchestrator & Simulation Engine
    if (window.AppOrchestrator && typeof window.AppOrchestrator.onSbyStateChanged === 'function') {
      window.AppOrchestrator.onSbyStateChanged(pos);
    }
  }

  function updateSbyVisual(pos) {
    const blade = document.getElementById('sby-blade');
    const badge = document.getElementById('sld-sby-badge');
    if (!blade) return;

    if (pos === 'I') {
      // Pointing to Source I (top-left, EPS)
      blade.setAttribute('x1', '0');
      blade.setAttribute('y1', '40');
      blade.setAttribute('x2', '-45');
      blade.setAttribute('y2', '-10');
      blade.setAttribute('stroke', '#a855f7');
      if (badge) {
        badge.textContent = 'وضعیت SBY: I (اینورتر EPS)';
        badge.setAttribute('fill', '#c084fc');
      }
    } else if (pos === '0') {
      // Pointing to Center 0 (vertical / open circuit / air gap)
      blade.setAttribute('x1', '0');
      blade.setAttribute('y1', '40');
      blade.setAttribute('x2', '0');
      blade.setAttribute('y2', '5');
      blade.setAttribute('stroke', '#ef4444');
      if (badge) {
        badge.textContent = 'وضعیت SBY: 0 (قطع کامل)';
        badge.setAttribute('fill', '#ef4444');
      }
    } else if (pos === 'II') {
      // Pointing to Source II (bottom-right, Grid Bypass)
      blade.setAttribute('x1', '0');
      blade.setAttribute('y1', '40');
      blade.setAttribute('x2', '45');
      blade.setAttribute('y2', '20');
      blade.setAttribute('stroke', '#0284c7');
      if (badge) {
        badge.textContent = 'وضعیت SBY: II (بای‌پاس شبکه)';
        badge.setAttribute('fill', '#38bdf8');
      }
    }
  }

  /**
   * Toggles a binary breaker (ON / OFF)
   */
  function toggleBreaker(breakerId) {
    if (!(breakerId in breakerStates)) return;

    breakerStates[breakerId] = !breakerStates[breakerId];
    // Sync aliases
    if (breakerId === 'dc_isolator') breakerStates.qpv_isolator = breakerStates.dc_isolator;
    if (breakerId === 'qpv_isolator') breakerStates.dc_isolator = breakerStates.qpv_isolator;
    if (breakerId === 'battery_ocpd') breakerStates.battery_qb = breakerStates.battery_ocpd;
    if (breakerId === 'battery_qb') breakerStates.battery_ocpd = breakerStates.battery_qb;
    if (breakerId === 'eps_mcb') breakerStates.qe_mcb = breakerStates.eps_mcb;
    if (breakerId === 'qe_mcb') breakerStates.eps_mcb = breakerStates.qe_mcb;

    const isOpen = !breakerStates[breakerId];

    // Sound effect
    if (window.soundEngine && typeof window.soundEngine.playBreakerSnap === 'function') {
      window.soundEngine.playBreakerSnap();
    }

    // Update SVG Blade visual
    updateBreakerVisual(breakerId, isOpen);

    // Notify simulation engine or orchestrator
    if (window.AppOrchestrator && typeof window.AppOrchestrator.onBreakerStateChanged === 'function') {
      window.AppOrchestrator.onBreakerStateChanged(breakerId, breakerStates[breakerId]);
    }
  }

  function updateBreakerVisual(breakerId, isOpen) {
    let bladeId = '';
    if (breakerId === 'dc_isolator' || breakerId === 'qpv_isolator') bladeId = 'dc-isolator-blade';
    else if (breakerId === 'q0_mcb' || breakerId === 'grid_mcb') bladeId = 'q0-mcb-blade';
    else if (breakerId === 'qn_mcb') bladeId = 'qn-mcb-blade';
    else if (breakerId === 'qg_mcb') bladeId = 'qg-mcb-blade';
    else if (breakerId === 'qbp_mcb') bladeId = 'qbp-mcb-blade';
    else if (breakerId === 'battery_ocpd' || breakerId === 'battery_qb') bladeId = 'bat-breaker-blade';
    else if (breakerId === 'eps_mcb' || breakerId === 'qe_mcb') bladeId = 'eps-mcb-blade';
    else if (breakerId === 'qo_mcb') bladeId = 'qo-mcb-blade';

    const bladeEl = document.getElementById(bladeId);
    if (!bladeEl) return;

    if (isOpen) {
      bladeEl.setAttribute('x2', '5');
      bladeEl.setAttribute('y2', '-22');
      bladeEl.setAttribute('stroke', '#ef4444');
    } else {
      bladeEl.setAttribute('x2', '10');
      bladeEl.setAttribute('y2', '-8');
      bladeEl.setAttribute('stroke', '#22c55e');
    }
  }

  /**
   * Updates live power and voltage telemetry labels directly on the SLD nodes
   */
  function updateTelemetry(metrics) {
    if (!metrics) return;

    const pvEl = document.getElementById('sld-telemetry-pv');
    if (pvEl && metrics.pv) {
      pvEl.textContent = \`\${Math.round(metrics.pv.v || 385)}V / \${Math.round(metrics.pv.p || 0)}W\`;
    }

    const batEl = document.getElementById('sld-telemetry-bat');
    if (batEl && metrics.battery) {
      const p = Math.round(metrics.battery.p || 0);
      const sign = p >= 0 ? '+' : '';
      batEl.textContent = \`\${(metrics.battery.v || 51.2).toFixed(1)}V / \${sign}\${p}W\`;
    }

    const gridEl = document.getElementById('sld-telemetry-grid');
    if (gridEl && metrics.grid) {
      const p = Math.round(metrics.grid.p || 0);
      gridEl.textContent = \`\${Math.round(metrics.grid.v || 230)}V / \${p > 0 ? '+' : ''}\${p}W\`;
    }

    const epsEl = document.getElementById('sld-telemetry-eps');
    if (epsEl && metrics.eps) {
      epsEl.textContent = \`\${Math.round(metrics.eps.v || 230)}V / \${Math.round(metrics.eps.p || 0)}W\`;
    }

    // Dynamic Flow animations control
    updateFlowAnimations(metrics);
  }

  function updateFlowAnimations(metrics) {
    const pvFlow = document.getElementById('flow-pv-dc');
    const batFlow = document.getElementById('flow-bat-dc');
    const gridFlow = document.getElementById('flow-grid-ac');
    const bypassFlow = document.getElementById('flow-bypass-ac');
    const epsFlow = document.getElementById('flow-eps-ac');

    // PV Flow
    if (pvFlow) {
      if (breakerStates.dc_isolator && (metrics.pv?.p || 0) > 100) {
        pvFlow.style.display = 'block';
      } else {
        pvFlow.style.display = 'none';
      }
    }

    // Battery Flow
    if (batFlow) {
      if (!breakerStates.battery_ocpd || Math.abs(metrics.battery?.p || 0) < 30) {
        batFlow.style.display = 'none';
      } else {
        batFlow.style.display = 'block';
        if (metrics.battery.p > 0) {
          batFlow.classList.remove('flow-anim');
          batFlow.classList.add('flow-anim-reverse');
        } else {
          batFlow.classList.remove('flow-anim-reverse');
          batFlow.classList.add('flow-anim');
        }
      }
    }

    // Grid Flow
    if (gridFlow) {
      if (!breakerStates.q0_mcb || metrics.grid?.isBlackout) {
        gridFlow.style.display = 'none';
      } else {
        gridFlow.style.display = 'block';
      }
    }

    // SBY Bypass & EPS Flow logic
    const sby = breakerStates.sby_switch;
    const qoClosed = breakerStates.qo_mcb;

    if (sby === 'I') {
      // Normal EPS Mode
      if (bypassFlow) bypassFlow.style.display = 'none';
      if (epsFlow) {
        if (breakerStates.eps_mcb && qoClosed && (metrics.eps?.p || 0) > 10) {
          epsFlow.style.display = 'block';
        } else {
          epsFlow.style.display = 'none';
        }
      }
    } else if (sby === 'II') {
      // Grid Bypass Mode
      if (epsFlow) epsFlow.style.display = 'none';
      if (bypassFlow) {
        if (breakerStates.qbp_mcb && qoClosed && !metrics.grid?.isBlackout && (metrics.eps?.p || 0) > 10) {
          bypassFlow.style.display = 'block';
        } else {
          bypassFlow.style.display = 'none';
        }
      }
    } else {
      // Position 0: Isolated
      if (epsFlow) epsFlow.style.display = 'none';
      if (bypassFlow) bypassFlow.style.display = 'none';
    }
  }

  function setFlowFilter(filterType) {
    const flows = {
      pv: document.getElementById('flow-pv-dc'),
      bat: document.getElementById('flow-bat-dc'),
      grid: document.getElementById('flow-grid-ac'),
      bypass: document.getElementById('flow-bypass-ac'),
      eps: document.getElementById('flow-eps-ac')
    };

    if (filterType === 'all') {
      Object.values(flows).forEach(el => { if (el) el.style.opacity = '0.85'; });
    } else {
      Object.entries(flows).forEach(([key, el]) => {
        if (!el) return;
        if (key === filterType) {
          el.style.opacity = '1';
          el.style.strokeWidth = '5';
        } else {
          el.style.opacity = '0.15';
          el.style.strokeWidth = '2';
        }
      });
    }
  }

  function zoomIn() {
    currentZoom = Math.min(3.0, currentZoom + 0.2);
    applyTransform();
  }

  function zoomOut() {
    currentZoom = Math.max(0.5, currentZoom - 0.2);
    applyTransform();
  }

  function resetZoom() {
    currentZoom = 1.0;
    panX = 0;
    panY = 0;
    applyTransform();
  }

  // Export module to global scope
  window.SLDSchematic = {
    init,
    updateTelemetry,
    setFlowFilter,
    toggleBreaker,
    setSbyPosition,
    cycleSbySwitch,
    zoomIn,
    zoomOut,
    resetZoom,
    getBreakerStates: () => ({ ...breakerStates }),
    setBreakerState: (id, state) => {
      if (id === 'sby_switch') {
        setSbyPosition(state);
      } else {
        breakerStates[id] = state;
        updateBreakerVisual(id, !state);
      }
    }
  };
})();
`;

const targetPath = path.resolve(__dirname, '../js/sld-schematic.js');
fs.writeFileSync(targetPath, sldScript, 'utf8');
console.log('Successfully built ' + targetPath);
