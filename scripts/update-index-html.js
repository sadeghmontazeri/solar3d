const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../index.html');
let html = fs.readFileSync(targetPath, 'utf8');

// 1. Add Header buttons
if (!html.includes('btn-open-troubleshooting')) {
  const headerTarget = `<button id="btn-open-why-header" class="btn-header-action">
          <span>💡</span> چراهای مهندسی
        </button>`;

  const headerReplacement = `<button id="btn-open-why-header" class="btn-header-action">
          <span>💡</span> چراهای مهندسی
        </button>
        <button id="btn-open-troubleshooting" class="btn-header-action highlight" title="عیب‌یابی جامع خطاها بر اساس بخش ۲۱ سند">
          <span>🛠️</span> عیب‌یابی (بخش ۲۱)
        </button>
        <button id="btn-open-fatsat" class="btn-header-action" title="ماتریس ۲۲ آزمون تحویل کارخانه‌ای و سایتی">
          <span>🔬</span> آزمون‌های FAT/SAT (بخش ۱۹)
        </button>`;

  html = html.replace(headerTarget, headerReplacement);
}

// 2. Add SBY Telemetry Badge in HUD
if (!html.includes('hud-sby-badge')) {
  const hudTarget = `<!-- 6. Normal AC Loads Badge -->
      <div class="telemetry-badge load">
        <div class="badge-top">
          <div class="badge-label">
            <span>💡</span> بارهای عادی ساختمان
          </div>
        </div>
        <div class="badge-main-val">
          <span id="hud-load-p" class="val">2200</span>
          <span class="unit">وات (W)</span>
        </div>
        <div class="badge-sub-metrics">
          <span class="sub-metric" id="hud-load-status">برق‌دار (عادی)</span>
        </div>
      </div>`;

  const hudReplacement = `<!-- 6. Normal AC Loads Badge -->
      <div class="telemetry-badge load">
        <div class="badge-top">
          <div class="badge-label">
            <span>💡</span> بارهای عادی ساختمان
          </div>
        </div>
        <div class="badge-main-val">
          <span id="hud-load-p" class="val">2200</span>
          <span class="unit">وات (W)</span>
        </div>
        <div class="badge-sub-metrics">
          <span class="sub-metric" id="hud-load-status">برق‌دار (عادی)</span>
        </div>
      </div>

      <!-- 7. SBY Changeover Switch Badge -->
      <div class="telemetry-badge sby" id="hud-sby-badge" style="cursor: pointer;" title="کلیک جهت چرخاندن و تغییر منبع کلید بای‌پس SBY">
        <div class="badge-top">
          <div class="badge-label">
            <span>🔀</span> کلید تبدیل SBY
          </div>
          <div id="hud-sby-dot" class="badge-status-dot active"></div>
        </div>
        <div class="badge-main-val">
          <span id="hud-sby-pos" class="val" style="color:var(--eps-magenta)">I (اینورتر)</span>
        </div>
        <div class="badge-sub-metrics">
          <span class="sub-metric" id="hud-sby-desc">خروجی اینورتر EPS</span>
        </div>
      </div>`;

  html = html.replace(hudTarget, hudReplacement);
}

// 3. Add SBY Cockpit Section in Left Panel
if (!html.includes('sby-control-group')) {
  const cockpitTarget = `<!-- Section 3: Environmental & Load Sliders -->`;
  const sbyCockpitBlock = `<!-- Section: SBY 3-Position Changeover Switch Controller -->
        <div class="cockpit-section">
          <div class="section-label">
            <span>کلید تبدیل ۳ حالته دستی SBY (بای‌پاس)</span>
            <span id="sby-status-tag" style="color:var(--eps-magenta); font-weight:bold; font-size:0.75rem;">وضعیت: I (EPS)</span>
          </div>
          <div class="sby-control-group">
            <button id="btn-sby-pos-1" class="sby-pos-btn active" data-pos="I">
              حالت I<br><span style="font-size:0.68rem; font-weight:normal;">اینورتر EPS</span>
            </button>
            <button id="btn-sby-pos-0" class="sby-pos-btn" data-pos="0">
              حالت 0<br><span style="font-size:0.68rem; font-weight:normal;">قطع کامل</span>
            </button>
            <button id="btn-sby-pos-2" class="sby-pos-btn" data-pos="II">
              حالت II<br><span style="font-size:0.68rem; font-weight:normal;">بای‌پاس شبکه</span>
            </button>
          </div>
        </div>

        <!-- Section 3: Environmental & Load Sliders -->`;

  html = html.replace(cockpitTarget, sbyCockpitBlock);
}

