/**
 * ==============================================================================
 * 5kW Single-Phase & 15kW 3-Phase Hybrid Solar PV Simulator Suite
 * Interactive Multi-Schematic Diagram Suite per HYB-FA-001 Rev B
 * 
 * Includes 6 Base Schematics:
 * 1. SLD-01: 5kW Single-Phase Hybrid PV with SBY I-0-II manual changeover
 * 2. SLD-02: True 3-Phase 15kW Hybrid PV with PMR and motor feeder branch
 * 3. SLD-03: External ATSE KG/KE with mechanical & Mirror interlocks
 * 4. DC-01/02: PV Array dual gPV fuses, DC-PV2 isolator, 3-terminal SPD, Battery precharge
 * 5. E-01: Grounding & neutral KSEP/KNE, TN vs TT fault loops, continuous PE
 * 6. C-01: Control ladder logic, 24VDC, 9-state deadlock-free FSM
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
  let currentTab = 'SLD-01';

  // Breaker and switch states
  const breakerStates = {
    q0_mcb: true,
    qn_mcb: true,
    qg_mcb: true,
    qbp_mcb: true,
    fspd_mcb: true,
    dc_isolator: true,
    qpv_isolator: true,
    battery_ocpd: true,
    battery_qb: true,
    eps_mcb: true,
    qe_mcb: true,
    sby_switch: 'I',
    qo_mcb: true,
    qg3_mcb: true,
    qe3_mcb: true,
    sby3_switch: 'I',
    kg_contactor: true,
    ke_contactor: false
  };

  const SCHEMATICS = {
    'SLD-01': {
      title: 'نقشه تک‌خطی تک‌فاز ۵kW (SLD-01)',
      svg: `<svg id="sld-svg-canvas" viewBox="0 0 1280 780" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
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
        <line x1="0" y1="0" x2="0" y2="780" />
        <line x1="50" y1="0" x2="50" y2="780" />
        <line x1="100" y1="0" x2="100" y2="780" />
        <line x1="150" y1="0" x2="150" y2="780" />
        <line x1="200" y1="0" x2="200" y2="780" />
        <line x1="250" y1="0" x2="250" y2="780" />
        <line x1="300" y1="0" x2="300" y2="780" />
        <line x1="350" y1="0" x2="350" y2="780" />
        <line x1="400" y1="0" x2="400" y2="780" />
        <line x1="450" y1="0" x2="450" y2="780" />
        <line x1="500" y1="0" x2="500" y2="780" />
        <line x1="550" y1="0" x2="550" y2="780" />
        <line x1="600" y1="0" x2="600" y2="780" />
        <line x1="650" y1="0" x2="650" y2="780" />
        <line x1="700" y1="0" x2="700" y2="780" />
        <line x1="750" y1="0" x2="750" y2="780" />
        <line x1="800" y1="0" x2="800" y2="780" />
        <line x1="850" y1="0" x2="850" y2="780" />
        <line x1="900" y1="0" x2="900" y2="780" />
        <line x1="950" y1="0" x2="950" y2="780" />
        <line x1="1000" y1="0" x2="1000" y2="780" />
        <line x1="1050" y1="0" x2="1050" y2="780" />
        <line x1="1100" y1="0" x2="1100" y2="780" />
        <line x1="1150" y1="0" x2="1150" y2="780" />
        <line x1="1200" y1="0" x2="1200" y2="780" />
        <line x1="1250" y1="0" x2="1250" y2="780" />
        <line x1="0" y1="0" x2="1280" y2="0" />
        <line x1="0" y1="50" x2="1280" y2="50" />
        <line x1="0" y1="100" x2="1280" y2="100" />
        <line x1="0" y1="150" x2="1280" y2="150" />
        <line x1="0" y1="200" x2="1280" y2="200" />
        <line x1="0" y1="250" x2="1280" y2="250" />
        <line x1="0" y1="300" x2="1280" y2="300" />
        <line x1="0" y1="350" x2="1280" y2="350" />
        <line x1="0" y1="400" x2="1280" y2="400" />
        <line x1="0" y1="450" x2="1280" y2="450" />
        <line x1="0" y1="500" x2="1280" y2="500" />
        <line x1="0" y1="550" x2="1280" y2="550" />
        <line x1="0" y1="600" x2="1280" y2="600" />
        <line x1="0" y1="650" x2="1280" y2="650" />
        <line x1="0" y1="700" x2="1280" y2="700" />
        <line x1="0" y1="750" x2="1280" y2="750" />
      </g>

      <!-- Standard Specification Header -->
      <text x="640" y="28" fill="#94a3b8" font-size="13" font-family="'Vazirmatn', sans-serif" font-weight="700" text-anchor="middle">
        نقشه تک‌خطی سامانه خورشیدی هیبرید ۵ کیلووات (SLD-01) — استاندارد HYB-FA-001 Rev A و IEC 60364-7-712
      </text>

      <!-- Main Transformation / Pan-Zoom Group -->
      <g id="sld-pan-zoom-group" transform="translate(0, 0) scale(1)">

        <!-- ================================================================= -->
        <!-- 1. DC-01: SOLAR PV & DC COMBINER BOX SUBSYSTEM (TOP LEFT)         -->
        <!-- ================================================================= -->
        <!-- PV String 1 -->
        <g class="sld-component-node" data-component="pv_modules" transform="translate(50, 52)" style="cursor:pointer">
          <rect width="105" height="68" rx="8" fill="url(#pvGrad)" stroke="#38bdf8" stroke-width="1.8" />
          <line x1="15" y1="18" x2="90" y2="18" stroke="#38bdf8" stroke-width="0.8" opacity="0.6"/>
          <line x1="15" y1="34" x2="90" y2="34" stroke="#38bdf8" stroke-width="0.8" opacity="0.6"/>
          <line x1="15" y1="50" x2="90" y2="50" stroke="#38bdf8" stroke-width="0.8" opacity="0.6"/>
          <line x1="40" y1="10" x2="40" y2="58" stroke="#38bdf8" stroke-width="0.8" opacity="0.6"/>
          <line x1="65" y1="10" x2="65" y2="58" stroke="#38bdf8" stroke-width="0.8" opacity="0.6"/>
          <text x="52" y="-6" fill="#f59e0b" font-size="10.5" font-weight="700" text-anchor="middle">استرینگ خورشیدی ۱</text>
          <text x="52" y="64" fill="#94a3b8" font-size="8" text-anchor="middle">7x 400W (Voc 385V)</text>
          <!-- Polarity Terminals String 1 -->
          <circle cx="105" cy="22" r="4" fill="#ef4444" />
          <text x="96" y="25" fill="#ef4444" font-size="8" font-weight="bold">+</text>
          <circle cx="105" cy="50" r="4" fill="#38bdf8" />
          <text x="96" y="53" fill="#38bdf8" font-size="8" font-weight="bold">-</text>
        </g>

        <!-- PV String 2 -->
        <g class="sld-component-node" data-component="pv_modules" transform="translate(50, 150)" style="cursor:pointer">
          <rect width="105" height="68" rx="8" fill="url(#pvGrad)" stroke="#38bdf8" stroke-width="1.8" />
          <line x1="15" y1="18" x2="90" y2="18" stroke="#38bdf8" stroke-width="0.8" opacity="0.6"/>
          <line x1="15" y1="34" x2="90" y2="34" stroke="#38bdf8" stroke-width="0.8" opacity="0.6"/>
          <line x1="15" y1="50" x2="90" y2="50" stroke="#38bdf8" stroke-width="0.8" opacity="0.6"/>
          <line x1="40" y1="10" x2="40" y2="58" stroke="#38bdf8" stroke-width="0.8" opacity="0.6"/>
          <line x1="65" y1="10" x2="65" y2="58" stroke="#38bdf8" stroke-width="0.8" opacity="0.6"/>
          <text x="52" y="-6" fill="#f59e0b" font-size="10.5" font-weight="700" text-anchor="middle">استرینگ خورشیدی ۲</text>
          <text x="52" y="64" fill="#94a3b8" font-size="8" text-anchor="middle">7x 400W (Voc 385V)</text>
          <!-- Polarity Terminals String 2 -->
          <circle cx="105" cy="22" r="4" fill="#ef4444" />
          <text x="96" y="25" fill="#ef4444" font-size="8" font-weight="bold">+</text>
          <circle cx="105" cy="50" r="4" fill="#38bdf8" />
          <text x="96" y="53" fill="#38bdf8" font-size="8" font-weight="bold">-</text>
        </g>

        <!-- ============================================================= -->
        <!-- REALISTIC DC COMBINER BOX ENCLOSURE (IP65)                    -->
        <!-- ============================================================= -->
        <!-- Enclosure Boundary & DIN Rails -->
        <g id="sld-dc-combiner-box">
          <rect x="175" y="44" width="225" height="186" rx="8" fill="rgba(15,23,42,0.92)" stroke="#f59e0b" stroke-width="1.8" stroke-dasharray="6,3" />
          <rect x="175" y="44" width="225" height="18" rx="6" fill="rgba(245,158,11,0.22)" />
          <text x="287" y="57" fill="#fbbf24" font-size="8.5" font-family="'Vazirmatn', sans-serif" font-weight="700" text-anchor="middle">تابلوی کمباینر باکس DC خورشیدی (IP65)</text>

          <!-- DIN Rails -->
          <line x1="185" y1="90" x2="390" y2="90" stroke="#64748b" stroke-width="2.5" opacity="0.35" stroke-dasharray="4,2" />
          <line x1="185" y1="185" x2="390" y2="185" stroke="#64748b" stroke-width="2.5" opacity="0.35" stroke-dasharray="4,2" />

          <!-- Cable Glands - Left Entry -->
          <rect x="170" y="68" width="7" height="12" rx="2" fill="#475569" stroke="#94a3b8" stroke-width="1" />
          <rect x="170" y="96" width="7" height="12" rx="2" fill="#475569" stroke="#94a3b8" stroke-width="1" />
          <rect x="170" y="166" width="7" height="12" rx="2" fill="#475569" stroke="#94a3b8" stroke-width="1" />
          <rect x="170" y="194" width="7" height="12" rx="2" fill="#475569" stroke="#94a3b8" stroke-width="1" />

          <!-- Cable Glands - Right Outgoing -->
          <rect x="398" y="74" width="7" height="34" rx="2" fill="#475569" stroke="#94a3b8" stroke-width="1" />
          <rect x="398" y="168" width="7" height="34" rx="2" fill="#475569" stroke="#94a3b8" stroke-width="1" />

          <!-- Cable Gland - Bottom PE -->
          <rect x="340" y="228" width="14" height="6" rx="2" fill="#475569" stroke="#94a3b8" stroke-width="1" />
        </g>

        <!-- String 1 Incoming Wiring (Red = +, Blue = -) -->
        <line x1="155" y1="74" x2="204" y2="74" stroke="#ef4444" stroke-width="2.5" />
        <line x1="155" y1="102" x2="204" y2="102" stroke="#38bdf8" stroke-width="2.5" />
        <text x="165" y="70" fill="#ef4444" font-size="7.5" font-weight="700">L1+</text>
        <text x="165" y="112" fill="#38bdf8" font-size="7.5" font-weight="700">L1-</text>

        <!-- String 1 Fuses: F1+ (Positive) and F1- (Negative) -->
        <g class="sld-component-node" data-component="string_fuse_pos" transform="translate(212, 74)" style="cursor:pointer">
          <rect x="-8" y="-12" width="16" height="24" rx="3" fill="#1e293b" stroke="#ef4444" stroke-width="1.8" />
          <line x1="0" y1="-12" x2="0" y2="12" stroke="#ef4444" stroke-width="2" />
          <text x="0" y="-15" fill="#ef4444" font-size="7.5" font-weight="700" text-anchor="middle">F1+ (gPV)</text>
          <text x="0" y="20" fill="#94a3b8" font-size="6" text-anchor="middle">15A 1000V</text>
        </g>
        <g class="sld-component-node" data-component="string_fuse_neg" transform="translate(212, 102)" style="cursor:pointer">
          <rect x="-8" y="-12" width="16" height="24" rx="3" fill="#1e293b" stroke="#38bdf8" stroke-width="1.8" />
          <line x1="0" y1="-12" x2="0" y2="12" stroke="#38bdf8" stroke-width="2" />
          <text x="0" y="-15" fill="#38bdf8" font-size="7.5" font-weight="700" text-anchor="middle">F1- (gPV)</text>
          <text x="0" y="20" fill="#94a3b8" font-size="6" text-anchor="middle">15A 1000V</text>
        </g>

        <!-- String 2 Incoming Wiring (Red = +, Blue = -) -->
        <line x1="155" y1="172" x2="204" y2="172" stroke="#ef4444" stroke-width="2.5" />
        <line x1="155" y1="200" x2="204" y2="200" stroke="#38bdf8" stroke-width="2.5" />
        <text x="165" y="168" fill="#ef4444" font-size="7.5" font-weight="700">L2+</text>
        <text x="165" y="210" fill="#38bdf8" font-size="7.5" font-weight="700">L2-</text>

        <!-- String 2 Fuses: F2+ (Positive) and F2- (Negative) -->
        <g class="sld-component-node" data-component="string_fuse_pos" transform="translate(212, 172)" style="cursor:pointer">
          <rect x="-8" y="-12" width="16" height="24" rx="3" fill="#1e293b" stroke="#ef4444" stroke-width="1.8" />
          <line x1="0" y1="-12" x2="0" y2="12" stroke="#ef4444" stroke-width="2" />
          <text x="0" y="-15" fill="#ef4444" font-size="7.5" font-weight="700" text-anchor="middle">F2+ (gPV)</text>
          <text x="0" y="20" fill="#94a3b8" font-size="6" text-anchor="middle">15A 1000V</text>
        </g>
        <g class="sld-component-node" data-component="string_fuse_neg" transform="translate(212, 200)" style="cursor:pointer">
          <rect x="-8" y="-12" width="16" height="24" rx="3" fill="#1e293b" stroke="#38bdf8" stroke-width="1.8" />
          <line x1="0" y1="-12" x2="0" y2="12" stroke="#38bdf8" stroke-width="2" />
          <text x="0" y="-15" fill="#38bdf8" font-size="7.5" font-weight="700" text-anchor="middle">F2- (gPV)</text>
          <text x="0" y="20" fill="#94a3b8" font-size="6" text-anchor="middle">15A 1000V</text>
        </g>

        <!-- Lines from Fuses to QPV Isolator -->
        <line x1="220" y1="74" x2="264" y2="74" stroke="#ef4444" stroke-width="2.5" />
        <line x1="220" y1="102" x2="264" y2="102" stroke="#38bdf8" stroke-width="2.5" />
        <line x1="220" y1="172" x2="264" y2="172" stroke="#ef4444" stroke-width="2.5" />
        <line x1="220" y1="200" x2="264" y2="200" stroke="#38bdf8" stroke-width="2.5" />

        <!-- QPV: DC Load-Break Switch-Disconnector (DC-PV2 1000V 32A) -->
        <g class="sld-component-node sld-breaker-symbol" id="sld-dc-isolator" data-component="qpv_isolator" data-breaker="dc_isolator" transform="translate(272, 137)" style="cursor:pointer">
          <rect x="-16" y="-72" width="32" height="144" rx="6" fill="#1e293b" stroke="#f59e0b" stroke-width="2" />
          <text x="0" y="-78" fill="#f59e0b" font-size="8.5" font-weight="700" text-anchor="middle">QPV (DC-PV2)</text>
          <!-- Pole 1 (S1+) -->
          <circle cx="-8" cy="-63" r="2.8" fill="#ef4444" />
          <circle cx="8" cy="-63" r="2.8" fill="#ef4444" />
          <line id="dc-isolator-blade" class="dc_isolator-blade" x1="-8" y1="-63" x2="6" y2="-70" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" />
          <!-- Pole 2 (S1-) -->
          <circle cx="-8" cy="-35" r="2.8" fill="#38bdf8" />
          <circle cx="8" cy="-35" r="2.8" fill="#38bdf8" />
          <line id="dc-isolator-blade-2" class="dc_isolator-blade" x1="-8" y1="-35" x2="6" y2="-42" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" />
          <!-- Pole 3 (S2+) -->
          <circle cx="-8" cy="35" r="2.8" fill="#ef4444" />
          <circle cx="8" cy="35" r="2.8" fill="#ef4444" />
          <line id="dc-isolator-blade-3" class="dc_isolator-blade" x1="-8" y1="35" x2="6" y2="28" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" />
          <!-- Pole 4 (S2-) -->
          <circle cx="-8" cy="63" r="2.8" fill="#38bdf8" />
          <circle cx="8" cy="63" r="2.8" fill="#38bdf8" />
          <line id="dc-isolator-blade-4" class="dc_isolator-blade" x1="-8" y1="63" x2="6" y2="56" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" />
          <text x="0" y="84" fill="#94a3b8" font-size="7" text-anchor="middle">1000V 32A</text>
        </g>

        <!-- Lines from QPV Isolator to Inverter & SPD Taps -->
        <!-- S1+ Out -->
        <line x1="280" y1="74" x2="415" y2="74" stroke="#ef4444" stroke-width="2.5" />
        <!-- S1- Out -->
        <line x1="280" y1="102" x2="415" y2="102" stroke="#38bdf8" stroke-width="2.5" />
        <!-- S2+ Out -->
        <line x1="280" y1="172" x2="415" y2="172" stroke="#ef4444" stroke-width="2.5" />
        <!-- S2- Out -->
        <line x1="280" y1="200" x2="415" y2="200" stroke="#38bdf8" stroke-width="2.5" />

        <!-- Taps to DC SPD -->
        <line x1="330" y1="74" x2="330" y2="114" stroke="#ef4444" stroke-width="1.8" />
        <line x1="330" y1="114" x2="337" y2="114" stroke="#ef4444" stroke-width="1.8" />
        <line x1="324" y1="102" x2="324" y2="134" stroke="#38bdf8" stroke-width="1.8" />
        <line x1="324" y1="134" x2="337" y2="134" stroke="#38bdf8" stroke-width="1.8" />

        <!-- DC SPD Type 2 (1000V DC, 3-Terminal) -->
        <g class="sld-component-node" data-component="dc_spd" transform="translate(347, 137)" style="cursor:pointer">
          <rect x="-14" y="-36" width="28" height="72" rx="4" fill="#1e293b" stroke="#ef4444" stroke-width="1.8" />
          <text x="0" y="-42" fill="#ef4444" font-size="7.5" font-weight="700" text-anchor="middle">ارستر DC SPD</text>
          <!-- (+) Terminal -->
          <circle cx="-10" cy="-23" r="2.5" fill="#ef4444" />
          <text x="2" y="-20" fill="#ef4444" font-size="6.5" font-weight="bold">(+)</text>
          <!-- (-) Terminal -->
          <circle cx="-10" cy="-3" r="2.5" fill="#38bdf8" />
          <text x="2" y="0" fill="#38bdf8" font-size="6.5" font-weight="bold">(-)</text>
          <!-- (PE) Terminal -->
          <circle cx="-10" cy="18" r="2.5" fill="#22c55e" />
          <text x="2" y="21" fill="#22c55e" font-size="6.5" font-weight="bold">(PE)</text>
          <text x="0" y="45" fill="#94a3b8" font-size="6.5" text-anchor="middle">Type 2</text>
        </g>

        <!-- Grounding Conductor from DC SPD to MET Busbar -->
        <line x1="347" y1="155" x2="347" y2="230" stroke="#22c55e" stroke-width="2" stroke-dasharray="4,3" />
        <line x1="347" y1="230" x2="347" y2="650" stroke="#22c55e" stroke-width="2" stroke-dasharray="4,3" />
        <text x="353" y="245" fill="#22c55e" font-size="7" font-weight="bold">PE 6mm²</text>

        <!-- Animated DC PV Flows -->
        <line id="flow-pv-dc" x1="155" y1="74" x2="415" y2="74" stroke="#ef4444" stroke-width="3" class="flow-anim" stroke-linecap="round" opacity="0.85" />
        <line id="flow-pv-dc-neg" x1="155" y1="102" x2="415" y2="102" stroke="#38bdf8" stroke-width="2.5" class="flow-anim" stroke-linecap="round" opacity="0.8" />

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
    </svg>`
    },
    'SLD-02': {
      title: 'نقشه تک‌خطی سه‌فاز ۱۵kW (SLD-02)',
      svg: `
<svg id="sld-svg-canvas" viewBox="0 0 1280 780" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="inv3Grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e293b" />
      <stop offset="100%" stop-color="#0f172a" />
    </linearGradient>
    <linearGradient id="pv3Grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.35" />
      <stop offset="100%" stop-color="#1e3a8a" stop-opacity="0.65" />
    </linearGradient>
    <linearGradient id="bat3Grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#059669" stop-opacity="0.3" />
      <stop offset="100%" stop-color="#064e3b" stop-opacity="0.6" />
    </linearGradient>
    <linearGradient id="motorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#475569" stop-opacity="0.5" />
      <stop offset="100%" stop-color="#1e293b" stop-opacity="0.8" />
    </linearGradient>
  </defs>

  <!-- Blueprint Grid -->
  <g stroke="rgba(255,255,255,0.03)" stroke-width="1">
    <line x1="0" y1="0" x2="0" y2="780" /><line x1="50" y1="0" x2="50" y2="780" /><line x1="100" y1="0" x2="100" y2="780" /><line x1="150" y1="0" x2="150" y2="780" /><line x1="200" y1="0" x2="200" y2="780" /><line x1="250" y1="0" x2="250" y2="780" /><line x1="300" y1="0" x2="300" y2="780" /><line x1="350" y1="0" x2="350" y2="780" /><line x1="400" y1="0" x2="400" y2="780" /><line x1="450" y1="0" x2="450" y2="780" /><line x1="500" y1="0" x2="500" y2="780" /><line x1="550" y1="0" x2="550" y2="780" /><line x1="600" y1="0" x2="600" y2="780" /><line x1="650" y1="0" x2="650" y2="780" /><line x1="700" y1="0" x2="700" y2="780" /><line x1="750" y1="0" x2="750" y2="780" /><line x1="800" y1="0" x2="800" y2="780" /><line x1="850" y1="0" x2="850" y2="780" /><line x1="900" y1="0" x2="900" y2="780" /><line x1="950" y1="0" x2="950" y2="780" /><line x1="1000" y1="0" x2="1000" y2="780" /><line x1="1050" y1="0" x2="1050" y2="780" /><line x1="1100" y1="0" x2="1100" y2="780" /><line x1="1150" y1="0" x2="1150" y2="780" /><line x1="1200" y1="0" x2="1200" y2="780" /><line x1="1250" y1="0" x2="1250" y2="780" />
    <line x1="0" y1="0" x2="1280" y2="0" /><line x1="0" y1="50" x2="1280" y2="50" /><line x1="0" y1="100" x2="1280" y2="100" /><line x1="0" y1="150" x2="1280" y2="150" /><line x1="0" y1="200" x2="1280" y2="200" /><line x1="0" y1="250" x2="1280" y2="250" /><line x1="0" y1="300" x2="1280" y2="300" /><line x1="0" y1="350" x2="1280" y2="350" /><line x1="0" y1="400" x2="1280" y2="400" /><line x1="0" y1="450" x2="1280" y2="450" /><line x1="0" y1="500" x2="1280" y2="500" /><line x1="0" y1="550" x2="1280" y2="550" /><line x1="0" y1="600" x2="1280" y2="600" /><line x1="0" y1="650" x2="1280" y2="650" /><line x1="0" y1="700" x2="1280" y2="700" /><line x1="0" y1="750" x2="1280" y2="750" />
  </g>

  <!-- Header -->
  <text x="640" y="28" fill="#38bdf8" font-size="14" font-family="'Vazirmatn', sans-serif" font-weight="700" text-anchor="middle">
    نقشه تک‌خطی سامانه خورشیدی هیبرید سه‌فاز ۱۵ کیلووات (SLD-02) — استاندارد HYB-FA-001 Rev B
  </text>
  <text x="640" y="46" fill="#94a3b8" font-size="10" font-family="'Vazirmatn', sans-serif" text-anchor="middle">
    معماری سه‌فاز متقارن با خروجی پشتیبان هماهنگ (4P)، پایش توالی فاز PMR و حفاظت بار موتوری
  </text>

  <!-- Pan-Zoom Group -->
  <g id="sld-pan-zoom-group" transform="translate(0, 0) scale(1)">

    <!-- ================================================================= -->
    <!-- 1. DC SUBSYSTEM & REALISTIC DC COMBINER BOX (LEFT)                -->
    <!-- ================================================================= -->
    <!-- PV Array String 1 -->
    <g class="sld-component-node" data-component="pv_modules" transform="translate(50, 52)" style="cursor:pointer">
      <rect width="115" height="68" rx="6" fill="url(#pv3Grad)" stroke="#38bdf8" stroke-width="1.8" />
      <text x="57" y="-6" fill="#f59e0b" font-size="10.5" font-weight="700" text-anchor="middle">استرینگ خورشیدی ۱</text>
      <text x="57" y="24" fill="#e2e8f0" font-size="9" text-anchor="middle">10x 400W (Voc 550V)</text>
      <text x="57" y="42" fill="#94a3b8" font-size="8" text-anchor="middle">Isc 11.5A / Imp 10.8A</text>
      <!-- Polarity Terminals String 1 -->
      <circle cx="115" cy="22" r="4" fill="#ef4444" />
      <text x="105" y="25" fill="#ef4444" font-size="8" font-weight="bold">+</text>
      <circle cx="115" cy="50" r="4" fill="#38bdf8" />
      <text x="105" y="53" fill="#38bdf8" font-size="8" font-weight="bold">-</text>
    </g>

    <!-- PV Array String 2 -->
    <g class="sld-component-node" data-component="pv_modules" transform="translate(50, 150)" style="cursor:pointer">
      <rect width="115" height="68" rx="6" fill="url(#pv3Grad)" stroke="#38bdf8" stroke-width="1.8" />
      <text x="57" y="-6" fill="#f59e0b" font-size="10.5" font-weight="700" text-anchor="middle">استرینگ خورشیدی ۲</text>
      <text x="57" y="24" fill="#e2e8f0" font-size="9" text-anchor="middle">10x 400W (Voc 550V)</text>
      <text x="57" y="42" fill="#94a3b8" font-size="8" text-anchor="middle">Isc 11.5A / Imp 10.8A</text>
      <!-- Polarity Terminals String 2 -->
      <circle cx="115" cy="22" r="4" fill="#ef4444" />
      <text x="105" y="25" fill="#ef4444" font-size="8" font-weight="bold">+</text>
      <circle cx="115" cy="50" r="4" fill="#38bdf8" />
      <text x="105" y="53" fill="#38bdf8" font-size="8" font-weight="bold">-</text>
    </g>

    <!-- ============================================================= -->
    <!-- REALISTIC DC COMBINER BOX ENCLOSURE (IP65)                    -->
    <!-- ============================================================= -->
    <g id="sld-dc-combiner-box-3p">
      <rect x="175" y="44" width="225" height="186" rx="8" fill="rgba(15,23,42,0.92)" stroke="#f59e0b" stroke-width="1.8" stroke-dasharray="6,3" />
      <rect x="175" y="44" width="225" height="18" rx="6" fill="rgba(245,158,11,0.22)" />
      <text x="287" y="57" fill="#fbbf24" font-size="8.5" font-family="'Vazirmatn', sans-serif" font-weight="700" text-anchor="middle">تابلوی کمباینر باکس DC سه‌فاز ۱۵kW (IP65)</text>

      <!-- DIN Rails -->
      <line x1="185" y1="90" x2="390" y2="90" stroke="#64748b" stroke-width="2.5" opacity="0.35" stroke-dasharray="4,2" />
      <line x1="185" y1="185" x2="390" y2="185" stroke="#64748b" stroke-width="2.5" opacity="0.35" stroke-dasharray="4,2" />

      <!-- Cable Glands - Left Entry -->
      <rect x="170" y="68" width="7" height="12" rx="2" fill="#475569" stroke="#94a3b8" stroke-width="1" />
      <rect x="170" y="96" width="7" height="12" rx="2" fill="#475569" stroke="#94a3b8" stroke-width="1" />
      <rect x="170" y="166" width="7" height="12" rx="2" fill="#475569" stroke="#94a3b8" stroke-width="1" />
      <rect x="170" y="194" width="7" height="12" rx="2" fill="#475569" stroke="#94a3b8" stroke-width="1" />

      <!-- Cable Glands - Right Outgoing -->
      <rect x="398" y="74" width="7" height="34" rx="2" fill="#475569" stroke="#94a3b8" stroke-width="1" />
      <rect x="398" y="168" width="7" height="34" rx="2" fill="#475569" stroke="#94a3b8" stroke-width="1" />

      <!-- Cable Gland - Bottom PE -->
      <rect x="340" y="228" width="14" height="6" rx="2" fill="#475569" stroke="#94a3b8" stroke-width="1" />
    </g>

    <!-- String 1 Incoming Wiring (Red = +, Blue = -) -->
    <line x1="165" y1="74" x2="204" y2="74" stroke="#ef4444" stroke-width="2.5" />
    <line x1="165" y1="102" x2="204" y2="102" stroke="#38bdf8" stroke-width="2.5" />
    <text x="170" y="70" fill="#ef4444" font-size="7.5" font-weight="700">L1+</text>
    <text x="170" y="112" fill="#38bdf8" font-size="7.5" font-weight="700">L1-</text>

    <!-- String 1 Fuses: F1+ (Positive) and F1- (Negative) -->
    <g class="sld-component-node" data-component="string_fuse_pos" transform="translate(212, 74)" style="cursor:pointer">
      <rect x="-8" y="-12" width="16" height="24" rx="3" fill="#1e293b" stroke="#ef4444" stroke-width="1.8" />
      <line x1="0" y1="-12" x2="0" y2="12" stroke="#ef4444" stroke-width="2" />
      <text x="0" y="-15" fill="#ef4444" font-size="7.5" font-weight="700" text-anchor="middle">F1+ (gPV)</text>
      <text x="0" y="20" fill="#94a3b8" font-size="6" text-anchor="middle">15A 1000V</text>
    </g>
    <g class="sld-component-node" data-component="string_fuse_neg" transform="translate(212, 102)" style="cursor:pointer">
      <rect x="-8" y="-12" width="16" height="24" rx="3" fill="#1e293b" stroke="#38bdf8" stroke-width="1.8" />
      <line x1="0" y1="-12" x2="0" y2="12" stroke="#38bdf8" stroke-width="2" />
      <text x="0" y="-15" fill="#38bdf8" font-size="7.5" font-weight="700" text-anchor="middle">F1- (gPV)</text>
      <text x="0" y="20" fill="#94a3b8" font-size="6" text-anchor="middle">15A 1000V</text>
    </g>

    <!-- String 2 Incoming Wiring (Red = +, Blue = -) -->
    <line x1="165" y1="172" x2="204" y2="172" stroke="#ef4444" stroke-width="2.5" />
    <line x1="165" y1="200" x2="204" y2="200" stroke="#38bdf8" stroke-width="2.5" />
    <text x="170" y="168" fill="#ef4444" font-size="7.5" font-weight="700">L2+</text>
    <text x="170" y="210" fill="#38bdf8" font-size="7.5" font-weight="700">L2-</text>

    <!-- String 2 Fuses: F2+ (Positive) and F2- (Negative) -->
    <g class="sld-component-node" data-component="string_fuse_pos" transform="translate(212, 172)" style="cursor:pointer">
      <rect x="-8" y="-12" width="16" height="24" rx="3" fill="#1e293b" stroke="#ef4444" stroke-width="1.8" />
      <line x1="0" y1="-12" x2="0" y2="12" stroke="#ef4444" stroke-width="2" />
      <text x="0" y="-15" fill="#ef4444" font-size="7.5" font-weight="700" text-anchor="middle">F2+ (gPV)</text>
      <text x="0" y="20" fill="#94a3b8" font-size="6" text-anchor="middle">15A 1000V</text>
    </g>
    <g class="sld-component-node" data-component="string_fuse_neg" transform="translate(212, 200)" style="cursor:pointer">
      <rect x="-8" y="-12" width="16" height="24" rx="3" fill="#1e293b" stroke="#38bdf8" stroke-width="1.8" />
      <line x1="0" y1="-12" x2="0" y2="12" stroke="#38bdf8" stroke-width="2" />
      <text x="0" y="-15" fill="#38bdf8" font-size="7.5" font-weight="700" text-anchor="middle">F2- (gPV)</text>
      <text x="0" y="20" fill="#94a3b8" font-size="6" text-anchor="middle">15A 1000V</text>
    </g>

    <!-- Lines from Fuses to QPV Isolator -->
    <line x1="220" y1="74" x2="264" y2="74" stroke="#ef4444" stroke-width="2.5" />
    <line x1="220" y1="102" x2="264" y2="102" stroke="#38bdf8" stroke-width="2.5" />
    <line x1="220" y1="172" x2="264" y2="172" stroke="#ef4444" stroke-width="2.5" />
    <line x1="220" y1="200" x2="264" y2="200" stroke="#38bdf8" stroke-width="2.5" />

    <!-- QPV: DC Load-Break Switch-Disconnector (DC-PV2 1000V 32A) -->
    <g class="sld-component-node sld-breaker-symbol" id="sld-dc-isolator-3p" data-component="qpv_isolator" data-breaker="dc_isolator" transform="translate(272, 137)" style="cursor:pointer">
      <rect x="-16" y="-72" width="32" height="144" rx="6" fill="#1e293b" stroke="#f59e0b" stroke-width="2" />
      <text x="0" y="-78" fill="#f59e0b" font-size="8.5" font-weight="700" text-anchor="middle">QPV (DC-PV2)</text>
      <!-- Pole 1 (S1+) -->
      <circle cx="-8" cy="-63" r="2.8" fill="#ef4444" />
      <circle cx="8" cy="-63" r="2.8" fill="#ef4444" />
      <line class="dc_isolator-blade" x1="-8" y1="-63" x2="6" y2="-70" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" />
      <!-- Pole 2 (S1-) -->
      <circle cx="-8" cy="-35" r="2.8" fill="#38bdf8" />
      <circle cx="8" cy="-35" r="2.8" fill="#38bdf8" />
      <line class="dc_isolator-blade" x1="-8" y1="-35" x2="6" y2="-42" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" />
      <!-- Pole 3 (S2+) -->
      <circle cx="-8" cy="35" r="2.8" fill="#ef4444" />
      <circle cx="8" cy="35" r="2.8" fill="#ef4444" />
      <line class="dc_isolator-blade" x1="-8" y1="35" x2="6" y2="28" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" />
      <!-- Pole 4 (S2-) -->
      <circle cx="-8" cy="63" r="2.8" fill="#38bdf8" />
      <circle cx="8" cy="63" r="2.8" fill="#38bdf8" />
      <line class="dc_isolator-blade" x1="-8" y1="63" x2="6" y2="56" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" />
      <text x="0" y="84" fill="#94a3b8" font-size="7" text-anchor="middle">1000V 32A</text>
    </g>

    <!-- Lines from QPV Isolator to Inverter & SPD Taps -->
    <!-- S1+ Out -->
    <line x1="280" y1="74" x2="410" y2="74" stroke="#ef4444" stroke-width="2.5" />
    <!-- S1- Out -->
    <line x1="280" y1="102" x2="410" y2="102" stroke="#38bdf8" stroke-width="2.5" />
    <!-- S2+ Out -->
    <line x1="280" y1="172" x2="410" y2="172" stroke="#ef4444" stroke-width="2.5" />
    <!-- S2- Out -->
    <line x1="280" y1="200" x2="410" y2="200" stroke="#38bdf8" stroke-width="2.5" />

    <!-- Taps to DC SPD -->
    <line x1="330" y1="74" x2="330" y2="114" stroke="#ef4444" stroke-width="1.8" />
    <line x1="330" y1="114" x2="337" y2="114" stroke="#ef4444" stroke-width="1.8" />
    <line x1="324" y1="102" x2="324" y2="134" stroke="#38bdf8" stroke-width="1.8" />
    <line x1="324" y1="134" x2="337" y2="134" stroke="#38bdf8" stroke-width="1.8" />

    <!-- DC SPD Type 2 (1000V DC, 3-Terminal) -->
    <g class="sld-component-node" data-component="dc_spd" transform="translate(347, 137)" style="cursor:pointer">
      <rect x="-14" y="-36" width="28" height="72" rx="4" fill="#1e293b" stroke="#ef4444" stroke-width="1.8" />
      <text x="0" y="-42" fill="#ef4444" font-size="7.5" font-weight="700" text-anchor="middle">ارستر DC SPD</text>
      <!-- (+) Terminal -->
      <circle cx="-10" cy="-23" r="2.5" fill="#ef4444" />
      <text x="2" y="-20" fill="#ef4444" font-size="6.5" font-weight="bold">(+)</text>
      <!-- (-) Terminal -->
      <circle cx="-10" cy="-3" r="2.5" fill="#38bdf8" />
      <text x="2" y="0" fill="#38bdf8" font-size="6.5" font-weight="bold">(-)</text>
      <!-- (PE) Terminal -->
      <circle cx="-10" cy="18" r="2.5" fill="#22c55e" />
      <text x="2" y="21" fill="#22c55e" font-size="6.5" font-weight="bold">(PE)</text>
      <text x="0" y="45" fill="#94a3b8" font-size="6.5" text-anchor="middle">Type 2</text>
    </g>

    <!-- Grounding Conductor from DC SPD to MET Busbar -->
    <line x1="347" y1="155" x2="347" y2="230" stroke="#22c55e" stroke-width="2" stroke-dasharray="4,3" />
    <line x1="347" y1="230" x2="347" y2="650" stroke="#22c55e" stroke-width="2" stroke-dasharray="4,3" />
    <text x="353" y="245" fill="#22c55e" font-size="7" font-weight="bold">PE 6mm²</text>

    <line x1="180" y1="315" x2="209" y2="315" stroke="#10b981" stroke-width="3.5" />
    <line x1="241" y1="315" x2="286" y2="315" stroke="#10b981" stroke-width="3.5" />
    <line x1="314" y1="315" x2="410" y2="315" stroke="#10b981" stroke-width="3.5" />

    <!-- ================================================================= -->
    <!-- 2. TRUE 3-PHASE HYBRID INVERTER (CENTER)                          -->
    <!-- ================================================================= -->
    <g class="sld-component-node" data-component="hybrid_inverter" transform="translate(410, 60)" style="cursor:pointer">
      <rect width="210" height="340" rx="12" fill="url(#inv3Grad)" stroke="#a855f7" stroke-width="2.5" />
      <rect x="0" y="0" width="210" height="32" rx="12" fill="rgba(168,85,247,0.2)" />
      <text x="105" y="21" fill="#c084fc" font-size="11.5" font-weight="700" text-anchor="middle">اینورتر هایبرید سه‌فاز ۱۵kW واقعی</text>
      <text x="105" y="48" fill="#94a3b8" font-size="8.5" text-anchor="middle">3-Phase 400V 50Hz / 15kVA</text>

      <!-- MPPT Block -->
      <rect x="15" y="65" width="80" height="50" rx="4" fill="rgba(245,158,11,0.15)" stroke="#f59e0b" stroke-width="1.2" />
      <text x="55" y="85" fill="#fbbf24" font-size="8.5" font-weight="700" text-anchor="middle">دوگانه MPPT</text>
      <text x="55" y="102" fill="#94a3b8" font-size="7.5" text-anchor="middle">160-800VDC</text>

      <!-- Bidirectional DC-DC -->
      <rect x="15" y="240" width="80" height="50" rx="4" fill="rgba(16,185,129,0.15)" stroke="#10b981" stroke-width="1.2" />
      <text x="55" y="260" fill="#34d399" font-size="8.5" font-weight="700" text-anchor="middle">شارژر دوطرفه</text>
      <text x="55" y="278" fill="#94a3b8" font-size="7.5" text-anchor="middle">DC-DC 48V/HV</text>

      <!-- 3-Phase Inverter Bridge -->
      <rect x="110" y="130" width="85" height="90" rx="6" fill="rgba(168,85,247,0.2)" stroke="#a855f7" stroke-width="1.5" />
      <path d="M125,185 L140,165 L155,185 L170,165" stroke="#a855f7" stroke-width="2" fill="none" />
      <text x="152" y="152" fill="#e9d5ff" font-size="9" font-weight="700" text-anchor="middle">پل اینورتر ۳ فاز</text>
      <text x="152" y="208" fill="#c084fc" font-size="7.5" text-anchor="middle">3x IGBT Bridge</text>

      <!-- Port Badges -->
      <rect x="115" y="65" width="80" height="30" rx="4" fill="rgba(2,132,199,0.2)" stroke="#38bdf8" stroke-width="1" />
      <text x="155" y="84" fill="#38bdf8" font-size="8.5" font-weight="700" text-anchor="middle">پورت GRID (4P)</text>

      <rect x="115" y="260" width="80" height="30" rx="4" fill="rgba(168,85,247,0.2)" stroke="#c084fc" stroke-width="1" />
      <text x="155" y="279" fill="#c084fc" font-size="8.5" font-weight="700" text-anchor="middle">پورت EPS (4P)</text>
    </g>

    <!-- ================================================================= -->
    <!-- 3. 3-PHASE GRID & DISTRIBUTION BUSBAR BUS-G3                      -->
    <!-- ================================================================= -->
    <!-- Utility Grid Source -->
    <g class="sld-component-node" data-component="utility_grid" transform="translate(1080, 70)" style="cursor:pointer">
      <rect width="150" height="60" rx="6" fill="rgba(14,165,233,0.15)" stroke="#0ea5e9" stroke-width="2" />
      <text x="75" y="-8" fill="#38bdf8" font-size="11" font-weight="700" text-anchor="middle">شبکه سراسری سه‌فاز (Utility)</text>
      <text x="75" y="26" fill="#e2e8f0" font-size="9.5" text-anchor="middle">3P+N 400/230V 50Hz</text>
      <text x="75" y="46" fill="#94a3b8" font-size="8.5" text-anchor="middle">سیستم زمین TN-C-S / TN-S</text>
    </g>

    <!-- M0 & Q0 -->
    <g class="sld-component-node" data-component="m0_meter" transform="translate(1010, 100)" style="cursor:pointer">
      <circle cx="0" cy="0" r="18" fill="#1e293b" stroke="#0ea5e9" stroke-width="1.8" />
      <text x="0" y="4" fill="#38bdf8" font-size="9" font-weight="700" text-anchor="middle">M0</text>
      <text x="0" y="-24" fill="#94a3b8" font-size="7.5" text-anchor="middle">کنتور سه‌فاز</text>
    </g>
    <g class="sld-component-node" data-component="q0_mcb" transform="translate(930, 100)" style="cursor:pointer">
      <rect x="-16" y="-18" width="32" height="36" rx="4" fill="#1e293b" stroke="#0ea5e9" stroke-width="2" />
      <text x="0" y="-24" fill="#38bdf8" font-size="9" font-weight="700" text-anchor="middle">Q0: کلید اصلی 4P</text>
      <text x="0" y="32" fill="#94a3b8" font-size="8" text-anchor="middle">32A 4P 10kA</text>
    </g>

    <!-- CTs at PCC -->
    <g class="sld-component-node" data-component="ct_pcc" transform="translate(860, 100)" style="cursor:pointer">
      <circle cx="0" cy="0" r="14" fill="#0f172a" stroke="#f59e0b" stroke-width="1.8" />
      <text x="0" y="4" fill="#fbbf24" font-size="7.5" font-weight="700" text-anchor="middle">3x CT</text>
      <text x="0" y="-20" fill="#fbbf24" font-size="7" text-anchor="middle">ترانس جریان PCC</text>
    </g>

    <!-- BUS-G3 (4-Pole AC Busbar: L1, L2, L3, N) -->
    <g class="sld-component-node" data-component="bus_g3" transform="translate(800, 70)" style="cursor:pointer">
      <!-- Busbar L1 (Red) -->
      <line x1="0" y1="20" x2="0" y2="280" stroke="#ef4444" stroke-width="4" />
      <!-- Busbar L2 (Yellow) -->
      <line x1="8" y1="20" x2="8" y2="280" stroke="#eab308" stroke-width="4" />
      <!-- Busbar L3 (Blue) -->
      <line x1="16" y1="20" x2="16" y2="280" stroke="#3b82f6" stroke-width="4" />
      <!-- Busbar N (Cyan) -->
      <line x1="24" y1="20" x2="24" y2="280" stroke="#06b6d4" stroke-width="3" stroke-dasharray="6 3" />
      <text x="12" y="-10" fill="#38bdf8" font-size="10" font-weight="700" text-anchor="middle">BUS-G3: شینه سه‌فاز اصلی</text>
      <text x="12" y="5" fill="#94a3b8" font-size="7.5" text-anchor="middle">L1-L2-L3-N (63A)</text>
    </g>

    <!-- Inverter Grid Port Feeder (QG3 4P MCB) -->
    <g class="sld-component-node" data-component="qg3_mcb" transform="translate(680, 110)" style="cursor:pointer">
      <rect x="-16" y="-18" width="32" height="36" rx="4" fill="#1e293b" stroke="#38bdf8" stroke-width="1.8" />
      <text x="0" y="-24" fill="#38bdf8" font-size="9" font-weight="700" text-anchor="middle">QG3: فیدر شبکه اینورتر</text>
      <text x="0" y="32" fill="#94a3b8" font-size="8" text-anchor="middle">25A 4P Curve C</text>
    </g>

    <!-- Bypass Feeder (QBP3 4P MCB) -->
    <g class="sld-component-node" data-component="qbp_mcb" transform="translate(870, 200)" style="cursor:pointer">
      <rect x="-16" y="-18" width="32" height="36" rx="4" fill="#1e293b" stroke="#0284c7" stroke-width="1.8" />
      <text x="0" y="-24" fill="#38bdf8" font-size="8.5" font-weight="700" text-anchor="middle">QBP3: بای‌پاس سه‌فاز</text>
      <text x="0" y="32" fill="#94a3b8" font-size="8" text-anchor="middle">32A 4P (منبع II)</text>
    </g>

    <!-- Non-essential DB Feeder (QN3 4P) -->
    <g class="sld-component-node" data-component="non_essential_db" transform="translate(970, 270)" style="cursor:pointer">
      <rect width="130" height="55" rx="6" fill="rgba(100,116,139,0.2)" stroke="#64748b" stroke-width="1.5" />
      <text x="65" y="-6" fill="#94a3b8" font-size="9.5" font-weight="700" text-anchor="middle">QN3: تابلوی بارهای عادی سه‌فاز</text>
      <text x="65" y="24" fill="#cbd5e1" font-size="8.5" text-anchor="middle">بارهای غیرضروری ساختمان</text>
      <text x="65" y="42" fill="#f87171" font-size="7.5" text-anchor="middle">(قطع خودکار در بی‌برقی)</text>
    </g>

    <!-- AC SPD 3P+N -->
    <g class="sld-component-node" data-component="ac_spd" transform="translate(850, 310)" style="cursor:pointer">
      <rect x="-14" y="-16" width="28" height="32" rx="4" fill="#1e293b" stroke="#ef4444" stroke-width="1.5" />
      <text x="0" y="-22" fill="#ef4444" font-size="7.5" font-weight="700" text-anchor="middle">SPD-AC 3P+N</text>
      <text x="0" y="30" fill="#94a3b8" font-size="7" text-anchor="middle">Type 2 Uc 275V</text>
    </g>

    <!-- Grid connections -->
    <line x1="1080" y1="100" x2="1028" y2="100" stroke="#38bdf8" stroke-width="3" />
    <line x1="992" y1="100" x2="946" y2="100" stroke="#38bdf8" stroke-width="3" />
    <line x1="914" y1="100" x2="874" y2="100" stroke="#38bdf8" stroke-width="3" />
    <line x1="846" y1="100" x2="824" y2="100" stroke="#38bdf8" stroke-width="3" />

    <line x1="620" y1="80" x2="664" y2="80" stroke="#38bdf8" stroke-width="3" />
    <line x1="696" y1="80" x2="800" y2="80" stroke="#38bdf8" stroke-width="3" />

    <line x1="824" y1="200" x2="854" y2="200" stroke="#0284c7" stroke-width="3" />
    <line x1="886" y1="200" x2="940" y2="200" stroke="#0284c7" stroke-width="3" />

    <line x1="824" y1="285" x2="970" y2="285" stroke="#64748b" stroke-width="2.5" />

    <!-- ================================================================= -->
    <!-- 4. 3-PHASE SBY3 CHANGEOVER & ESSENTIAL 3-PHASE DB                 -->
    <!-- ================================================================= -->
    <!-- Inverter EPS Feeder (QE3 4P MCB) -->
    <g class="sld-component-node" data-component="qe3_mcb" transform="translate(680, 320)" style="cursor:pointer">
      <rect x="-16" y="-18" width="32" height="36" rx="4" fill="#1e293b" stroke="#a855f7" stroke-width="1.8" />
      <text x="0" y="-24" fill="#c084fc" font-size="9" font-weight="700" text-anchor="middle">QE3: فیدر اضطراری EPS</text>
      <text x="0" y="32" fill="#94a3b8" font-size="8" text-anchor="middle">25A 4P (منبع I)</text>
    </g>

    <!-- SBY3 Switch (4-Pole I-0-II) -->
    <g class="sld-component-node" data-component="sby3_switch" transform="translate(800, 440)" style="cursor:pointer">
      <circle cx="0" cy="0" r="32" fill="#1e293b" stroke="#f59e0b" stroke-width="2.2" />
      <line x1="0" y1="24" x2="-20" y2="-12" stroke="#a855f7" stroke-width="4" stroke-linecap="round" />
      <circle cx="0" cy="24" r="4" fill="#fff" />
      <circle cx="-20" cy="-12" r="4" fill="#c084fc" />
      <circle cx="20" cy="-12" r="4" fill="#38bdf8" />
      <circle cx="0" cy="-22" r="3" fill="#ef4444" />
      <text x="0" y="-40" fill="#f59e0b" font-size="10.5" font-weight="700" text-anchor="middle">SBY3: کلید تبدیل سه‌فاز 4P</text>
      <text x="0" y="52" fill="#94a3b8" font-size="8" text-anchor="middle">I=EPS | 0=قطع | II=بای‌پاس</text>
    </g>

    <!-- Outgoing Feeder (QO3 4P MCB) -->
    <g class="sld-component-node" data-component="qo_mcb" transform="translate(800, 550)" style="cursor:pointer">
      <rect x="-16" y="-18" width="32" height="36" rx="4" fill="#1e293b" stroke="#22c55e" stroke-width="2" />
      <text x="0" y="-24" fill="#22c55e" font-size="9" font-weight="700" text-anchor="middle">QO3: کلید ورودی تابلوی ضروری</text>
      <text x="0" y="32" fill="#94a3b8" font-size="8" text-anchor="middle">32A 4P Curve C</text>
    </g>

    <!-- Wiring to SBY3 -->
    <line x1="620" y1="275" x2="664" y2="275" stroke="#a855f7" stroke-width="3" />
    <line x1="696" y1="275" x2="740" y2="275" stroke="#a855f7" stroke-width="3" />
    <line x1="740" y1="275" x2="780" y2="428" stroke="#a855f7" stroke-width="3" />

    <line x1="940" y1="200" x2="940" y2="428" stroke="#0284c7" stroke-width="3" />
    <line x1="940" y1="428" x2="820" y2="428" stroke="#0284c7" stroke-width="3" />

    <line x1="800" y1="472" x2="800" y2="532" stroke="#22c55e" stroke-width="3.5" />
    <line x1="800" y1="568" x2="800" y2="610" stroke="#22c55e" stroke-width="3.5" />

    <!-- ================================================================= -->
    <!-- 5. ESSENTIAL 3-PHASE DISTRIBUTION BOARD (BOTTOM RIGHT)            -->
    <!-- ================================================================= -->
    <g class="sld-component-node" data-component="essential_db" transform="translate(300, 610)" style="cursor:pointer">
      <rect width="650" height="130" rx="8" fill="rgba(30,41,59,0.7)" stroke="#22c55e" stroke-width="2" />
      <text x="325" y="-10" fill="#22c55e" font-size="12" font-weight="700" text-anchor="middle">تابلوی بارهای ضروری سه‌فاز (DB-Essential 3-Phase)</text>

      <!-- Branch L1 RCBO -->
      <g class="sld-component-node" data-component="rcbo_circuits" transform="translate(40, 25)" style="cursor:pointer">
        <rect width="110" height="85" rx="6" fill="#1e293b" stroke="#ef4444" stroke-width="1.5" />
        <text x="55" y="18" fill="#f87171" font-size="9" font-weight="700" text-anchor="middle">شاخه فاز L1</text>
        <text x="55" y="36" fill="#cbd5e1" font-size="8" text-anchor="middle">RCBO 1P+N 16A</text>
        <text x="55" y="52" fill="#94a3b8" font-size="7.5" text-anchor="middle">30mA Type A</text>
        <text x="55" y="72" fill="#ef4444" font-size="8" text-anchor="middle">روشنایی و پریزهای L1</text>
      </g>

      <!-- Branch L2 RCBO -->
      <g class="sld-component-node" data-component="rcbo_circuits" transform="translate(170, 25)" style="cursor:pointer">
        <rect width="110" height="85" rx="6" fill="#1e293b" stroke="#eab308" stroke-width="1.5" />
        <text x="55" y="18" fill="#facc15" font-size="9" font-weight="700" text-anchor="middle">شاخه فاز L2</text>
        <text x="55" y="36" fill="#cbd5e1" font-size="8" text-anchor="middle">RCBO 1P+N 16A</text>
        <text x="55" y="52" fill="#94a3b8" font-size="7.5" text-anchor="middle">30mA Type A</text>
        <text x="55" y="72" fill="#eab308" font-size="8" text-anchor="middle">یخچال و سرور L2</text>
      </g>

      <!-- Branch L3 RCBO -->
      <g class="sld-component-node" data-component="rcbo_circuits" transform="translate(300, 25)" style="cursor:pointer">
        <rect width="110" height="85" rx="6" fill="#1e293b" stroke="#3b82f6" stroke-width="1.5" />
        <text x="55" y="18" fill="#60a5fa" font-size="9" font-weight="700" text-anchor="middle">شاخه فاز L3</text>
        <text x="55" y="36" fill="#cbd5e1" font-size="8" text-anchor="middle">RCBO 1P+N 16A</text>
        <text x="55" y="52" fill="#94a3b8" font-size="7.5" text-anchor="middle">30mA Type A</text>
        <text x="55" y="72" fill="#3b82f6" font-size="8" text-anchor="middle">پکیج و کنترلی L3</text>
      </g>

      <!-- 3-Phase Motor Branch with PMR & SCPD -->
      <g class="sld-component-node" data-component="motor_scpd" transform="translate(430, 25)" style="cursor:pointer">
        <rect width="195" height="85" rx="6" fill="url(#motorGrad)" stroke="#f59e0b" stroke-width="1.8" />
        <text x="97" y="18" fill="#fbbf24" font-size="9.5" font-weight="700" text-anchor="middle">فیدر بار موتوری سه‌فاز ضروری</text>
        
        <!-- SCPD & PMR badges -->
        <g class="sld-component-node" data-component="pmr_relay" transform="translate(10, 28)" style="cursor:pointer">
          <rect width="80" height="46" rx="4" fill="#0f172a" stroke="#a855f7" stroke-width="1.2" />
          <text x="40" y="16" fill="#c084fc" font-size="7.5" font-weight="700" text-anchor="middle">رله PMR سه‌فاز</text>
          <text x="40" y="30" fill="#94a3b8" font-size="6.5" text-anchor="middle">پایش قطع/توالی/عدم‌تقارن</text>
        </g>

        <!-- Motor Symbol -->
        <g transform="translate(105, 28)">
          <circle cx="40" cy="23" r="18" fill="#1e293b" stroke="#38bdf8" stroke-width="1.8" />
          <text x="40" y="28" fill="#38bdf8" font-size="12" font-weight="700" text-anchor="middle">M 3~</text>
          <text x="40" y="52" fill="#94a3b8" font-size="7" text-anchor="middle">الکتروموتور ۵.۵kW</text>
        </g>
      </g>
    </g>

    <!-- ================================================================= -->
    <!-- 6. MET BAR & PROTECTIVE EARTHING (NEVER SWITCHED)                 -->
    <!-- ================================================================= -->
    <g class="sld-component-node" data-component="met_bar" transform="translate(50, 720)" style="cursor:pointer">
      <rect width="210" height="24" rx="4" fill="#1e293b" stroke="#22c55e" stroke-width="2" />
      <text x="105" y="16" fill="#4ade80" font-size="9.5" font-weight="700" text-anchor="middle">شینه اصلی زمین (MET) — هادی PE پیوسته</text>
      <!-- Earth Symbol -->
      <line x1="220" y1="12" x2="250" y2="12" stroke="#22c55e" stroke-width="2.5" />
      <line x1="250" y1="4" x2="250" y2="20" stroke="#22c55e" stroke-width="2.5" />
      <line x1="255" y1="7" x2="255" y2="17" stroke="#22c55e" stroke-width="2" />
      <line x1="260" y1="10" x2="260" y2="14" stroke="#22c55e" stroke-width="1.5" />
    </g>

  </g>
</svg>
`
    },
    'SLD-03': {
      title: 'انتقال خودکار خارجی (SLD-03 / ATSE)',
      svg: `
<svg id="sld-svg-canvas" viewBox="0 0 1280 780" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="atseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e293b" />
      <stop offset="100%" stop-color="#0f172a" />
    </linearGradient>
  </defs>

  <!-- Blueprint Grid -->
  <g stroke="rgba(255,255,255,0.03)" stroke-width="1">
    <line x1="0" y1="0" x2="0" y2="780" /><line x1="50" y1="0" x2="50" y2="780" /><line x1="100" y1="0" x2="100" y2="780" /><line x1="150" y1="0" x2="150" y2="780" /><line x1="200" y1="0" x2="200" y2="780" /><line x1="250" y1="0" x2="250" y2="780" /><line x1="300" y1="0" x2="300" y2="780" /><line x1="350" y1="0" x2="350" y2="780" /><line x1="400" y1="0" x2="400" y2="780" /><line x1="450" y1="0" x2="450" y2="780" /><line x1="500" y1="0" x2="500" y2="780" /><line x1="550" y1="0" x2="550" y2="780" /><line x1="600" y1="0" x2="600" y2="780" /><line x1="650" y1="0" x2="650" y2="780" /><line x1="700" y1="0" x2="700" y2="780" /><line x1="750" y1="0" x2="750" y2="780" /><line x1="800" y1="0" x2="800" y2="780" /><line x1="850" y1="0" x2="850" y2="780" /><line x1="900" y1="0" x2="900" y2="780" /><line x1="950" y1="0" x2="950" y2="780" /><line x1="1000" y1="0" x2="1000" y2="780" /><line x1="1050" y1="0" x2="1050" y2="780" /><line x1="1100" y1="0" x2="1100" y2="780" /><line x1="1150" y1="0" x2="1150" y2="780" /><line x1="1200" y1="0" x2="1200" y2="780" /><line x1="1250" y1="0" x2="1250" y2="780" />
    <line x1="0" y1="0" x2="1280" y2="0" /><line x1="0" y1="50" x2="1280" y2="50" /><line x1="0" y1="100" x2="1280" y2="100" /><line x1="0" y1="150" x2="1280" y2="150" /><line x1="0" y1="200" x2="1280" y2="200" /><line x1="0" y1="250" x2="1280" y2="250" /><line x1="0" y1="300" x2="1280" y2="300" /><line x1="0" y1="350" x2="1280" y2="350" /><line x1="0" y1="400" x2="1280" y2="400" /><line x1="0" y1="450" x2="1280" y2="450" /><line x1="0" y1="500" x2="1280" y2="500" /><line x1="0" y1="550" x2="1280" y2="550" /><line x1="0" y1="600" x2="1280" y2="600" /><line x1="0" y1="650" x2="1280" y2="650" /><line x1="0" y1="700" x2="1280" y2="700" /><line x1="0" y1="750" x2="1280" y2="750" />
  </g>

  <!-- Header -->
  <text x="640" y="28" fill="#f59e0b" font-size="14" font-family="'Vazirmatn', sans-serif" font-weight="700" text-anchor="middle">
    نقشه انتقال خودکار خارجی بارهای منتخب (SLD-03 / ATSE) — استاندارد IEC 60947-6-1:2026
  </text>
  <text x="640" y="46" fill="#94a3b8" font-size="10" font-family="'Vazirmatn', sans-serif" text-anchor="middle">
    طرح جایگزین انتقال خودکار کل واحد با کنتاکتورهای KG و KE، اینترلاک مکانیکی سازنده و فیدبک Mirror
  </text>

  <!-- Pan-Zoom Group -->
  <g id="sld-pan-zoom-group" transform="translate(0, 0) scale(1)">

    <!-- Source I: Utility Grid Busbar BUS-G -->
    <g class="sld-component-node" data-component="bus_g" transform="translate(80, 100)" style="cursor:pointer">
      <rect width="180" height="70" rx="8" fill="rgba(2,132,199,0.2)" stroke="#0ea5e9" stroke-width="2" />
      <text x="90" y="24" fill="#38bdf8" font-size="11" font-weight="700" text-anchor="middle">شینه توزیع شبکه (BUS-G)</text>
      <text x="90" y="44" fill="#e2e8f0" font-size="9.5" text-anchor="middle">تغذیه از شبکه شهری عبر Q0</text>
      <text x="90" y="60" fill="#94a3b8" font-size="8" text-anchor="middle">230V / 400V 50Hz</text>
    </g>

    <!-- Branch to Inverter GRID Port (Parallel) -->
    <g class="sld-component-node" data-component="qg_mcb" transform="translate(80, 240)" style="cursor:pointer">
      <rect width="180" height="60" rx="6" fill="#1e293b" stroke="#38bdf8" stroke-width="1.8" />
      <text x="90" y="22" fill="#38bdf8" font-size="10" font-weight="700" text-anchor="middle">QG: شاخه اتصال اینورتر به شبکه</text>
      <text x="90" y="42" fill="#94a3b8" font-size="8.5" text-anchor="middle">مسیر مجزای تزریق موازی (Grid-Parallel)</text>
    </g>
    <line x1="170" y1="170" x2="170" y2="240" stroke="#38bdf8" stroke-width="3" />

    <!-- Inverter Box -->
    <g class="sld-component-node" data-component="hybrid_inverter" transform="translate(80, 350)" style="cursor:pointer">
      <rect width="180" height="110" rx="8" fill="url(#atseGrad)" stroke="#a855f7" stroke-width="2" />
      <text x="90" y="24" fill="#c084fc" font-size="11" font-weight="700" text-anchor="middle">اینورتر هایبرید ۵kW</text>
      <text x="90" y="46" fill="#94a3b8" font-size="9" text-anchor="middle">تغذیه از PV و BESS</text>
      <text x="90" y="70" fill="#38bdf8" font-size="8.5" text-anchor="middle">پورت GRID: سنکرون با شبکه</text>
      <text x="90" y="90" fill="#f0abfc" font-size="8.5" text-anchor="middle">پورت EPS: خروجی پشتیبان دائم</text>
    </g>
    <line x1="170" y1="300" x2="170" y2="350" stroke="#38bdf8" stroke-width="3" />

    <!-- Source I Feeder: QGT MCB to KG Contactor -->
    <line x1="260" y1="135" x2="420" y2="135" stroke="#38bdf8" stroke-width="3.5" />
    <g class="sld-component-node" data-component="q0_mcb" transform="translate(320, 115)" style="cursor:pointer">
      <rect x="-16" y="-18" width="32" height="36" rx="4" fill="#1e293b" stroke="#0ea5e9" stroke-width="1.8" />
      <text x="0" y="-24" fill="#38bdf8" font-size="8.5" font-weight="700" text-anchor="middle">QGT</text>
      <text x="0" y="30" fill="#94a3b8" font-size="7.5" text-anchor="middle">63A MCB</text>
    </g>

    <!-- Source II Feeder: QE MCB to KE Contactor -->
    <line x1="260" y1="405" x2="420" y2="405" stroke="#a855f7" stroke-width="3.5" />
    <g class="sld-component-node" data-component="qe_mcb" transform="translate(320, 385)" style="cursor:pointer">
      <rect x="-16" y="-18" width="32" height="36" rx="4" fill="#1e293b" stroke="#a855f7" stroke-width="1.8" />
      <text x="0" y="-24" fill="#c084fc" font-size="8.5" font-weight="700" text-anchor="middle">QE</text>
      <text x="0" y="30" fill="#94a3b8" font-size="7.5" text-anchor="middle">32A MCB</text>
    </g>

    <!-- ================================================================= -->
    <!-- ATSE ENCLOSURE & DUAL CONTACTORS (KG & KE)                        -->
    <!-- ================================================================= -->
    <g class="sld-component-node" data-component="atse_unit" transform="translate(420, 80)" style="cursor:pointer">
      <rect width="460" height="400" rx="12" fill="rgba(15,23,42,0.85)" stroke="#f59e0b" stroke-width="2.5" />
      <text x="230" y="28" fill="#fbbf24" font-size="12" font-weight="700" text-anchor="middle">مجموعه کلید انتقال خودکار (ATSE Unit — Class PC/CC)</text>
      <text x="230" y="46" fill="#94a3b8" font-size="8.5" text-anchor="middle">IEC 60947-6-1:2026 / رده کاری AC-33B برای بارهای موتوری</text>

      <!-- KG Contactor (Grid Source I) -->
      <g class="sld-component-node" data-component="kg_contactor" transform="translate(50, 80)" style="cursor:pointer">
        <rect width="150" height="90" rx="8" fill="#1e293b" stroke="#38bdf8" stroke-width="2" />
        <text x="75" y="24" fill="#38bdf8" font-size="11" font-weight="700" text-anchor="middle">کنتاکتور KG (منبع I: شبکه)</text>
        <text x="75" y="44" fill="#e2e8f0" font-size="9" text-anchor="middle">63A 4P / AC-33B</text>
        <text x="75" y="62" fill="#22c55e" font-size="8.5" text-anchor="middle">وضعیت عادی: بسته (CLOSED)</text>
        <text x="75" y="78" fill="#94a3b8" font-size="7.5" text-anchor="middle">مجهز به کنتاکت Mirror (KG-M)</text>
      </g>

      <!-- KE Contactor (EPS Source II) -->
      <g class="sld-component-node" data-component="ke_contactor" transform="translate(50, 260)" style="cursor:pointer">
        <rect width="150" height="90" rx="8" fill="#1e293b" stroke="#a855f7" stroke-width="2" />
        <text x="75" y="24" fill="#c084fc" font-size="11" font-weight="700" text-anchor="middle">کنتاکتور KE (منبع II: پشتیبان)</text>
        <text x="75" y="44" fill="#e2e8f0" font-size="9" text-anchor="middle">63A 4P / AC-33B</text>
        <text x="75" y="62" fill="#ef4444" font-size="8.5" text-anchor="middle">وضعیت عادی: باز (OPEN)</text>
        <text x="75" y="78" fill="#94a3b8" font-size="7.5" text-anchor="middle">مجهز به کنتاکت Mirror (KE-M)</text>
      </g>

      <!-- Mechanical Interlock Symbol -->
      <g class="sld-component-node" data-component="mech_interlock" transform="translate(125, 205)" style="cursor:pointer">
        <rect x="-35" y="-15" width="70" height="30" rx="4" fill="#f59e0b" />
        <text x="0" y="5" fill="#0f172a" font-size="8.5" font-weight="900" text-anchor="middle">🔒 اینترلاک مکانیکی</text>
        <line x1="0" y1="-35" x2="0" y2="-15" stroke="#f59e0b" stroke-width="4" stroke-dasharray="3 3" />
        <line x1="0" y1="15" x2="0" y2="55" stroke="#f59e0b" stroke-width="4" stroke-dasharray="3 3" />
      </g>

      <!-- Common Output Busbar inside ATSE -->
      <line x1="200" y1="125" x2="290" y2="125" stroke="#38bdf8" stroke-width="3.5" />
      <line x1="200" y1="305" x2="290" y2="305" stroke="#a855f7" stroke-width="3.5" />
      <line x1="290" y1="125" x2="290" y2="305" stroke="#22c55e" stroke-width="4" />
      <line x1="290" y1="215" x2="420" y2="215" stroke="#22c55e" stroke-width="4" />
      <circle cx="290" cy="215" r="5" fill="#fff" />
      <text x="355" y="205" fill="#22c55e" font-size="9" font-weight="700" text-anchor="middle">شینه خروجی مشترک</text>

      <!-- ATSE Central Controller Block -->
      <g transform="translate(240, 310)">
        <rect width="200" height="75" rx="6" fill="#0f172a" stroke="#38bdf8" stroke-width="1.2" />
        <text x="100" y="18" fill="#38bdf8" font-size="9" font-weight="700" text-anchor="middle">واحد کنترل الکترونیکی ATSE</text>
        <text x="100" y="34" fill="#94a3b8" font-size="8" text-anchor="middle">پایش ولتاژ و فرکانس شبکه و اینورتر</text>
        <text x="100" y="50" fill="#fbbf24" font-size="7.5" text-anchor="middle">تایمر تثبیت شبکه TG = 60s</text>
        <text x="100" y="66" fill="#fbbf24" font-size="7.5" text-anchor="middle">زمان مرده انتقال TD = 150ms</text>
      </g>
    </g>

    <!-- Outgoing Protection QO MCB -->
    <line x1="880" y1="295" x2="960" y2="295" stroke="#22c55e" stroke-width="4" />
    <g class="sld-component-node" data-component="qo_mcb" transform="translate(990, 295)" style="cursor:pointer">
      <rect x="-18" y="-22" width="36" height="44" rx="4" fill="#1e293b" stroke="#22c55e" stroke-width="2" />
      <text x="0" y="-28" fill="#22c55e" font-size="10" font-weight="700" text-anchor="middle">QO: کلید خروجی مشترک</text>
      <text x="0" y="36" fill="#94a3b8" font-size="8.5" text-anchor="middle">63A 4P Curve C</text>
    </g>

    <!-- Selected Loads Distribution Board -->
    <line x1="1026" y1="295" x2="1080" y2="295" stroke="#22c55e" stroke-width="4" />
    <g class="sld-component-node" data-component="essential_db" transform="translate(1080, 210)" style="cursor:pointer">
      <rect width="170" height="170" rx="8" fill="rgba(34,197,94,0.15)" stroke="#22c55e" stroke-width="2" />
      <text x="85" y="24" fill="#4ade80" font-size="10.5" font-weight="700" text-anchor="middle">تابلوی بارهای منتخب</text>
      <text x="85" y="42" fill="#cbd5e1" font-size="8.5" text-anchor="middle">(Selected-Load DB)</text>
      <text x="85" y="66" fill="#e2e8f0" font-size="8" text-anchor="middle">تغذیه کامل واحد مسکونی</text>
      <text x="85" y="86" fill="#e2e8f0" font-size="8" text-anchor="middle">یا ساختمان انتخابی</text>
      <rect x="20" y="105" width="130" height="45" rx="4" fill="#0f172a" stroke="#f59e0b" stroke-width="1" />
      <text x="85" y="122" fill="#fbbf24" font-size="8" font-weight="700" text-anchor="middle">سیستم بارریزی خودکار</text>
      <text x="85" y="138" fill="#94a3b8" font-size="7" text-anchor="middle">جهت جلوگیری از اضافه‌بار EPS</text>
    </g>

    <!-- Timing & Transition Sequence Card -->
    <g transform="translate(420, 520)">
      <rect width="660" height="180" rx="8" fill="rgba(15,23,42,0.9)" stroke="#38bdf8" stroke-width="1.5" />
      <text x="330" y="25" fill="#38bdf8" font-size="11" font-weight="700" text-anchor="middle">توالی زمانی انتقال بدون همپوشانی (Break-Before-Make Transfer Sequence)</text>
      <line x1="30" y1="40" x2="630" y2="40" stroke="rgba(255,255,255,0.1)" stroke-width="1" />

      <g transform="translate(40, 55)">
        <circle cx="15" cy="15" r="14" fill="#0284c7" />
        <text x="15" y="19" fill="#fff" font-size="10" font-weight="700" text-anchor="middle">۱</text>
        <text x="40" y="14" fill="#e2e8f0" font-size="9" font-weight="700">تشخیص قطعی شبکه</text>
        <text x="40" y="28" fill="#94a3b8" font-size="7.5">رله GVR افت ولتاژ را در زمان کمتر از ۲۰۰ میلی‌ثانیه تایید می‌کند.</text>
      </g>

      <g transform="translate(40, 95)">
        <circle cx="15" cy="15" r="14" fill="#ef4444" />
        <text x="15" y="19" fill="#fff" font-size="10" font-weight="700" text-anchor="middle">۲</text>
        <text x="40" y="14" fill="#e2e8f0" font-size="9" font-weight="700">قطع فرمان بوبین KG و تایید فیدبک Mirror</text>
        <text x="40" y="28" fill="#94a3b8" font-size="7.5">کنتاکتور KG باز شده و کنتاکت KG-M باز بودن قطعی پلاتین‌ها را گزارش می‌دهد.</text>
      </g>

      <g transform="translate(40, 135)">
        <circle cx="15" cy="15" r="14" fill="#a855f7" />
        <text x="15" y="19" fill="#fff" font-size="10" font-weight="700" text-anchor="middle">۳</text>
        <text x="40" y="14" fill="#e2e8f0" font-size="9" font-weight="700">سپری شدن زمان مرده TD (۱۵۰ms) و وصل KE</text>
        <text x="40" y="28" fill="#94a3b8" font-size="7.5">پس از میرا شدن نیروی ضد محرکه موتورها، کنتاکتور KE بدون آرک و جرقه بسته می‌شود.</text>
      </g>
    </g>

  </g>
</svg>
`
    },
    'DC-01-02': {
      title: 'آرایه خورشیدی و پیش‌شارژ (DC-01/02)',
      svg: `
<svg id="sld-svg-canvas" viewBox="0 0 1280 780" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="dcPvGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.3" />
      <stop offset="100%" stop-color="#1e3a8a" stop-opacity="0.6" />
    </linearGradient>
    <linearGradient id="dcBatGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#059669" stop-opacity="0.3" />
      <stop offset="100%" stop-color="#064e3b" stop-opacity="0.6" />
    </linearGradient>
  </defs>

  <!-- Blueprint Grid -->
  <g stroke="rgba(255,255,255,0.03)" stroke-width="1">
    <line x1="0" y1="0" x2="0" y2="780" /><line x1="50" y1="0" x2="50" y2="780" /><line x1="100" y1="0" x2="100" y2="780" /><line x1="150" y1="0" x2="150" y2="780" /><line x1="200" y1="0" x2="200" y2="780" /><line x1="250" y1="0" x2="250" y2="780" /><line x1="300" y1="0" x2="300" y2="780" /><line x1="350" y1="0" x2="350" y2="780" /><line x1="400" y1="0" x2="400" y2="780" /><line x1="450" y1="0" x2="450" y2="780" /><line x1="500" y1="0" x2="500" y2="780" /><line x1="550" y1="0" x2="550" y2="780" /><line x1="600" y1="0" x2="600" y2="780" /><line x1="650" y1="0" x2="650" y2="780" /><line x1="700" y1="0" x2="700" y2="780" /><line x1="750" y1="0" x2="750" y2="780" /><line x1="800" y1="0" x2="800" y2="780" /><line x1="850" y1="0" x2="850" y2="780" /><line x1="900" y1="0" x2="900" y2="780" /><line x1="950" y1="0" x2="950" y2="780" /><line x1="1000" y1="0" x2="1000" y2="780" /><line x1="1050" y1="0" x2="1050" y2="780" /><line x1="1100" y1="0" x2="1100" y2="780" /><line x1="1150" y1="0" x2="1150" y2="780" /><line x1="1200" y1="0" x2="1200" y2="780" /><line x1="1250" y1="0" x2="1250" y2="780" />
    <line x1="0" y1="0" x2="1280" y2="0" /><line x1="0" y1="50" x2="1280" y2="50" /><line x1="0" y1="100" x2="1280" y2="100" /><line x1="0" y1="150" x2="1280" y2="150" /><line x1="0" y1="200" x2="1280" y2="200" /><line x1="0" y1="250" x2="1280" y2="250" /><line x1="0" y1="300" x2="1280" y2="300" /><line x1="0" y1="350" x2="1280" y2="350" /><line x1="0" y1="400" x2="1280" y2="400" /><line x1="0" y1="450" x2="1280" y2="450" /><line x1="0" y1="500" x2="1280" y2="500" /><line x1="0" y1="550" x2="1280" y2="550" /><line x1="0" y1="600" x2="1280" y2="600" /><line x1="0" y1="650" x2="1280" y2="650" /><line x1="0" y1="700" x2="1280" y2="700" /><line x1="0" y1="750" x2="1280" y2="750" />
  </g>

  <!-- Header -->
  <text x="640" y="28" fill="#fbbf24" font-size="14" font-family="'Vazirmatn', sans-serif" font-weight="700" text-anchor="middle">
    نقشه حفاظتی آرایه خورشیدی و سیستم پیش‌شارژ باتری (DC-01 / DC-02) — IEC 62548-1 و IEC 63056
  </text>
  <text x="640" y="46" fill="#94a3b8" font-size="10" font-family="'Vazirmatn', sans-serif" text-anchor="middle">
    فیوزهای دوطرفه gPV، کلید ایزولاتور DC-PV2، ارستر ۳ ترمیناله و مدار پیش‌شارژ کنتاکتوری KBAT/KPRE/RPRE
  </text>

  <!-- Pan-Zoom Group -->
  <g id="sld-pan-zoom-group" transform="translate(0, 0) scale(1)">

    <!-- ================================================================= -->
    <!-- SECTION 1: DC-01 PV PROTECTION (TOP HALF)                         -->
    <!-- ================================================================= -->
    <g transform="translate(80, 80)">
      <rect width="1120" height="260" rx="10" fill="rgba(30,41,59,0.5)" stroke="#38bdf8" stroke-width="1.8" />
      <text x="30" y="25" fill="#38bdf8" font-size="12" font-weight="700">شیت DC-01: حفاظت آرایه و ورودی MPPT خورشیدی</text>

      <!-- PV String Module -->
      <g class="sld-component-node" data-component="pv_modules" transform="translate(40, 60)" style="cursor:pointer">
        <rect width="130" height="140" rx="8" fill="url(#dcPvGrad)" stroke="#38bdf8" stroke-width="2" />
        <text x="65" y="24" fill="#f59e0b" font-size="11" font-weight="700" text-anchor="middle">استرینگ خورشیدی</text>
        <text x="65" y="46" fill="#e2e8f0" font-size="9" text-anchor="middle">7x 400W Monocrystalline</text>
        <text x="65" y="66" fill="#94a3b8" font-size="8.5" text-anchor="middle">Voc_STC: 385 V</text>
        <text x="65" y="84" fill="#94a3b8" font-size="8.5" text-anchor="middle">Voc_Cold (-10°C): 424 V</text>
        <text x="65" y="102" fill="#94a3b8" font-size="8.5" text-anchor="middle">Isc: 11.5 A | Imp: 10.8 A</text>
        <text x="65" y="125" fill="#38bdf8" font-size="8" text-anchor="middle">کابل H1Z2Z2-K 4mm²</text>
      </g>

      <!-- ============================================================= -->
      <!-- REALISTIC DC COMBINER BOX ENCLOSURE (IP65)                    -->
      <!-- ============================================================= -->
      <g id="sld-dc-combiner-box-detail">
        <rect x="210" y="45" width="530" height="190" rx="8" fill="rgba(15,23,42,0.92)" stroke="#f59e0b" stroke-width="2" stroke-dasharray="6,3" />
        <rect x="210" y="45" width="530" height="22" rx="6" fill="rgba(245,158,11,0.22)" />
        <text x="475" y="60" fill="#fbbf24" font-size="10" font-family="'Vazirmatn', sans-serif" font-weight="700" text-anchor="middle">تابلوی کمباینر باکس DC خورشیدی (IP65 Enclosure — IEC 62548)</text>

        <!-- DIN Rail -->
        <line x1="225" y1="130" x2="725" y2="130" stroke="#64748b" stroke-width="3" opacity="0.4" stroke-dasharray="4,2" />

        <!-- Entry Glands (Left) -->
        <rect x="204" y="80" width="8" height="20" rx="2" fill="#475569" stroke="#94a3b8" stroke-width="1" />
        <rect x="204" y="160" width="8" height="20" rx="2" fill="#475569" stroke="#94a3b8" stroke-width="1" />

        <!-- Exit Glands (Right) -->
        <rect x="738" y="80" width="8" height="20" rx="2" fill="#475569" stroke="#94a3b8" stroke-width="1" />
        <rect x="738" y="160" width="8" height="20" rx="2" fill="#475569" stroke="#94a3b8" stroke-width="1" />

        <!-- PE Gland (Bottom) -->
        <rect x="614" y="233" width="18" height="7" rx="2" fill="#475569" stroke="#94a3b8" stroke-width="1" />
      </g>

      <!-- Positive Line F-PV+ Fuse (Red Conductor) -->
      <line x1="170" y1="90" x2="250" y2="90" stroke="#ef4444" stroke-width="3.5" />
      <text x="185" y="82" fill="#ef4444" font-size="9" font-weight="bold">(+) هادی مثبت DC+</text>
      <g class="sld-component-node" data-component="string_fuse_pos" transform="translate(270, 90)" style="cursor:pointer">
        <rect x="-18" y="-18" width="36" height="36" rx="4" fill="#1e293b" stroke="#ef4444" stroke-width="2" />
        <line x1="0" y1="-18" x2="0" y2="18" stroke="#ef4444" stroke-width="2.5" />
        <text x="0" y="-24" fill="#ef4444" font-size="9" font-weight="700" text-anchor="middle">F-PV+ (قطب مثبت)</text>
        <text x="0" y="32" fill="#94a3b8" font-size="7.5" text-anchor="middle">15A 1000VDC gPV 10x38</text>
      </g>

      <!-- Negative Line F-PV- Fuse (Blue Conductor) -->
      <line x1="170" y1="170" x2="250" y2="170" stroke="#38bdf8" stroke-width="3.5" />
      <text x="185" y="162" fill="#38bdf8" font-size="9" font-weight="bold">(-) هادی منفی DC-</text>
      <g class="sld-component-node" data-component="string_fuse_neg" transform="translate(270, 170)" style="cursor:pointer">
        <rect x="-18" y="-18" width="36" height="36" rx="4" fill="#1e293b" stroke="#38bdf8" stroke-width="2" />
        <line x1="0" y1="-18" x2="0" y2="18" stroke="#38bdf8" stroke-width="2.5" />
        <text x="0" y="-24" fill="#38bdf8" font-size="9" font-weight="700" text-anchor="middle">F-PV- (قطب منفی)</text>
        <text x="0" y="32" fill="#94a3b8" font-size="7.5" text-anchor="middle">15A 1000VDC gPV 10x38</text>
      </g>

      <!-- QPV Load-Break Switch Disconnector (DC-PV2) -->
      <line x1="288" y1="90" x2="380" y2="90" stroke="#ef4444" stroke-width="3" />
      <line x1="288" y1="170" x2="380" y2="170" stroke="#38bdf8" stroke-width="3" />
      <g class="sld-component-node" data-component="qpv_isolator" transform="translate(420, 130)" style="cursor:pointer">
        <rect x="-35" y="-60" width="70" height="120" rx="6" fill="#1e293b" stroke="#f59e0b" stroke-width="2" />
        <text x="0" y="-70" fill="#f59e0b" font-size="10" font-weight="700" text-anchor="middle">QPV: کلید ایزولاتور DC</text>
        <!-- Pole 1 (Positive) -->
        <circle cx="-15" cy="-25" r="4" fill="#ef4444" />
        <circle cx="15" cy="-25" r="4" fill="#ef4444" />
        <line x1="-15" y1="-25" x2="10" y2="-40" stroke="#22c55e" stroke-width="3" stroke-linecap="round" />
        <text x="0" y="-8" fill="#ef4444" font-size="8" font-weight="bold">پل قطب (+)</text>
        <!-- Pole 2 (Negative) -->
        <circle cx="-15" cy="30" r="4" fill="#38bdf8" />
        <circle cx="15" cy="30" r="4" fill="#38bdf8" />
        <line x1="-15" y1="30" x2="10" y2="15" stroke="#22c55e" stroke-width="3" stroke-linecap="round" />
        <text x="0" y="48" fill="#38bdf8" font-size="8" font-weight="bold">پل قطب (-)</text>
        <text x="0" y="75" fill="#94a3b8" font-size="8" text-anchor="middle">1000VDC 32A DC-PV2</text>
      </g>

      <!-- 3-Terminal Coordinated DC SPD Assembly -->
      <line x1="455" y1="90" x2="580" y2="90" stroke="#ef4444" stroke-width="3" />
      <line x1="455" y1="170" x2="580" y2="170" stroke="#38bdf8" stroke-width="3" />
      <!-- SPD Taps -->
      <line x1="560" y1="90" x2="560" y2="95" stroke="#ef4444" stroke-width="2.5" />
      <line x1="560" y1="170" x2="560" y2="130" stroke="#38bdf8" stroke-width="2.5" />
      <g class="sld-component-node" data-component="dc_spd" transform="translate(620, 130)" style="cursor:pointer">
        <rect x="-40" y="-60" width="80" height="120" rx="8" fill="#1e293b" stroke="#ef4444" stroke-width="2" />
        <text x="0" y="-70" fill="#ef4444" font-size="10" font-weight="700" text-anchor="middle">SPD-PV: ارستر DC ۳ ترمیناله</text>
        <circle cx="-25" cy="-35" r="5" fill="#ef4444" />
        <text x="0" y="-32" fill="#ef4444" font-size="8" font-weight="700">ترمینال (+)</text>
        <circle cx="-25" cy="0" r="5" fill="#38bdf8" />
        <text x="0" y="3" fill="#38bdf8" font-size="8" font-weight="700">ترمینال (-)</text>
        <circle cx="-25" cy="35" r="5" fill="#22c55e" />
        <text x="0" y="38" fill="#4ade80" font-size="8" font-weight="700">ترمینال (PE)</text>
        <text x="0" y="75" fill="#94a3b8" font-size="7.5" text-anchor="middle">Type 2 | Ucpv: 1000V | In: 20kA</text>
      </g>
      <!-- SPD Earth Wire to Bottom Gland and MET -->
      <line x1="620" y1="190" x2="620" y2="240" stroke="#22c55e" stroke-width="2.5" stroke-dasharray="4,2" />
      <text x="635" y="225" fill="#22c55e" font-size="8" font-weight="bold">PE به MET</text>

      <!-- Output to Inverter MPPT1 -->
      <line x1="455" y1="90" x2="800" y2="90" stroke="#ef4444" stroke-width="3" />
      <line x1="455" y1="170" x2="800" y2="170" stroke="#38bdf8" stroke-width="3" />
      <g class="sld-component-node" data-component="hybrid_inverter" transform="translate(800, 80)" style="cursor:pointer">
        <rect width="280" height="100" rx="8" fill="#0f172a" stroke="#a855f7" stroke-width="2" />
        <text x="140" y="26" fill="#c084fc" font-size="11" font-weight="700" text-anchor="middle">ورودی MPPT1 اینورتر هایبرید</text>
        <text x="140" y="48" fill="#cbd5e1" font-size="9" text-anchor="middle">محدوده MPPT: 120-450 VDC</text>
        <text x="140" y="68" fill="#94a3b8" font-size="8" text-anchor="middle">حداکثر ولتاژ مدار باز مجاز: 500 VDC</text>
        <text x="140" y="86" fill="#22c55e" font-size="8" text-anchor="middle">پایش عایقی RCMU و پایش خطای زمین پیوسته</text>
      </g>
    </g>

    <!-- ================================================================= -->
    <!-- SECTION 2: DC-02 BATTERY & PRECHARGE CIRCUIT (BOTTOM HALF)        -->
    <!-- ================================================================= -->
    <g transform="translate(80, 370)">
      <rect width="1120" height="340" rx="10" fill="rgba(30,41,59,0.5)" stroke="#10b981" stroke-width="1.8" />
      <text x="30" y="25" fill="#10b981" font-size="12" font-weight="700">شیت DC-02: مدیریت باتری، OCPD و مدار کنتاکتوری پیش‌شارژ (Pre-charge)</text>

      <!-- Battery Pack -->
      <g class="sld-component-node" data-component="battery_bank" transform="translate(40, 60)" style="cursor:pointer">
        <rect width="150" height="180" rx="8" fill="url(#dcBatGrad)" stroke="#10b981" stroke-width="2" />
        <text x="75" y="24" fill="#10b981" font-size="11" font-weight="700" text-anchor="middle">پک باتری LiFePO4</text>
        <text x="75" y="46" fill="#e2e8f0" font-size="9.5" text-anchor="middle">16S 51.2V 100Ah</text>
        <text x="75" y="66" fill="#94a3b8" font-size="8.5" text-anchor="middle">ظرفیت اسمی: 5.12 kWh</text>
        <text x="75" y="86" fill="#94a3b8" font-size="8.5" text-anchor="middle">پنجره ولتاژ: 44.8 تا 57.6V</text>
        <text x="75" y="106" fill="#94a3b8" font-size="8.5" text-anchor="middle">جریان دشارژ مداوم: 80 A</text>
        <text x="75" y="126" fill="#94a3b8" font-size="8.5" text-anchor="middle">جریان پیک (10s): 100 A</text>
        <rect x="15" y="142" width="120" height="26" rx="4" fill="#0f172a" stroke="#38bdf8" stroke-width="1" />
        <text x="75" y="159" fill="#38bdf8" font-size="8" font-weight="700" text-anchor="middle">پروتکل ارتباطی CAN / RS485</text>
      </g>

      <!-- Battery OCPD Fuse/Breaker QB -->
      <line x1="190" y1="100" x2="260" y2="100" stroke="#10b981" stroke-width="4" />
      <g class="sld-component-node" data-component="battery_qb" transform="translate(285, 100)" style="cursor:pointer">
        <rect x="-20" y="-25" width="40" height="50" rx="4" fill="#1e293b" stroke="#10b981" stroke-width="2" />
        <path d="M-8,14 L8,-14" stroke="#10b981" stroke-width="2.5" />
        <text x="0" y="-32" fill="#10b981" font-size="9" font-weight="700" text-anchor="middle">QB: حفاظت OCPD</text>
        <text x="0" y="38" fill="#94a3b8" font-size="7.5" text-anchor="middle">125A DC 25kA</text>
      </g>

      <!-- Precharge Subsystem Enclosure -->
      <g transform="translate(350, 45)">
        <rect width="400" height="170" rx="8" fill="rgba(15,23,42,0.9)" stroke="#fbbf24" stroke-width="1.5" stroke-dasharray="4 2" />
        <text x="200" y="20" fill="#fbbf24" font-size="10" font-weight="700" text-anchor="middle">مدار هوشمند پیش‌شارژ خازن باس DC (Pre-charge Subsystem)</text>

        <!-- Node A -->
        <circle cx="40" cy="75" r="5" fill="#fbbf24" />
        <text x="40" y="60" fill="#fbbf24" font-size="8" text-anchor="middle">NODE-A</text>

        <!-- Main Path: KBAT Contactor -->
        <line x1="40" y1="75" x2="130" y2="75" stroke="#10b981" stroke-width="4" />
        <g class="sld-component-node" data-component="kbat_contactor" transform="translate(170, 75)" style="cursor:pointer">
          <rect x="-30" y="-20" width="60" height="40" rx="4" fill="#1e293b" stroke="#10b981" stroke-width="2" />
          <text x="0" y="-5" fill="#10b981" font-size="9" font-weight="700" text-anchor="middle">KBAT</text>
          <text x="0" y="12" fill="#94a3b8" font-size="7.5" text-anchor="middle">کنتاکتور اصلی DC</text>
          <text x="0" y="30" fill="#cbd5e1" font-size="6.5" text-anchor="middle">200A NO (DC-12)</text>
        </g>
        <line x1="200" y1="75" x2="350" y2="75" stroke="#10b981" stroke-width="4" />

        <!-- Node B -->
        <circle cx="350" cy="75" r="5" fill="#fbbf24" />
        <text x="350" y="60" fill="#fbbf24" font-size="8" text-anchor="middle">NODE-B</text>

        <!-- Precharge Path: KPRE + RPRE -->
        <line x1="40" y1="75" x2="40" y2="135" stroke="#fbbf24" stroke-width="2" />
        <line x1="40" y1="135" x2="100" y2="135" stroke="#fbbf24" stroke-width="2" />
        
        <g class="sld-component-node" data-component="kpre_contactor" transform="translate(135, 135)" style="cursor:pointer">
          <rect x="-25" y="-15" width="50" height="30" rx="4" fill="#1e293b" stroke="#fbbf24" stroke-width="1.5" />
          <text x="0" y="-2" fill="#fbbf24" font-size="8" font-weight="700" text-anchor="middle">KPRE</text>
          <text x="0" y="10" fill="#94a3b8" font-size="6.5" text-anchor="middle">رله پیش‌شارژ</text>
        </g>
        <line x1="160" y1="135" x2="210" y2="135" stroke="#fbbf24" stroke-width="2" />

        <g class="sld-component-node" data-component="rpre_resistor" transform="translate(250, 135)" style="cursor:pointer">
          <rect x="-30" y="-14" width="60" height="28" rx="2" fill="#0f172a" stroke="#f97316" stroke-width="1.5" />
          <path d="M-20,0 L-14,-6 L-6,6 L2,-6 L10,6 L16,-6 L20,0" stroke="#f97316" stroke-width="1.8" fill="none" />
          <text x="0" y="-18" fill="#f97316" font-size="8" font-weight="700" text-anchor="middle">RPRE (مقاومت)</text>
          <text x="0" y="24" fill="#94a3b8" font-size="6.5" text-anchor="middle">30 Ω / 50W سرامیکی</text>
        </g>
        <line x1="280" y1="135" x2="350" y2="135" stroke="#fbbf24" stroke-width="2" />
        <line x1="350" y1="135" x2="350" y2="75" stroke="#fbbf24" stroke-width="2" />
      </g>

      <!-- Battery Negative Rail with Current Shunt -->
      <line x1="190" y1="210" x2="480" y2="210" stroke="#065f46" stroke-width="4" />
      <g class="sld-component-node" data-component="battery_shunt" transform="translate(520, 210)" style="cursor:pointer">
        <rect x="-25" y="-14" width="50" height="28" rx="4" fill="#0f172a" stroke="#38bdf8" stroke-width="1.8" />
        <text x="0" y="2" fill="#38bdf8" font-size="9" font-weight="700" text-anchor="middle">SHUNT</text>
        <text x="0" y="24" fill="#94a3b8" font-size="7" text-anchor="middle">500A/50mV کالیبره</text>
      </g>
      <line x1="545" y1="210" x2="800" y2="210" stroke="#065f46" stroke-width="4" />

      <!-- Battery Port on Inverter -->
      <line x1="750" y1="120" x2="800" y2="120" stroke="#10b981" stroke-width="4" />
      <g class="sld-component-node" data-component="hybrid_inverter" transform="translate(800, 80)" style="cursor:pointer">
        <rect width="280" height="160" rx="8" fill="#0f172a" stroke="#10b981" stroke-width="2" />
        <text x="140" y="28" fill="#34d399" font-size="11.5" font-weight="700" text-anchor="middle">پورت باتری اینورتر هایبرید (BAT Port)</text>
        <text x="140" y="52" fill="#cbd5e1" font-size="9" text-anchor="middle">خازن ورودی باس DC (DC-Link Capacitor: ~4700µF)</text>
        <text x="140" y="74" fill="#f59e0b" font-size="8.5" text-anchor="middle">جریان هجومی بدون پیش‌شارژ: بیش از ۱۰۰۰ آمپر!</text>
        <text x="140" y="94" fill="#94a3b8" font-size="8" text-anchor="middle">کنترل پیش‌شارژ: افزایش کنترل‌شده ولتاژ تا ΔV &lt; 2V</text>
        <rect x="25" y="112" width="230" height="34" rx="4" fill="rgba(16,185,129,0.15)" stroke="#10b981" stroke-width="1" />
        <text x="140" y="132" fill="#10b981" font-size="8.5" font-weight="700" text-anchor="middle">توالی مجاز شارژ و وصل ایمن بدون خال‌زدن پلاتین‌ها</text>
      </g>

      <!-- Precharge 5-Step Logic Table -->
      <g transform="translate(40, 260)">
        <rect width="1040" height="60" rx="6" fill="#0f172a" stroke="rgba(255,255,255,0.1)" />
        <text x="20" y="24" fill="#fbbf24" font-size="9" font-weight="700">توالی منطقی ۵ مرحله‌ای پیش‌شارژ:</text>
        <text x="20" y="44" fill="#cbd5e1" font-size="8">۱. تایید سلامت BMS و باز بودن KBAT  ←  ۲. وصل KPRE و شارژ خازن از طریق RPRE  ←  ۳. پایش افزایش ولتاژ تا ΔV &lt; 2V  ←  ۴. بستن کنتاکتور اصلی KBAT  ←  ۵. باز شدن KPRE و اتمام توالی</text>
      </g>
    </g>

  </g>
</svg>
`
    },
    'E-01': {
      title: 'زمین، نول و مرجع جزیره (E-01)',
      svg: `
<svg id="sld-svg-canvas" viewBox="0 0 1280 780" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="eGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e293b" />
      <stop offset="100%" stop-color="#0f172a" />
    </linearGradient>
  </defs>

  <!-- Blueprint Grid -->
  <g stroke="rgba(255,255,255,0.03)" stroke-width="1">
    <line x1="0" y1="0" x2="0" y2="780" /><line x1="50" y1="0" x2="50" y2="780" /><line x1="100" y1="0" x2="100" y2="780" /><line x1="150" y1="0" x2="150" y2="780" /><line x1="200" y1="0" x2="200" y2="780" /><line x1="250" y1="0" x2="250" y2="780" /><line x1="300" y1="0" x2="300" y2="780" /><line x1="350" y1="0" x2="350" y2="780" /><line x1="400" y1="0" x2="400" y2="780" /><line x1="450" y1="0" x2="450" y2="780" /><line x1="500" y1="0" x2="500" y2="780" /><line x1="550" y1="0" x2="550" y2="780" /><line x1="600" y1="0" x2="600" y2="780" /><line x1="650" y1="0" x2="650" y2="780" /><line x1="700" y1="0" x2="700" y2="780" /><line x1="750" y1="0" x2="750" y2="780" /><line x1="800" y1="0" x2="800" y2="780" /><line x1="850" y1="0" x2="850" y2="780" /><line x1="900" y1="0" x2="900" y2="780" /><line x1="950" y1="0" x2="950" y2="780" /><line x1="1000" y1="0" x2="1000" y2="780" /><line x1="1050" y1="0" x2="1050" y2="780" /><line x1="1100" y1="0" x2="1100" y2="780" /><line x1="1150" y1="0" x2="1150" y2="780" /><line x1="1200" y1="0" x2="1200" y2="780" /><line x1="1250" y1="0" x2="1250" y2="780" />
    <line x1="0" y1="0" x2="1280" y2="0" /><line x1="0" y1="50" x2="1280" y2="50" /><line x1="0" y1="100" x2="1280" y2="100" /><line x1="0" y1="150" x2="1280" y2="150" /><line x1="0" y1="200" x2="1280" y2="200" /><line x1="0" y1="250" x2="1280" y2="250" /><line x1="0" y1="300" x2="1280" y2="300" /><line x1="0" y1="350" x2="1280" y2="350" /><line x1="0" y1="400" x2="1280" y2="400" /><line x1="0" y1="450" x2="1280" y2="450" /><line x1="0" y1="500" x2="1280" y2="500" /><line x1="0" y1="550" x2="1280" y2="550" /><line x1="0" y1="600" x2="1280" y2="600" /><line x1="0" y1="650" x2="1280" y2="650" /><line x1="0" y1="700" x2="1280" y2="700" /><line x1="0" y1="750" x2="1280" y2="750" />
  </g>

  <!-- Header -->
  <text x="640" y="28" fill="#4ade80" font-size="14" font-family="'Vazirmatn', sans-serif" font-weight="700" text-anchor="middle">
    نقشه توپولوژی نول، زمین و مرجع N-PE در جزیره (E-01) — استاندارد IEC 60364-7-712 و AS/NZS 4777.2
  </text>
  <text x="640" y="46" fill="#94a3b8" font-size="10" font-family="'Vazirmatn', sans-serif" text-anchor="middle">
    جداسازی شبکه توسط رله KSEP، پیوند پویا N-PE جزیره توسط KNE و مسیر برگشت خطای قطع خودکار تغذیه (ADS)
  </text>

  <!-- Pan-Zoom Group -->
  <g id="sld-pan-zoom-group" transform="translate(0, 0) scale(1)">

    <!-- Grid Transformer & Upstream MEN -->
    <g class="sld-component-node" data-component="utility_grid" transform="translate(80, 80)" style="cursor:pointer">
      <rect width="220" height="130" rx="8" fill="#1e293b" stroke="#0ea5e9" stroke-width="2" />
      <text x="110" y="24" fill="#38bdf8" font-size="11" font-weight="700" text-anchor="middle">ترانسفورماتور پست توزیع شبکه</text>
      <text x="110" y="44" fill="#e2e8f0" font-size="9" text-anchor="middle">منبع تغذیه بالادست شبکه سراسری</text>
      <rect x="20" y="60" width="180" height="35" rx="4" fill="#0f172a" stroke="#22c55e" stroke-width="1.2" />
      <text x="110" y="78" fill="#4ade80" font-size="8.5" font-weight="700" text-anchor="middle">نقطه پیوند اصلی MEN بالادست</text>
      <text x="110" y="90" fill="#94a3b8" font-size="7" text-anchor="middle">(مرجع مشترک نول و زمین در حالت متصل)</text>
      <text x="110" y="115" fill="#cbd5e1" font-size="8" text-anchor="middle">انشعاب ورودی: L_grid و N_grid</text>
    </g>

    <!-- Grid Lines -->
    <line x1="300" y1="120" x2="440" y2="120" stroke="#ef4444" stroke-width="3.5" />
    <text x="370" y="110" fill="#ef4444" font-size="8.5" font-weight="700" text-anchor="middle">L_grid (فاز شبکه)</text>

    <line x1="300" y1="160" x2="440" y2="160" stroke="#06b6d4" stroke-width="3" stroke-dasharray="6 3" />
    <text x="370" y="150" fill="#06b6d4" font-size="8.5" font-weight="700" text-anchor="middle">N_grid (نول شبکه)</text>

    <!-- KSEP Relay (Grid Separation Relay) -->
    <g class="sld-component-node" data-component="ksep_relay" transform="translate(440, 90)" style="cursor:pointer">
      <rect width="180" height="110" rx="8" fill="#1e293b" stroke="#f59e0b" stroke-width="2" />
      <text x="90" y="24" fill="#fbbf24" font-size="11" font-weight="700" text-anchor="middle">رله جداسازی KSEP (2P)</text>
      <text x="90" y="42" fill="#94a3b8" font-size="8" text-anchor="middle">Grid Separation / Anti-Islanding</text>
      <!-- Pole L Contact -->
      <circle cx="40" cy="65" r="4" fill="#ef4444" />
      <circle cx="140" cy="65" r="4" fill="#ef4444" />
      <line x1="40" y1="65" x2="120" y2="50" stroke="#22c55e" stroke-width="3" stroke-linecap="round" />
      <text x="90" y="60" fill="#cbd5e1" font-size="7.5" text-anchor="middle">کنتاکت پل فاز KSEP-L</text>
      <!-- Pole N Contact -->
      <circle cx="40" cy="95" r="4" fill="#06b6d4" />
      <circle cx="140" cy="95" r="4" fill="#06b6d4" />
      <line x1="40" y1="95" x2="120" y2="80" stroke="#22c55e" stroke-width="3" stroke-linecap="round" />
      <text x="90" y="90" fill="#cbd5e1" font-size="7.5" text-anchor="middle">کنتاکت پل نول KSEP-N</text>
    </g>

    <!-- Inverter Enclosure (Island Mode Source) -->
    <line x1="620" y1="120" x2="720" y2="120" stroke="#ef4444" stroke-width="3.5" />
    <line x1="620" y1="160" x2="720" y2="160" stroke="#06b6d4" stroke-width="3" stroke-dasharray="6 3" />

    <g class="sld-component-node" data-component="hybrid_inverter" transform="translate(720, 60)" style="cursor:pointer">
      <rect width="250" height="230" rx="10" fill="url(#eGrad)" stroke="#a855f7" stroke-width="2" />
      <text x="125" y="26" fill="#c084fc" font-size="11.5" font-weight="700" text-anchor="middle">اینورتر هیبرید — حالت عملکرد جزیره‌ای</text>
      <text x="125" y="46" fill="#94a3b8" font-size="8.5" text-anchor="middle">خروجی ایزوله مستقل از شبکه در قطعی</text>

      <!-- Internal EPS Output Bus -->
      <rect x="25" y="65" width="200" height="140" rx="6" fill="#0f172a" stroke="rgba(255,255,255,0.1)" />
      <text x="125" y="85" fill="#f0abfc" font-size="9" font-weight="700" text-anchor="middle">ترمینال خروجی EPS</text>
      <circle cx="50" cy="115" r="5" fill="#f43f5e" />
      <text x="95" y="119" fill="#f43f5e" font-size="8.5" font-weight="700">EPS-L (فاز اضطراری)</text>
      <circle cx="50" cy="165" r="5" fill="#06b6d4" />
      <text x="95" y="169" fill="#06b6d4" font-size="8.5" font-weight="700">EPS-N (نول اضطراری)</text>
    </g>

    <!-- Dynamic KNE Bonding Relay -->
    <g class="sld-component-node" data-component="kne_relay" transform="translate(770, 340)" style="cursor:pointer">
      <rect width="150" height="100" rx="8" fill="#1e293b" stroke="#f59e0b" stroke-width="2" />
      <text x="75" y="24" fill="#fbbf24" font-size="10.5" font-weight="700" text-anchor="middle">رله پیوند نول-زمین (KNE)</text>
      <text x="75" y="42" fill="#94a3b8" font-size="7.5" text-anchor="middle">Dynamic Neutral-Earth Bond Relay</text>
      <!-- Contact Symbol -->
      <circle cx="35" cy="70" r="4" fill="#06b6d4" />
      <circle cx="115" cy="70" r="4" fill="#22c55e" />
      <line x1="35" y1="70" x2="105" y2="70" stroke="#22c55e" stroke-width="3.5" stroke-linecap="round" />
      <text x="75" y="62" fill="#4ade80" font-size="8" font-weight="700" text-anchor="middle">بسته در جزیره (CLOSED)</text>
      <text x="75" y="88" fill="#94a3b8" font-size="7" text-anchor="middle">ایجاد مرجع محلی TN-S در جزیره</text>
    </g>

    <!-- Wiring to KNE -->
    <line x1="770" y1="225" x2="770" y2="340" stroke="#06b6d4" stroke-width="3" stroke-dasharray="4 2" />
    <line x1="845" y1="440" x2="845" y2="520" stroke="#22c55e" stroke-width="3.5" />

    <!-- MET Bar -->
    <g class="sld-component-node" data-component="met_bar" transform="translate(100, 520)" style="cursor:pointer">
      <rect width="850" height="28" rx="6" fill="#1e293b" stroke="#22c55e" stroke-width="2" />
      <text x="425" y="18" fill="#4ade80" font-size="11" font-weight="700" text-anchor="middle">شینه اصلی اتصال زمین (MET: Main Earthing Terminal) — هادی PE پیوسته بدون هرگونه کلیدزنی</text>
    </g>

    <!-- Earth Electrode -->
    <g transform="translate(80, 548)">
      <line x1="50" y1="0" x2="50" y2="40" stroke="#22c55e" stroke-width="3" />
      <line x1="20" y1="40" x2="80" y2="40" stroke="#22c55e" stroke-width="3" />
      <line x1="30" y1="48" x2="70" y2="48" stroke="#22c55e" stroke-width="2.5" />
      <line x1="40" y1="56" x2="60" y2="56" stroke="#22c55e" stroke-width="2" />
      <text x="50" y="75" fill="#4ade80" font-size="8.5" font-weight="700" text-anchor="middle">الکترود زمین ساختمان</text>
      <text x="50" y="90" fill="#94a3b8" font-size="7.5" text-anchor="middle">مقاومت الکترود RE</text>
    </g>

    <!-- Protected Essential Load Appliance & Fault Scenario -->
    <g transform="translate(1020, 100)">
      <rect width="180" height="260" rx="8" fill="rgba(15,23,42,0.9)" stroke="#ef4444" stroke-width="2" />
      <text x="90" y="24" fill="#f87171" font-size="10.5" font-weight="700" text-anchor="middle">مصرف‌کننده ضروری در حالت جزیره</text>
      
      <!-- RCBO Protection -->
      <rect x="20" y="40" width="140" height="50" rx="4" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5" />
      <text x="90" y="60" fill="#38bdf8" font-size="9" font-weight="700" text-anchor="middle">کلید RCBO 30mA Type A</text>
      <text x="90" y="76" fill="#94a3b8" font-size="7.5" text-anchor="middle">حفاظت قطع خودکار تغذیه ADS</text>

      <!-- Metallic Appliance with Fault -->
      <rect x="25" y="110" width="130" height="90" rx="6" fill="#334155" stroke="#ef4444" stroke-width="2" stroke-dasharray="4 2" />
      <text x="90" y="135" fill="#fbbf24" font-size="9.5" font-weight="700" text-anchor="middle">بدنه فلزی مصرف‌کننده</text>
      <text x="90" y="155" fill="#ef4444" font-size="8.5" font-weight="700" text-anchor="middle">⚡ خطای فاز به بدنه!</text>
      <text x="90" y="175" fill="#cbd5e1" font-size="7.5" text-anchor="middle">خرابی عایقی فاز به شاسی فلزی</text>

      <!-- PE connection from chassis to MET -->
      <line x1="90" y1="200" x2="90" y2="420" stroke="#22c55e" stroke-width="3" />
      <line x1="90" y1="420" x2="90" y2="520" stroke="#22c55e" stroke-width="3" />
      <circle cx="90" cy="520" r="4" fill="#22c55e" />
    </g>

    <!-- Animated Red ADS Fault Loop Line -->
    <path d="M770,175 L1040,175 L1040,250 L1110,250 L1110,520 L845,520 L845,440 L845,340 L770,225" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-dasharray="8 4" opacity="0.9" />
    <text x="960" y="505" fill="#ef4444" font-size="9" font-weight="700">مسیر بسته جریان خطای ADS در جزیره عبر KNE و شینه MET</text>

    <!-- Explanation Box at Bottom -->
    <g transform="translate(100, 600)">
      <rect width="1080" height="120" rx="8" fill="#0f172a" stroke="rgba(255,255,255,0.15)" />
      <text x="30" y="28" fill="#fbbf24" font-size="11" font-weight="700">اصول قطعی و خلل‌ناپذیر نول و زمین در استاندارد HYB-FA-001 Rev B:</text>
      <text x="30" y="52" fill="#cbd5e1" font-size="9">۱. هادی حفاظتی زمین (PE) همواره پیوسته بوده و هرگز و تحت هیچ شرایطی نباید کلیدزنی، فیوزگذاری یا قطع شود.</text>
      <text x="30" y="74" fill="#cbd5e1" font-size="9">۲. در زمان اتصال به شبکه: رله KSEP بسته و KNE باز است؛ مرجع نول منحصراً در تابلوی اصلی شبکه (Upstream MEN) برقرار است.</text>
      <text x="30" y="96" fill="#cbd5e1" font-size="9">۳. در زمان عملکرد جزیره‌ای (قطعی شبکه): رله KSEP در کمتر از ۲۰ms باز شده و سپس KNE بسته می‌شود تا سیستم محلی TN-S ایجاد شده و کلید محافظ جان (RCD) بتواند در کمتر از ۴۰ms مدار را تریپ دهد.</text>
    </g>

  </g>
</svg>
`
    },
    'C-01': {
      title: 'مدار فرمان لدر و ماشین حالت (C-01)',
      svg: `
<svg id="sld-svg-canvas" viewBox="0 0 1280 780" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="ladderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e293b" />
      <stop offset="100%" stop-color="#0f172a" />
    </linearGradient>
  </defs>

  <!-- Blueprint Grid -->
  <g stroke="rgba(255,255,255,0.03)" stroke-width="1">
    <line x1="0" y1="0" x2="0" y2="780" /><line x1="50" y1="0" x2="50" y2="780" /><line x1="100" y1="0" x2="100" y2="780" /><line x1="150" y1="0" x2="150" y2="780" /><line x1="200" y1="0" x2="200" y2="780" /><line x1="250" y1="0" x2="250" y2="780" /><line x1="300" y1="0" x2="300" y2="780" /><line x1="350" y1="0" x2="350" y2="780" /><line x1="400" y1="0" x2="400" y2="780" /><line x1="450" y1="0" x2="450" y2="780" /><line x1="500" y1="0" x2="500" y2="780" /><line x1="550" y1="0" x2="550" y2="780" /><line x1="600" y1="0" x2="600" y2="780" /><line x1="650" y1="0" x2="650" y2="780" /><line x1="700" y1="0" x2="700" y2="780" /><line x1="750" y1="0" x2="750" y2="780" /><line x1="800" y1="0" x2="800" y2="780" /><line x1="850" y1="0" x2="850" y2="780" /><line x1="900" y1="0" x2="900" y2="780" /><line x1="950" y1="0" x2="950" y2="780" /><line x1="1000" y1="0" x2="1000" y2="780" /><line x1="1050" y1="0" x2="1050" y2="780" /><line x1="1100" y1="0" x2="1100" y2="780" /><line x1="1150" y1="0" x2="1150" y2="780" /><line x1="1200" y1="0" x2="1200" y2="780" /><line x1="1250" y1="0" x2="1250" y2="780" />
    <line x1="0" y1="0" x2="1280" y2="0" /><line x1="0" y1="50" x2="1280" y2="50" /><line x1="0" y1="100" x2="1280" y2="100" /><line x1="0" y1="150" x2="1280" y2="150" /><line x1="0" y1="200" x2="1280" y2="200" /><line x1="0" y1="250" x2="1280" y2="250" /><line x1="0" y1="300" x2="1280" y2="300" /><line x1="0" y1="350" x2="1280" y2="350" /><line x1="0" y1="400" x2="1280" y2="400" /><line x1="0" y1="450" x2="1280" y2="450" /><line x1="0" y1="500" x2="1280" y2="500" /><line x1="0" y1="550" x2="1280" y2="550" /><line x1="0" y1="600" x2="1280" y2="600" /><line x1="0" y1="650" x2="1280" y2="650" /><line x1="0" y1="700" x2="1280" y2="700" /><line x1="0" y1="750" x2="1280" y2="750" />
  </g>

  <!-- Header -->
  <text x="640" y="28" fill="#38bdf8" font-size="14" font-family="'Vazirmatn', sans-serif" font-weight="700" text-anchor="middle">
    مدار فرمان لدر انتقال و ماشین حالت ۹ وضعیتی بدون بن‌بست (C-01) — تغذیه ۲۴ ولت DC ایزوله
  </text>
  <text x="640" y="46" fill="#94a3b8" font-size="10" font-family="'Vazirmatn', sans-serif" text-anchor="middle">
    اینترلاک‌های سه‌لایه (نرم‌افزاری، الکتریکی متقابل Mirror، مکانیکی) و مدار بوبین‌های KG و KE با حفاظت گذرا
  </text>

  <!-- Pan-Zoom Group -->
  <g id="sld-pan-zoom-group" transform="translate(0, 0) scale(1)">

    <!-- ================================================================= -->
    <!-- LEFT SIDE: LADDER DIAGRAM (24VDC)                                 -->
    <!-- ================================================================= -->
    <g transform="translate(60, 70)">
      <rect width="640" height="640" rx="10" fill="rgba(30,41,59,0.6)" stroke="#38bdf8" stroke-width="1.8" />
      <text x="320" y="28" fill="#38bdf8" font-size="12" font-weight="700" text-anchor="middle">مدار لدر فرمان بوبین‌های انتقال (24VDC Control Ladder)</text>

      <!-- 24V+ Power Rail (Top) -->
      <line x1="40" y1="70" x2="600" y2="70" stroke="#ef4444" stroke-width="4" />
      <text x="35" y="60" fill="#ef4444" font-size="11" font-weight="700">+24V DC</text>

      <!-- 0V Power Rail (Bottom) -->
      <line x1="40" y1="580" x2="600" y2="580" stroke="#3b82f6" stroke-width="4" />
      <text x="35" y="600" fill="#3b82f6" font-size="11" font-weight="700">0V DC</text>

      <!-- Safety Branch: FU-C Fuse & KSAFE Relay -->
      <g transform="translate(80, 70)">
        <line x1="0" y1="0" x2="0" y2="35" stroke="#ef4444" stroke-width="2.5" />
        <rect x="-10" y="35" width="20" height="30" fill="#1e293b" stroke="#f59e0b" stroke-width="1.5" />
        <text x="0" y="54" fill="#fbbf24" font-size="7.5" font-weight="700" text-anchor="middle">FU-C</text>
        <line x1="0" y1="65" x2="0" y2="100" stroke="#ef4444" stroke-width="2.5" />
        
        <!-- KSAFE NO Contact -->
        <g class="sld-component-node" data-component="ksafe_relay" transform="translate(0, 115)" style="cursor:pointer">
          <line x1="-12" y1="0" x2="-4" y2="0" stroke="#ef4444" stroke-width="2" />
          <line x1="4" y1="0" x2="12" y2="0" stroke="#ef4444" stroke-width="2" />
          <line x1="-4" y1="6" x2="-4" y2="-6" stroke="#ef4444" stroke-width="2" />
          <line x1="4" y1="6" x2="4" y2="-6" stroke="#ef4444" stroke-width="2" />
          <text x="25" y="4" fill="#4ade80" font-size="8" font-weight="700">KSAFE (NO)</text>
          <text x="25" y="16" fill="#94a3b8" font-size="6.5">حلقه ایمنی و EPO</text>
        </g>
        <line x1="0" y1="130" x2="0" y2="170" stroke="#ef4444" stroke-width="2.5" />
      </g>

      <!-- RUNG 1: KG Contactor Coil Circuit (Grid) -->
      <g transform="translate(200, 190)">
        <line x1="-120" y1="50" x2="0" y2="50" stroke="#ef4444" stroke-width="2.5" />
        
        <!-- REQ-G Contact -->
        <g transform="translate(30, 50)">
          <line x1="-10" y1="0" x2="10" y2="-12" stroke="#38bdf8" stroke-width="2.5" />
          <circle cx="-10" cy="0" r="3" fill="#fff" />
          <circle cx="10" cy="0" r="3" fill="#fff" />
          <text x="0" y="-18" fill="#38bdf8" font-size="8" font-weight="700" text-anchor="middle">REQ-G (FSM)</text>
        </g>
        <line x1="40" y1="50" x2="80" y2="50" stroke="#ef4444" stroke-width="2.5" />

        <!-- GVR Contact -->
        <g transform="translate(105, 50)">
          <rect x="-15" y="-10" width="30" height="20" rx="3" fill="#0f172a" stroke="#38bdf8" stroke-width="1.2" />
          <text x="0" y="3" fill="#38bdf8" font-size="7" font-weight="700" text-anchor="middle">GVR</text>
          <text x="0" y="-14" fill="#94a3b8" font-size="6.5" text-anchor="middle">شبکه سالم</text>
        </g>
        <line x1="120" y1="50" x2="150" y2="50" stroke="#ef4444" stroke-width="2.5" />

        <!-- Timer TD-DONE Contact -->
        <g class="sld-component-node" data-component="timer_td" transform="translate(175, 50)" style="cursor:pointer">
          <circle cx="0" cy="0" r="10" fill="#0f172a" stroke="#f59e0b" stroke-width="1.2" />
          <text x="0" y="3" fill="#fbbf24" font-size="6" font-weight="700" text-anchor="middle">TD</text>
          <text x="0" y="-14" fill="#fbbf24" font-size="6.5" text-anchor="middle">اتمام زمان مرده</text>
        </g>
        <line x1="185" y1="50" x2="215" y2="50" stroke="#ef4444" stroke-width="2.5" />

        <!-- Mirror Contact KE-M (NC) -->
        <g transform="translate(245, 50)">
          <line x1="-10" y1="-8" x2="10" y2="8" stroke="#a855f7" stroke-width="2" />
          <line x1="-6" y1="-10" x2="-6" y2="10" stroke="#a855f7" stroke-width="1.8" />
          <line x1="6" y1="-10" x2="6" y2="10" stroke="#a855f7" stroke-width="1.8" />
          <text x="0" y="-14" fill="#c084fc" font-size="7" font-weight="700" text-anchor="middle">KE-M (NC)</text>
          <text x="0" y="22" fill="#94a3b8" font-size="6" text-anchor="middle">Mirror اینترلاک</text>
        </g>
        <line x1="255" y1="50" x2="310" y2="50" stroke="#ef4444" stroke-width="2.5" />

        <!-- KG Coil (A1 / A2) -->
        <g class="sld-component-node" data-component="kg_contactor" transform="translate(340, 50)" style="cursor:pointer">
          <circle cx="0" cy="0" r="18" fill="#1e293b" stroke="#38bdf8" stroke-width="2" />
          <text x="0" y="-2" fill="#38bdf8" font-size="10" font-weight="700" text-anchor="middle">KG</text>
          <text x="0" y="10" fill="#94a3b8" font-size="6.5" text-anchor="middle">A1 - A2</text>
          <!-- Surge TVS Diode in parallel -->
          <path d="M-10,25 L10,25 M0,20 L0,30" stroke="#ef4444" stroke-width="1" />
        </g>
        <line x1="358" y1="50" x2="400" y2="50" stroke="#3b82f6" stroke-width="2.5" />
        <line x1="400" y1="50" x2="400" y2="390" stroke="#3b82f6" stroke-width="2.5" />
      </g>

      <!-- RUNG 2: KE Contactor Coil Circuit (EPS Backup) -->
      <g transform="translate(200, 360)">
        <line x1="-120" y1="50" x2="0" y2="50" stroke="#ef4444" stroke-width="2.5" />

        <!-- REQ-E Contact -->
        <g transform="translate(30, 50)">
          <line x1="-10" y1="0" x2="10" y2="-12" stroke="#a855f7" stroke-width="2.5" />
          <circle cx="-10" cy="0" r="3" fill="#fff" />
          <circle cx="10" cy="0" r="3" fill="#fff" />
          <text x="0" y="-18" fill="#c084fc" font-size="8" font-weight="700" text-anchor="middle">REQ-E (FSM)</text>
        </g>
        <line x1="40" y1="50" x2="80" y2="50" stroke="#ef4444" stroke-width="2.5" />

        <!-- EVR Contact -->
        <g transform="translate(105, 50)">
          <rect x="-15" y="-10" width="30" height="20" rx="3" fill="#0f172a" stroke="#a855f7" stroke-width="1.2" />
          <text x="0" y="3" fill="#c084fc" font-size="7" font-weight="700" text-anchor="middle">EVR</text>
          <text x="0" y="-14" fill="#94a3b8" font-size="6.5" text-anchor="middle">EPS آماده</text>
        </g>
        <line x1="120" y1="50" x2="150" y2="50" stroke="#ef4444" stroke-width="2.5" />

        <!-- Timer TD-DONE Contact -->
        <g class="sld-component-node" data-component="timer_td" transform="translate(175, 50)" style="cursor:pointer">
          <circle cx="0" cy="0" r="10" fill="#0f172a" stroke="#f59e0b" stroke-width="1.2" />
          <text x="0" y="3" fill="#fbbf24" font-size="6" font-weight="700" text-anchor="middle">TD</text>
          <text x="0" y="-14" fill="#fbbf24" font-size="6.5" text-anchor="middle">اتمام زمان مرده</text>
        </g>
        <line x1="185" y1="50" x2="215" y2="50" stroke="#ef4444" stroke-width="2.5" />

        <!-- Mirror Contact KG-M (NC) -->
        <g transform="translate(245, 50)">
          <line x1="-10" y1="-8" x2="10" y2="8" stroke="#38bdf8" stroke-width="2" />
          <line x1="-6" y1="-10" x2="-6" y2="10" stroke="#38bdf8" stroke-width="1.8" />
          <line x1="6" y1="-10" x2="6" y2="10" stroke="#38bdf8" stroke-width="1.8" />
          <text x="0" y="-14" fill="#38bdf8" font-size="7" font-weight="700" text-anchor="middle">KG-M (NC)</text>
          <text x="0" y="22" fill="#94a3b8" font-size="6" text-anchor="middle">Mirror اینترلاک</text>
        </g>
        <line x1="255" y1="50" x2="310" y2="50" stroke="#ef4444" stroke-width="2.5" />

        <!-- KE Coil (A1 / A2) -->
        <g class="sld-component-node" data-component="ke_contactor" transform="translate(340, 50)" style="cursor:pointer">
          <circle cx="0" cy="0" r="18" fill="#1e293b" stroke="#a855f7" stroke-width="2" />
          <text x="0" y="-2" fill="#c084fc" font-size="10" font-weight="700" text-anchor="middle">KE</text>
          <text x="0" y="10" fill="#94a3b8" font-size="6.5" text-anchor="middle">A1 - A2</text>
          <!-- Surge TVS Diode in parallel -->
          <path d="M-10,25 L10,25 M0,20 L0,30" stroke="#ef4444" stroke-width="1" />
        </g>
        <line x1="358" y1="50" x2="400" y2="50" stroke="#3b82f6" stroke-width="2.5" />
        <line x1="400" y1="50" x2="400" y2="220" stroke="#3b82f6" stroke-width="2.5" />
      </g>

      <!-- Mechanical Interlock Link between Coils -->
      <g class="sld-component-node" data-component="mech_interlock" transform="translate(540, 325)" style="cursor:pointer">
        <line x1="0" y1="-70" x2="0" y2="70" stroke="#f59e0b" stroke-width="3" stroke-dasharray="4 2" />
        <rect x="-35" y="-12" width="70" height="24" rx="4" fill="#f59e0b" />
        <text x="0" y="4" fill="#0f172a" font-size="7.5" font-weight="900" text-anchor="middle">قفل مکانیکی</text>
      </g>
    </g>

    <!-- ================================================================= -->
    <!-- RIGHT SIDE: 9-STATE DEADLOCK-FREE FSM TRANSITION DIAGRAM         -->
    <!-- ================================================================= -->
    <g transform="translate(730, 70)">
      <rect width="490" height="640" rx="10" fill="rgba(30,41,59,0.6)" stroke="#f59e0b" stroke-width="1.8" />
      <text x="245" y="28" fill="#fbbf24" font-size="12" font-weight="700" text-anchor="middle">ماشین حالت متناهی ۹ وضعیتی بدون بن‌بست (9-State FSM)</text>

      <!-- State 0: INIT / STARTUP -->
      <g transform="translate(50, 60)">
        <rect width="110" height="38" rx="6" fill="#1e293b" stroke="#94a3b8" stroke-width="1.5" />
        <text x="55" y="18" fill="#e2e8f0" font-size="8.5" font-weight="700" text-anchor="middle">S0: راه‌اندازی (INIT)</text>
        <text x="55" y="30" fill="#94a3b8" font-size="7" text-anchor="middle">KG=باز | KE=باز</text>
      </g>

      <!-- State 1: GRID_NORMAL -->
      <g transform="translate(200, 60)">
        <rect width="120" height="38" rx="6" fill="#1e293b" stroke="#38bdf8" stroke-width="2" />
        <text x="60" y="18" fill="#38bdf8" font-size="8.5" font-weight="700" text-anchor="middle">S1: وضعیت نرمال شبکه</text>
        <text x="60" y="30" fill="#22c55e" font-size="7" text-anchor="middle">KG=بسته | KE=باز</text>
      </g>

      <!-- State 2: GRID_FAULT_DETECT -->
      <g transform="translate(350, 130)">
        <rect width="110" height="38" rx="6" fill="#1e293b" stroke="#ef4444" stroke-width="1.5" />
        <text x="55" y="18" fill="#ef4444" font-size="8.5" font-weight="700" text-anchor="middle">S2: تشخیص قطعی شبکه</text>
        <text x="55" y="30" fill="#94a3b8" font-size="7" text-anchor="middle">افت V/f تایید شد</text>
      </g>

      <!-- State 3: OPEN_KG_CONFIRM -->
      <g transform="translate(350, 210)">
        <rect width="110" height="38" rx="6" fill="#1e293b" stroke="#f59e0b" stroke-width="1.5" />
        <text x="55" y="18" fill="#fbbf24" font-size="8.5" font-weight="700" text-anchor="middle">S3: تایید باز بودن KG</text>
        <text x="55" y="30" fill="#94a3b8" font-size="7" text-anchor="middle">کنترل فیدبک KG-M</text>
      </g>

      <!-- State 4: DEAD_TIME_DELAY -->
      <g class="sld-component-node" data-component="timer_td" transform="translate(350, 290)" style="cursor:pointer">
        <rect width="110" height="38" rx="6" fill="#0f172a" stroke="#f59e0b" stroke-width="2" />
        <text x="55" y="18" fill="#fbbf24" font-size="8.5" font-weight="700" text-anchor="middle">S4: زمان مرده (TD)</text>
        <text x="55" y="30" fill="#f59e0b" font-size="7" text-anchor="middle">150ms تاخیر میرا شدن</text>
      </g>

      <!-- State 5: EPS_ISLAND_STABLE -->
      <g transform="translate(200, 360)">
        <rect width="120" height="38" rx="6" fill="#1e293b" stroke="#a855f7" stroke-width="2" />
        <text x="60" y="18" fill="#c084fc" font-size="8.5" font-weight="700" text-anchor="middle">S5: حالت پایدار جزیره</text>
        <text x="60" y="30" fill="#22c55e" font-size="7" text-anchor="middle">KG=باز | KE=بسته</text>
      </g>

      <!-- State 6: GRID_RETURN_DETECT -->
      <g transform="translate(50, 290)">
        <rect width="110" height="38" rx="6" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5" />
        <text x="55" y="18" fill="#38bdf8" font-size="8.5" font-weight="700" text-anchor="middle">S6: بازگشت ولتاژ شبکه</text>
        <text x="55" y="30" fill="#94a3b8" font-size="7" text-anchor="middle">بار همچنان روی EPS</text>
      </g>

      <!-- State 7: GRID_QUALIFY_TG -->
      <g class="sld-component-node" data-component="timer_tg" transform="translate(50, 210)" style="cursor:pointer">
        <rect width="110" height="38" rx="6" fill="#0f172a" stroke="#38bdf8" stroke-width="2" />
        <text x="55" y="18" fill="#38bdf8" font-size="8.5" font-weight="700" text-anchor="middle">S7: تایمر تثبیت (TG)</text>
        <text x="55" y="30" fill="#38bdf8" font-size="7" text-anchor="middle">60s شمارش پایداری</text>
      </g>

      <!-- State 8: OPEN_KE_CONFIRM -->
      <g transform="translate(50, 130)">
        <rect width="110" height="38" rx="6" fill="#1e293b" stroke="#a855f7" stroke-width="1.5" />
        <text x="55" y="18" fill="#c084fc" font-size="8.5" font-weight="700" text-anchor="middle">S8: تایید باز بودن KE</text>
        <text x="55" y="30" fill="#94a3b8" font-size="7" text-anchor="middle">کنترل فیدبک KE-M</text>
      </g>

      <!-- State 9: FAULT_LOCKOUT (Central) -->
      <g transform="translate(180, 210)">
        <rect width="130" height="60" rx="8" fill="#450a0a" stroke="#ef4444" stroke-width="2" />
        <text x="65" y="24" fill="#fca5a5" font-size="10" font-weight="900" text-anchor="middle">S9: قفل دائم خطا</text>
        <text x="65" y="40" fill="#ef4444" font-size="7.5" text-anchor="middle">جوش پلاتین / خطای فیدبک / EPO</text>
        <text x="65" y="52" fill="#fff" font-size="7" text-anchor="middle">KG=قطع | KE=قطع (قفل)</text>
      </g>

      <!-- FSM Flow Arrows -->
      <path d="M160,79 L200,79" stroke="#38bdf8" stroke-width="2" marker-end="url(#arrow)" />
      <path d="M320,79 L405,79 L405,130" stroke="#ef4444" stroke-width="2" />
      <path d="M405,168 L405,210" stroke="#fbbf24" stroke-width="2" />
      <path d="M405,248 L405,290" stroke="#fbbf24" stroke-width="2" />
      <path d="M405,328 L405,379 L320,379" stroke="#a855f7" stroke-width="2" />
      <path d="M200,379 L105,379 L105,328" stroke="#38bdf8" stroke-width="2" />
      <path d="M105,290 L105,248" stroke="#38bdf8" stroke-width="2" />
      <path d="M105,210 L105,168" stroke="#38bdf8" stroke-width="2" />
      <path d="M105,130 L105,79 L200,79" stroke="#22c55e" stroke-width="2" />

      <!-- Fault Transitions to S9 -->
      <line x1="350" y1="230" x2="310" y2="230" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="3 3" />
      <line x1="160" y1="150" x2="180" y2="210" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="3 3" />

      <!-- Explanatory note on FSM -->
      <g transform="translate(30, 480)">
        <rect width="430" height="130" rx="6" fill="#0f172a" stroke="rgba(255,255,255,0.1)" />
        <text x="15" y="24" fill="#fbbf24" font-size="9" font-weight="700">ویژگی‌های ماشین حالت انتقال بدون بن‌بست (Deadlock-Free):</text>
        <text x="15" y="46" fill="#cbd5e1" font-size="8">✓ عدم قطع زودهنگام پشتیبان: با بازگشت موقت شبکه، تا سپری شدن کامل TG (۶۰ ثانیه) بار روی EPS حفظ می‌شود.</text>
        <text x="15" y="68" fill="#cbd5e1" font-size="8">✓ مصونیت از فلیپ‌فلاپ و نوسان: ریست خودکار تایمر TG در صورت هرگونه بی‌ثباتی یا فلیکر شبکه قبل از اتمام تایمر.</text>
        <text x="15" y="90" fill="#cbd5e1" font-size="8">✓ قطع اتصال موازی منبعین: کنترل متقابل Mirror contact و اینترلاک مکانیکی مانع اتصال همزمان شبکه و EPS می‌شود.</text>
        <text x="15" y="112" fill="#cbd5e1" font-size="8">✓ وضعیت امن در خرابی: عدم دریافت تایید باز بودن پلاتین در زمان مقرر به قفل خطای S9 و آلارم منتهی می‌شود.</text>
      </g>
    </g>

  </g>
</svg>
`
    }
  };

  /**
   * Initializes the SLD Schematic inside the specified container ID
   */
  function init(containerId) {
    svgContainer = document.getElementById(containerId);
    if (!svgContainer) return;

    renderSvgSchematic(currentTab);
  }

  /**
   * Switches the active schematic tab
   */
  function switchTab(tabId) {
    const key = Object.keys(SCHEMATICS).find(k => k.toLowerCase() === tabId.toLowerCase()) || tabId;
    if (!SCHEMATICS[key]) return;
    currentTab = key;
    renderSvgSchematic(key);
    document.querySelectorAll('.sld-tab-btn').forEach(b => {
      const bTab = b.getAttribute('data-tab');
      if (bTab) {
        b.classList.toggle('active', bTab.toLowerCase() === key.toLowerCase());
      }
    });
    if (window.soundEngine && typeof window.soundEngine.playClick === 'function') {
      window.soundEngine.playClick();
    }
  }

  /**
   * Renders the chosen schematic SVG inside the container
   */
  function renderSvgSchematic(tabId = 'SLD-01') {
    if (!svgContainer || !SCHEMATICS[tabId]) return;

    const data = SCHEMATICS[tabId];
    svgContainer.innerHTML = data.svg;

    setupPanAndZoom();
    bindSymbolEvents();
    applyTransform();

    // Update active state of tab buttons in DOM if present
    document.querySelectorAll('.sld-tab-btn').forEach(btn => {
      const bTab = btn.getAttribute('data-tab');
      if (bTab === tabId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  /**
   * Sets up Pan and Zoom behavior on the SVG canvas
   */
  function setupPanAndZoom() {
    const svg = document.getElementById('sld-svg-canvas');
    const group = document.getElementById('sld-pan-zoom-group');
    if (!svg || !group) return;

    svg.addEventListener('mousedown', (e) => {
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
      currentZoom = Math.max(0.4, Math.min(3.5, currentZoom * zoomFactor));
      applyTransform();
    });
  }

  function applyTransform() {
    const group = document.getElementById('sld-pan-zoom-group');
    if (group) {
      group.setAttribute('transform', `translate(${panX}, ${panY}) scale(${currentZoom})`);
    }
  }

  /**
   * Binds click events to symbols for opening inspector drawer or toggling breakers/switches
   */
  function bindSymbolEvents() {
    if (!svgContainer) return;
    const nodes = svgContainer.querySelectorAll('.sld-component-node');
    nodes.forEach((node) => {
      node.addEventListener('click', (e) => {
        e.stopPropagation();
        const componentId = node.getAttribute('data-component');
        const breakerId = node.getAttribute('data-breaker');

        if (window.soundEngine && typeof window.soundEngine.playClick === 'function') {
          window.soundEngine.playClick();
        }

        if (breakerId === 'sby_switch' || e.target.closest('#sld-sby-switch')) {
          cycleSbySwitch();
        } else if (breakerId && e.target.closest('.sld-breaker-symbol')) {
          toggleBreaker(breakerId);
        }

        if (componentId) {
          if (window.AppOrchestrator && typeof window.AppOrchestrator.openInspectorForComponent === 'function') {
            window.AppOrchestrator.openInspectorForComponent(componentId);
          } else if (window.App && typeof window.App.showComponentInspector === 'function') {
            window.App.showComponentInspector(componentId);
          }
        }
      });
    });
  }

  function cycleSbySwitch() {
    let nextPos = 'I';
    if (breakerStates.sby_switch === 'I') nextPos = '0';
    else if (breakerStates.sby_switch === '0') nextPos = 'II';
    else nextPos = 'I';

    setSbyPosition(nextPos, 'sld');
  }

  function setSbyPosition(pos, origin = 'sld') {
    if (!['I', '0', 'II'].includes(pos)) return;
    breakerStates.sby_switch = pos;

    if (origin !== 'orchestrator') {
      if (window.soundEngine && typeof window.soundEngine.playSbySwitch === 'function') {
        window.soundEngine.playSbySwitch(pos);
      } else if (window.soundEngine && typeof window.soundEngine.playBreakerSnap === 'function') {
        window.soundEngine.playBreakerSnap();
      }
    }

    updateSbyVisual(pos);

    if (origin !== 'orchestrator' && window.AppOrchestrator && typeof window.AppOrchestrator.onSbyStateChanged === 'function') {
      window.AppOrchestrator.onSbyStateChanged(pos, 'sld');
    }
  }

  function updateSbyVisual(pos) {
    const blade = document.getElementById('sby-blade');
    const badge = document.getElementById('sld-sby-badge');
    if (!blade) return;

    if (pos === 'I') {
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

  function toggleBreaker(breakerId) {
    const curState = breakerStates[breakerId] !== false;
    setBreakerState(breakerId, !curState, 'sld');
  }

  function setBreakerState(breakerId, stateBool, origin = 'sld') {
    const targetState = !!stateBool;
    breakerStates[breakerId] = targetState;

    const blades = document.querySelectorAll(`[id*="${breakerId}-blade"], [id*="sld-${breakerId}-blade"], #${breakerId}-blade, #dc-isolator-blade, [id^="dc-isolator-blade"], .${breakerId}-blade`);
    blades.forEach(blade => {
      if (targetState) {
        blade.setAttribute('stroke', '#22c55e');
      } else {
        blade.setAttribute('stroke', '#ef4444');
      }
    });

    if (origin !== 'orchestrator' && window.soundEngine && typeof window.soundEngine.playBreakerSnap === 'function') {
      window.soundEngine.playBreakerSnap();
    }

    if (origin !== 'orchestrator' && window.AppOrchestrator && typeof window.AppOrchestrator.onBreakerStateChanged === 'function') {
      window.AppOrchestrator.onBreakerStateChanged(breakerId, targetState, 'sld');
    }
  }

  function updateTelemetry(telem) {
    if (!telem || currentTab !== 'SLD-01') return;

    const pv1 = document.getElementById('sld-telemetry-pv1');
    const pv2 = document.getElementById('sld-telemetry-pv2');
    const bat = document.getElementById('sld-telemetry-bat');
    const grid = document.getElementById('sld-telemetry-grid');
    const eps = document.getElementById('sld-telemetry-eps');

    if (pv1 && telem.string1) pv1.textContent = `${telem.string1.voltage_V.toFixed(0)}V / ${telem.string1.power_W.toFixed(0)}W`;
    if (pv2 && telem.string2) pv2.textContent = `${telem.string2.voltage_V.toFixed(0)}V / ${telem.string2.power_W.toFixed(0)}W`;
    if (bat) bat.textContent = `${telem.batteryVoltage_V.toFixed(1)}V / ${(telem.batteryPower_W || 0).toFixed(0)}W`;
    if (grid) grid.textContent = `${telem.gridVoltage_V.toFixed(0)}V / ${(telem.gridPortPower_W || 0).toFixed(0)}W`;
    if (eps) eps.textContent = `${telem.epsVoltage_V.toFixed(0)}V / ${(telem.epsPortPower_W || 0).toFixed(0)}W`;
  }

  function setFlowFilter(filterType) {
    const flows = {
      pv1: document.getElementById('flow-pv1-dc'),
      pv2: document.getElementById('flow-pv2-dc'),
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
        if (key === filterType || (filterType === 'pv' && (key === 'pv1' || key === 'pv2'))) {
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
    currentZoom = Math.min(3.5, currentZoom + 0.2);
    applyTransform();
  }

  function zoomOut() {
    currentZoom = Math.max(0.4, currentZoom - 0.2);
    applyTransform();
  }

  function resetZoom() {
    currentZoom = 1.0;
    panX = 0;
    panY = 0;
    applyTransform();
  }

  // Export module to global scope
  const SLDSchematicInstance = {
    SCHEMATICS,
    getSchematics: () => SCHEMATICS,
    init,
    switchTab,
    getCurrentTab: () => currentTab,
    updateTelemetry,
    setFlowFilter,
    toggleBreaker,
    setSbyPosition,
    cycleSbySwitch,
    zoomIn,
    zoomOut,
    resetZoom,
    getBreakerStates: () => ({ ...breakerStates }),
    setBreakerState: (id, state, origin = 'orchestrator') => {
      if (id === 'sby_switch' || id === 'sby3_switch') {
        setSbyPosition(state, origin);
      } else {
        setBreakerState(id, state, origin);
      }
    }
  };
  window.SLDSchematic = SLDSchematicInstance;
  window.sldSchematic = SLDSchematicInstance;
})();