// 4. Add Troubleshooting Modal and FAT/SAT Modal before script tags
if (!html.includes('id="modal-troubleshoot"')) {
  const modalsInsertTarget = `<!-- ====================================================================== -->
  <!-- JAVASCRIPT MODULES IN CORRECT DEPENDENCY SEQUENCE`;

  const newModals = `<!-- ==================================================================== -->
  <!-- 7. OPERATIONAL TROUBLESHOOTING MATRIX MODAL (SECTION 21)             -->
  <!-- ==================================================================== -->
  <div id="modal-troubleshoot" class="modal-backdrop">
    <div class="modal-window troubleshoot-modal">
      <div class="modal-header">
        <div class="modal-title-group">
          <div class="modal-title-icon">🛠️</div>
          <div>
            <h3 class="modal-title">ماتریس عیب‌یابی و پاسخ به خرابی‌های سامانه خورشیدی (بخش ۲۱)</h3>
            <span style="font-size:0.75rem; color:var(--text-secondary);">راهنمای عملیاتی رفع ۲۰ خطای واقعی طبق استاندارد HYB-FA-001 Rev A</span>
          </div>
        </div>
        <button class="modal-close" data-close="modal-troubleshoot">×</button>
      </div>

      <div class="troubleshoot-search-bar">
        <span>🔍</span>
        <input type="text" id="troubleshoot-search-input" class="troubleshoot-search-input" placeholder="جستجوی علامت خطا، کلمه کلیدی (مثلاً RCD، باتری، عایقی، CT، پیش‌شارژ، ارستر)...">
      </div>

      <div id="troubleshoot-cards-container" class="troubleshoot-grid">
        <!-- Injected dynamically by app.js -->
      </div>
    </div>
  </div>

  <!-- ==================================================================== -->
  <!-- 8. 22-POINT FAT/SAT COMMISSIONING TESTS MODAL (SECTION 19)           -->
  <!-- ==================================================================== -->
  <div id="modal-fatsat" class="modal-backdrop">
    <div class="modal-window fatsat-modal">
      <div class="modal-header">
        <div class="modal-title-group">
          <div class="modal-title-icon">🔬</div>
          <div>
            <h3 class="modal-title">برنامه آزمون تحویل کارخانه‌ای و سایتی FAT / SAT (بخش ۱۹)</h3>
            <span style="font-size:0.75rem; color:var(--text-secondary);">۲۲ آزمون اعتبارسنجی جامع عملکرد و ایمنی طبق IEC 62446-1 و HYB-FA-001 Rev A</span>
          </div>
        </div>
        <button class="modal-close" data-close="modal-fatsat">×</button>
      </div>

      <div class="fatsat-table-wrapper">
        <table class="fatsat-table">
          <thead>
            <tr>
              <th style="width:45px">#</th>
              <th style="width:200px">عنوان آزمون و مرجع استاندارد</th>
              <th>چه مواردی باید ثبت شود؟</th>
              <th>معیار پذیرش و حدود مجاز</th>
              <th style="width:65px; text-align:center">وضعیت</th>
            </tr>
          </thead>
          <tbody id="fatsat-tbody">
            <!-- Injected dynamically by app.js -->
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- ====================================================================== -->
  <!-- JAVASCRIPT MODULES IN CORRECT DEPENDENCY SEQUENCE`;

  html = html.replace(modalsInsertTarget, newModals);
}

fs.writeFileSync(targetPath, html, 'utf8');
console.log('Successfully updated index.html');
