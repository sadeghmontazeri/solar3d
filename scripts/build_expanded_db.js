const fs = require('fs');
const path = require('path');
const { components } = require('./data-components');
const {
  why_data,
  fat_sat_tests,
  troubleshooting_matrix,
  checklists,
  calculators
} = require('./data-knowledge');
const { HYB_GUIDE_DATA } = require('../js/guide-data.js');

// 1. Fix ratings in base components for verify-all
components.qe_mcb.rating_a = 25;
components.qe_mcb.rating_A = 25;
components.qe_mcb.poles = "2P Curve C";
components.battery_bank.capacity_kwh = 5.12;
components.battery_bank.capacityKWh = 5.12;
components.battery_bank.capacity_ah = 100;
components.battery_bank.capacityAh = 100;

// 2. Merge additional components from 6 schematics
const additional = {
  "bus_g3": {
    "id": "bus_g3",
    "name": "شینه توزیع سه‌فاز شبکه (400V 3P+N Grid Busbar - BUS-G3)",
    "category": "توزیع قدرت سه‌فاز AC",
    "badgeClass": "badge-grid",
    "rating_A": 63,
    "rating_a": 63,
    "function": "توزیع برق سه‌فاز ۴۰۰ ولت بین فیدرهای غیربحرانی، اینورتر سه‌فاز و کلید تبدیل سه‌فاز.",
    "location": "داخل تابلوی اصلی توزیع برق سه‌فاز ساختمان (MDB-3F).",
    "current_flow": "جریان متناوب سه‌فاز ۴۰۰/۲۳۰ ولت ۵۰ هرتز تا ۶۳ آمپر پیوسته در هر فاز.",
    "protects": "متکی به کلید اصلی انشعاب سه‌فاز Q03.",
    "unprotected": "فاقد حفاظت خطای اضافه ولتاژهای صاعقه.",
    "grid_normal": "توزیع توان متعادل بین فازهای L1, L2, L3 و عبور جریان نامتعادل از شینه نول.",
    "grid_outage": "بی‌برق؛ با قطع شبکه کاملاً غیرفعال می‌گردد.",
    "probable_failures": "نامتعادلی شدید بار بین فازها و عبور جریان بیش از حد از شینه نول.",
    "installer_mistakes": "کاهش مقطع شینه نول نسبت به فازها در حضور بارهای غیرخطی شدید.",
    "supervisor_notes": "مقطع شینه نول باید حداقل برابر با شینه فاز باشد و گشتاور بستن شمش‌ها ثبت گردد.",
    "datasheet_check": "شینه مسی الکترولیتی با تحمل ۶۳ آمپر و قدرت تحمل اتصال کوتاه ۱۰ کیلوآمپر."
  },
  "qg3_mcb": {
    "id": "qg3_mcb",
    "name": "کلید درگاه شبکه اینورتر سه‌فاز (3-Phase Inverter Grid MCB - QG3)",
    "category": "حفاظت اینورتر سه‌فاز",
    "badgeClass": "badge-grid",
    "rating_A": 32,
    "rating_a": 32,
    "poles": "4P Curve C",
    "function": "حفاظت فیدر چهارسیمه اتصال درگاه شبکه اینورتر سه‌فاز به شینه BUS-G3.",
    "location": "تابلوی اصلی در ورودی فیدر به اینورتر سه‌فاز.",
    "current_flow": "جریان متناوب سه‌فاز ۲۳۰/۴۰۰ ولت تا ۲۵ آمپر در هر فاز (برای اینورتر ۱۵ کیلووات).",
    "protects": "کابل ارتباطی و پورت شبکه اینورتر را در برابر اتصال کوتاه بالادست حفاظت می‌کند.",
    "unprotected": "حفاظت نشتی دیفرانسیلی باید توسط RCD سازگار سه‌فاز تامین شود.",
    "grid_normal": "وصل کامل؛ تبادل توان سه‌فاز دوطرفه بین اینورتر و شبکه سراسری.",
    "grid_outage": "وصل مکانیکی؛ اما اینورتر به صورت الکترونیکی و با رله KSEP تزریق را متوقف می‌کند.",
    "probable_failures": "تریپ به دلیل عدم تعادل شدید فازها یا نوسان ولتاژ شبکه.",
    "installer_mistakes": "جابه‌جا بستن توالی فازها (Phase Sequence Error) یا استفاده از کلید ۳ پل به جای ۴ پل.",
    "supervisor_notes": "توالی فازها با RST تستر بررسی شود و کلید حتماً ۴ پل (قطع همزمان نول) باشد.",
    "datasheet_check": "استاندارد IEC 60947-2، جریان نامی 32A 4P Curve C، قدرت قطع 10kA."
  },
  "qe3_mcb": {
    "id": "qe3_mcb",
    "name": "کلید خروجی اضطراری سه‌فاز اینورتر (3-Phase EPS Output MCB - QE3)",
    "category": "حفاظت خروجی اضطراری سه‌فاز",
    "badgeClass": "badge-eps",
    "rating_A": 32,
    "rating_a": 32,
    "poles": "4P Curve C",
    "function": "حفاظت فیدر خروجی اضطراری سه‌فاز اینورتر به سمت ورودی شماره ۱ کلید تبدیل سه‌فاز SBY3.",
    "location": "مجاورت پورت EPS اینورتر سه‌فاز.",
    "current_flow": "جریان متناوب سه‌فاز تا ۲۱.۷ آمپر نامی در هر فاز (توان ۱۵ کیلووات).",
    "protects": "ماژول‌های ترانزیستوری قدرت اینورتر و کابل خروجی اضطراری را حفاظت می‌کند.",
    "unprotected": "حفاظت خطای نشتی تک‌تک مدارها بر عهده محافظ جان‌های پاییندست است.",
    "grid_normal": "پیوسته وصل؛ توان بارهای بحرانی سه‌فاز از اینورتر تامین می‌گردد.",
    "grid_outage": "پیوسته وصل؛ انتقال توان جزیره‌ای سه‌فاز هماهنگ از باتری و خورشید به بارها.",
    "probable_failures": "تریپ در لحظه استارت بار موتوری سنگین به دلیل عبور جریان هجومی از منحنی C.",
    "installer_mistakes": "اتصال فازهای اینورترهای تک‌فاز مجزا بدون همزمان‌سازی به ورودی این کلید.",
    "supervisor_notes": "باید از یک منبع سه‌فاز هماهنگ واقعی تغذیه شود و حد بار هر فاز از ۵ کیلووات فراتر نرود.",
    "datasheet_check": "استاندارد IEC 60898-1 / 60947-2، رده C32A 4P، قدرت قطع 10kA."
  },
  "sby3_switch": {
    "id": "sby3_switch",
    "name": "کلید گردان تبدیل دستی ۴ پل سه‌فاز (3-Phase 4P Manual Changeover - SBY3)",
    "category": "تغییر منبع سه‌فاز",
    "badgeClass": "badge-eps",
    "rating_A": 40,
    "rating_a": 40,
    "poles": "4P Break-Before-Make",
    "function": "انتخاب دستی و ایمن منبع تغذیه تابلوی ضروری سه‌فاز بین EPS اینورتر (وضعیت I) و شبکه (وضعیت II).",
    "location": "تابلوی بارهای ضروری سه‌فاز.",
    "current_flow": "جریان سه‌فاز و نول تا ۴۰ آمپر مداوم در هر پل.",
    "protects": "مانع اتصال موازی تصادفی خروجی سه‌فاز اینورتر با شبکه با قطع قبل از وصل.",
    "unprotected": "فاقد تریپ اضافه جریان داخلی (متکی به QE3 و QBP3).",
    "grid_normal": "وضعیت I (اینورتر سه‌فاز).",
    "grid_outage": "وضعیت I: تداوم تغذیه بارهای سه‌فاز از باتری و خورشید.",
    "probable_failures": "خرابی پلاتین نول یا شکست محور چرخش مکانیکی.",
    "installer_mistakes": "عدم قطع نول یا استفاده از کلید ۳ پل و اشتراک‌گذاری نول خروجی با شبکه.",
    "supervisor_notes": "باید حتماً ۴ پل کامل (3P+N) با موقعیت صفر میانی و رده AC-23A باشد.",
    "datasheet_check": "استاندارد IEC 60947-3، رده AC-23A 40A 4P با زاویه ۹۰ درجه."
  },
  "motor_scpd": {
    "id": "motor_scpd",
    "name": "کلید حفاظت اتصال کوتاه موتور سه‌فاز (Motor Branch SCPD)",
    "category": "حفاظت بار موتوری",
    "badgeClass": "badge-eps",
    "rating_A": 16,
    "rating_a": 16,
    "poles": "3P Curve D",
    "function": "حفاظت مغناطیسی کابل تغذیه الکتروموتور سه‌فاز در برابر اتصال کوتاه بدون تریپ در استارت.",
    "location": "تابلوی بارهای ضروری، در ابتدای فیدر موتور.",
    "current_flow": "جریان کاری تا ۱۱ آمپر و جریان راه‌اندازی تا ۶۰ آمپر برای چند ثانیه.",
    "protects": "کابل فیدر موتور در برابر اتصال کوتاه فاز به فاز و فاز به زمین.",
    "unprotected": "حفاظت اضافه بار حرارتی موتور بر عهده بی متال یا رله الکترونیکی است.",
    "grid_normal": "وصل؛ تغذیه موتور در کارکرد عادی.",
    "grid_outage": "وصل؛ امکان استارت موتور تنها با رعایت محدودیت توان پیک خروجی EPS.",
    "probable_failures": "تریپ در اتصال کوتاه کابل یا سوختن سیم‌پیچ الکتروموتور.",
    "installer_mistakes": "استفاده از کلید منحنی B یا C که در لحظه استارت موتور بلافاصله تریپ می‌کند.",
    "supervisor_notes": "منحنی قطع D جهت تحمل ۶ الی ۱۰ برابر جریان نامی در راه‌اندازی موتور الزامی است.",
    "datasheet_check": "استاندارد IEC 60947-2، مشخصه D16A 3P، قدرت قطع 10kA."
  },
  "pmr_relay": {
    "id": "pmr_relay",
    "name": "رله پایش فاز، توالی فاز و عدم تقارن (Phase Monitoring Relay - PMR)",
    "category": "حفاظت و سنسورینگ سه‌فاز",
    "badgeClass": "badge-grid",
    "function": "پایش لحظه‌ای قطع هر یک از فازها، جابه‌جایی توالی فازها، افت/افزایش ولتاژ و عدم تقارن بار.",
    "location": "تابلوی اصلی و تابلوی بارهای ضروری سه‌فاز.",
    "current_flow": "سنسورینگ ولتاژی با مصرف داخلی کمتر از ۵ ولت‌آمپر.",
    "protects": "موتورها و تجهیزات سه‌فاز حساس را در برابر دوفاز شدن و سوختن حفاظت می‌کند.",
    "unprotected": "خود تجهیز باید با فیوز ۲ آمپر محافظت شود.",
    "grid_normal": "چراغ سبز وضعیت نرمال؛ رله کنتاکت فرمان را بسته نگه می‌دارد.",
    "grid_outage": "قطع فاز را در کمتر از ۱۰۰ میلی‌ثانیه تشخیص داده و فرمان قطع می‌دهد.",
    "probable_failures": "خرابی برد الکترونیکی در اثر صاعقه یا نوسان شدید نول.",
    "installer_mistakes": "عدم اتصال هادی نول به رله‌های نیازمند مرجع نول جهت سنجش ولتاژ فازی.",
    "supervisor_notes": "تنظیم آستانه عدم تقارن روی ۱۰٪ و تاخیر قطع روی ۱ ثانیه کالیبره شود.",
    "datasheet_check": "استاندارد IEC 60255، پایش قطع فاز، توالی معکوس، عدم تقارن ۵-۱۵٪."
  },
  "atse_unit": {
    "id": "atse_unit",
    "name": "کلید انتقال خودکار منبع کلاس PC (Class PC Automatic Transfer Switch - ATSE)",
    "category": "انتقال خودکار منبع قدرت",
    "badgeClass": "badge-eps",
    "rating_A": 63,
    "rating_a": 63,
    "poles": "4P Break-Before-Make",
    "function": "انتقال اتوماتیک تغذیه کل بارهای منتخب بین برق شبکه (منبع I) و خروجی اضطراری اینورتر (منبع II).",
    "location": "تابلوی اختصاصی ATS یا تابلوی اصلی ساختمان.",
    "current_flow": "جریان نامی تا ۶۳ آمپر در هر پل با زمان انتقال کمتر از ۱۰۰ میلی‌ثانیه.",
    "protects": "تضمین عدم اتصال همزمان دو منبع مستقل با اینترلاک مکانیکی و زمان مرده قطعی.",
    "unprotected": "فاقد رله تریپ اضافه جریان داخلی؛ نیازمند فیوز یا کلید بالادست هماهنگ.",
    "grid_normal": "منبع I متصل است؛ بارها مستقیماً از شبکه تغذیه می‌شوند.",
    "grid_outage": "تغییر وضعیت خودکار به منبع II (EPS) پس از احراز قطع شبکه و سپری شدن زمان مرده.",
    "probable_failures": "جام کردن مکانیزم موتوری در اثر عدم سرویس یا گیر کردن اهرم مکانیکی.",
    "installer_mistakes": "استفاده از کلیدهای ارزان‌قیمت بدون تاییدیه IEC 60947-6-1 یا کلاس CC تاییدنشده.",
    "supervisor_notes": "کلاس PC پیشنهاد پایه سند HYB-FA-001 است؛ عملکرد دستی اضطراری تست شود.",
    "datasheet_check": "استاندارد اختصاصی IEC 60947-6-1، رده کاری AC-33B، Icw=5kA/50ms."
  },
  "kg_contactor": {
    "id": "kg_contactor",
    "name": "کنتاکتور قدرت منبع شبکه با کنتاکت آینه‌ای (Grid Power Contactor - KG)",
    "category": "کلیدزنی قدرت مدار فرمان",
    "badgeClass": "badge-grid",
    "rating_A": 50,
    "rating_a": 50,
    "coil_V": "24VDC",
    "function": "وصل و قطع مسیر قدرت تغذیه بار از شبکه به فرمان ماشین حالت کنترلر انتقال.",
    "location": "داخل تابلوی انتقال ATS ماژولار.",
    "current_flow": "جریان متناوب تا ۵۰ آمپر پیوسته در رده AC-1 یا ۳۲ آمپر در رده AC-3.",
    "protects": "با باز شدن، شبکه بالادست را از بارهای منتخب جدا می‌سازد.",
    "unprotected": "متکی به اینترلاک با کنتاکتور KE جهت جلوگیری از موازیسازی ناهمگام.",
    "grid_normal": "بوبین تحریک ۲۴ ولت برق‌دار و کنتاکت‌های قدرت بسته هستند.",
    "grid_outage": "بوبین بی‌برق شده و فنرهای بازگرداننده فوراً کنتاکت‌ها را باز می‌کنند.",
    "probable_failures": "جوش‌خوردن پلاتین‌های قدرت در اضافه جریان شدید یا سوختن بوبین تحریک.",
    "installer_mistakes": "استفاده از کنتاکت کمکی معمولی به جای کنتاکت آینه‌ای Mirror NC در مسیر بوبین KE.",
    "supervisor_notes": "کنتاکت کمکی NC باید حتماً دارای علامت Mirror مطابق IEC 60947-4-1 Annex F باشد.",
    "datasheet_check": "استاندارد IEC 60947-4-1، رده AC-3، بوبین ۲۴ ولت DC با دیود سرکوبگر موازی."
  },
  "ke_contactor": {
    "id": "ke_contactor",
    "name": "کنتاکتور قدرت منبع اضطراری با کنتاکت آینه‌ای (EPS Power Contactor - KE)",
    "category": "کلیدزنی قدرت مدار فرمان",
    "badgeClass": "badge-eps",
    "rating_A": 50,
    "rating_a": 50,
    "coil_V": "24VDC",
    "function": "وصل مسیر قدرت تغذیه بار از خروجی اضطراری اینورتر تنها پس از تایید باز بودن کامل KG.",
    "location": "داخل تابلوی انتقال ATS ماژولار در مجاورت کنتاکتور KG.",
    "current_flow": "جریان متناوب خروجی اینورتر تا توان اسمی کامل.",
    "protects": "بارهای منتخب را در قطعی شبکه به منبع پشتیبان وصل می‌نماید.",
    "unprotected": "نباید قبل از باز شدن قطعی کنتاکتور شبکه بسته شود.",
    "grid_normal": "بی‌برق و در حالت استراحت باز (Normally Open).",
    "grid_outage": "پس از سپری شدن زمان مرده و تایید فیدبک KG، بوبین ۲۴ ولت برق‌دار شده و وصل می‌شود.",
    "probable_failures": "عدم وصل به دلیل قطعی در مسیر فیدبک‌های ایمنی یا افت ولتاژ مدار فرمان.",
    "installer_mistakes": "اتصال مستقیم بوبین به برق ۲۳۰ ولت شبکه که در خاموشی فلج می‌شود.",
    "supervisor_notes": "تغذیه بوبین باید از منبع بافرشده ۲۴ ولت DC مستقل تامین گردد.",
    "datasheet_check": "استاندارد IEC 60947-4-1، دارای کنتاکت Mirror NC و اینترلاک مکانیکی با KG."
  },
  "mech_interlock": {
    "id": "mech_interlock",
    "name": "اینترلاک مکانیکی صلب الاکلنگی (Rigid Mechanical Interlock Unit)",
    "category": "ایمنی مکانیکی انتقال",
    "badgeClass": "badge-eps",
    "function": "ممانعت فیزیکی و سینماتیکی ۱۰۰٪ از درگیر شدن و بسته شدن همزمان دو کنتاکتور KG و KE.",
    "location": "نصب‌شده مابین دو کنتاکتور KG و KE روی ریل تابلوی ATS.",
    "current_flow": "قطعه مکانیکی بدون جریان الکتریکی.",
    "protects": "لایه نهایی حفاظت در برابر اتصال موازی مخرب دو منبع در صورت خطای کامل مدار فرمان.",
    "unprotected": "فاقد حسگر الکتریکی مستقل (متکی به فیدبک‌های Mirror).",
    "grid_normal": "اهرم در وضعیت قفل نگه داشتن آرمیچر KE قرار دارد.",
    "grid_outage": "با باز شدن KG، اهرم آزاد شده و اجازه بسته شدن به KE را می‌دهد.",
    "probable_failures": "شکستگی اهرم در اثر اعمال گشتاور خشن یا نصب نادرست با فاصله غیرمجاز.",
    "installer_mistakes": "حذف این قطعه به بهانه وجود اینترلاک نرم‌افزاری در PLC یا سیم‌کشی الکتریکی.",
    "supervisor_notes": "بازرسی عینی حرکت الاکلنگی اهرم با دست در حالت کاملاً بی‌برق الزامی است.",
    "datasheet_check": "قطعه اصلی کارخانه‌ای سازنده کنتاکتور با کد فنی تاییدشده و گواهی آزمون مکانیکی."
  },
  "string_fuse_pos": {
    "id": "string_fuse_pos",
    "name": "فیوز خورشیدی سیلندری قطب مثبت استرینگ (PV String Positive Fuse - FPV+)",
    "category": "حفاظت DC خورشیدی",
    "badgeClass": "badge-solar",
    "rating_A": 15,
    "rating_a": 15,
    "voltage_V": 1000,
    "characteristic": "gPV",
    "function": "حفاظت کابل مثبت استرینگ و ماژول‌ها در برابر جریان‌های خطای اتصال کوتاه معکوس.",
    "location": "داخل جعبه کمباینر باکس یا ورودی تابلوی DC خورشیدی.",
    "current_flow": "جریان مستقیم تا حداکثر جریان نقطه توان ماکزیمم استرینگ (Imp=10A).",
    "protects": "کابل مثبت PV و دیودهای بای‌پاس ماژول‌ها در برابر فیدبک جریان از سایر استرینگ‌ها.",
    "unprotected": "حفاظت قطب منفی باید توسط فیوز مجزای FPV- تامین شود.",
    "grid_normal": "عبور جریان عادی تولیدی خورشید بدون گرمای غیرعادی.",
    "grid_outage": "تداوم عبور جریان جهت شارژ باتری و تغذیه بارهای اضطراری در روز.",
    "probable_failures": "سوختن فیوز در اثر اضافه جریان گذرا، شل بودن پایه‌های فیوزگیر و ذوب محفظه.",
    "installer_mistakes": "استفاده از فیوزهای عمومی AC رده gG به جای فیوز اختصاصی خورشیدی gPV.",
    "supervisor_notes": "باید حتماً دارای مارکینگ ۱۰۰۰Vdc gPV و پایه فیوز استاندارد ایمن لمس باشد.",
    "datasheet_check": "استاندارد IEC 60269-6، جریان نامی 15A 1000V DC، قدرت قطع حداقل 20kA DC."
  },
  "string_fuse_neg": {
    "id": "string_fuse_neg",
    "name": "فیوز خورشیدی سیلندری قطب منفی استرینگ (PV String Negative Fuse - FPV-)",
    "category": "حفاظت DC خورشیدی",
    "badgeClass": "badge-solar",
    "rating_A": 15,
    "rating_a": 15,
    "voltage_V": 1000,
    "characteristic": "gPV",
    "function": "حفاظت هادی منفی استرینگ در برابر خطاهای اتصال زمین مضاعف و جریان‌های معکوس.",
    "location": "داخل تابلوی حفاظت DC در مجاورت فیوز مثبت.",
    "current_flow": "جریان مستقیم بازگشتی استرینگ به اینورتر.",
    "protects": "کامل‌کننده حفاظت دو قطب غیرزمین‌شده در برابر خطای زمین طبق IEC 62548.",
    "unprotected": "فاقد قابلیت قطع زیر بار (نباید زیر جریان باز شود).",
    "grid_normal": "عبور جریان نامی استرینگ.",
    "grid_outage": "عبور جریان تولیدی پنل‌ها.",
    "probable_failures": "سوختن فیوز در خطای اتصال زمین کابل منفی.",
    "installer_mistakes": "حذف فیوز منفی با این فرض غلط که منفی به زمین وصل است.",
    "supervisor_notes": "در آرایه‌های فتوولتائیک فاقد زمین صلب، نصب فیوز روی هر دو هادی مثبت و منفی الزامی است.",
    "datasheet_check": "استاندارد IEC 60269-6، رده gPV 1000V DC 15A."
  },
  "kbat_contactor": {
    "id": "kbat_contactor",
    "name": "کنتاکتور اصلی جریان مستقیم باتری (Main DC Battery Contactor - KBAT)",
    "category": "کلیدزنی قدرت DC باتری",
    "badgeClass": "badge-battery",
    "rating_A": 150,
    "rating_a": 150,
    "voltage_V": 100,
    "function": "وصل و قطع مسیر قدرت جریان بالا بین بانک باتری و باس DC اینورتر به فرمان BMS.",
    "location": "داخل کابینت باتری یا تابلوی مدیریت انرژی باتری (BPU).",
    "current_flow": "جریان دشارژ مداوم تا ۱۲۰ آمپر و جریان شارژ تا ۱۰۰ آمپر.",
    "protects": "ایزولاسیون کامل بانک باتری در صورت وقوع خطای فرار حرارتی، اضافه ولتاژ یا اتصال کوتاه.",
    "unprotected": "قبل از وصل باید حتماً مدار پیش‌شارژ KPRE خازن‌های اینورتر را شارژ کرده باشد.",
    "grid_normal": "پیوسته بسته؛ هدایت جریان شارژ و دشارژ هوشمند.",
    "grid_outage": "پیوسته بسته؛ تامین توان بارهای بحرانی از باتری.",
    "probable_failures": "جوش‌خوردگی پلاتین‌ها در اثر بستن کلید روی خازن دشارژ بدون پیش‌شارژ.",
    "installer_mistakes": "استفاده از کنتاکتورهای متناوب AC که در ولتاژ DC قوس خاموش‌نشدنی ایجاد می‌کنند.",
    "supervisor_notes": "باید از نوع رله یا کنتاکتور سیلدشده با گاز بی‌اثر (Hermetically Sealed DC Contactor) باشد.",
    "datasheet_check": "استاندارد IEC 60947-4-1 رده DC-1/DC-3، پلاتین‌های دوقطبی با دمنده مغناطیسی قوس."
  },
  "kpre_contactor": {
    "id": "kpre_contactor",
    "name": "کنتاکتور کمکی مدار پیش‌شارژ باتری (Precharge Relay / Contactor - KPRE)",
    "category": "مدیریت راه‌اندازی DC باتری",
    "badgeClass": "badge-battery",
    "rating_A": 20,
    "rating_a": 20,
    "function": "فعال‌سازی موقت شاخه مقاومت پیش‌شارژ جهت شارژ کنترل‌شده خازن‌های اینورتر قبل از وصل KBAT.",
    "location": "داخل واحد مدیریت باتری (BPU) موازی با کنتاکتور اصلی KBAT.",
    "current_flow": "جریان محدودشده پیش‌شارژ حداکثر ۲ الی ۳ آمپر به مدت کمتر از ۱ ثانیه.",
    "protects": "کنتاکتور اصلی KBAT و خازن‌های اینورتر را در برابر جریان هجومی ۲۵۰۰ آمپری محافظت می‌کند.",
    "unprotected": "نباید بیش از ۲ ثانیه در مدار بماند (خطر گرمای شدید مقاومت RPRE).",
    "grid_normal": "پس از اتمام موفق پیش‌شارژ و وصل KBAT، این کنتاکتور قطع و خاموش می‌شود.",
    "grid_outage": "در استارت اولیه از حالت خاموشی کامل (Black Start) فعال می‌گردد.",
    "probable_failures": "چسبیدن کنتاکت و عبور جریان مداوم از مقاومت پیش‌شارژ.",
    "installer_mistakes": "حذف مدار پیش‌شارژ و وصل مستقیم باتری به اینورتر با بریکر دستی.",
    "supervisor_notes": "توالی فرمان BMS کنترل شود: وصل KPRE -> شارژ خازن تا ۹۵٪ -> وصل KBAT -> قطع KPRE.",
    "datasheet_check": "رله DC ولتاژ بالا با تاییدیه تحمل جریان پالسی و استاندارد IEC 61810."
  },
  "rpre_resistor": {
    "id": "rpre_resistor",
    "name": "مقاومت سرامیکی سیمی پیش‌شارژ (Precharge Ceramic Power Resistor - RPRE)",
    "category": "محدودکننده جریان هجومی",
    "badgeClass": "badge-battery",
    "resistance_ohm": 47,
    "power_W": 50,
    "function": "محدود کردن فیزیکی جریان هجومی شارژ خازن‌های باس DC اینورتر به زیر ۲ آمپر.",
    "location": "به صورت سری با کنتاکتور KPRE در شاخه فرعی پیش‌شارژ.",
    "current_flow": "جریان نمایی میراشونده از ۱.۱ آمپر به صفر در مدت زمان حدود ۵۰۰ میلی‌ثانیه.",
    "protects": "المان‌های نیمه‌هادی اینورتر و پلاتین‌های کلیدها را در برابر تنش حرارتی I²t حفاظت می‌کند.",
    "unprotected": "در صورت ماندن مداوم در مدار، داغ شده و می‌سوزد.",
    "grid_normal": "در کارکرد عادی جریانی از آن عبور نمی‌کند و کاملاً سرد است.",
    "grid_outage": "تنها در چند صد میلی‌ثانیه راه‌اندازی اولیه فعال است.",
    "probable_failures": "سوختن و قطع شدن سیم‌های داخل مقاومت در اثر تایم‌اوت فرمان BMS.",
    "installer_mistakes": "انتخاب مقاومت کربنی معمولی با توان ناچیز به جای مقاومت سرامیکی سیمی نسوز.",
    "supervisor_notes": "باید مقاومت سیمی با پوسته آلومینیومی هیت‌سینک‌دار یا سرامیکی ۵۰ واتی باشد.",
    "datasheet_check": "تحمل انرژی پالسی حداقل ۵۰ ژول و ولتاژ شکست عایقی حداقل ۱۰۰۰ ولت."
  },
  "ksep_relay": {
    "id": "ksep_relay",
    "name": "رله جداسازی گالوانیک شبکه و ضد برگشت (Grid Disconnection Relay - KSEP)",
    "category": "حفاظت ضدجزیره‌ای و جداسازی شبکه",
    "badgeClass": "badge-grid",
    "function": "قطع فیزیکی و گالوانیک هادی‌های فاز و نول شبکه در زمان قطعی برق جهت جلوگیری از Backfeed.",
    "location": "داخل اینورتر هایبرید یا جعبه سوئیچینگ تاییدشده خارجی سازنده.",
    "current_flow": "جریان نامی کامل خط ورودی شبکه به اینورتر.",
    "protects": "تکنسین‌های خطوط توزیع برق بالادست را در برابر برق‌گرفتگی ناشی از تزریق معکوس محافظت می‌کند.",
    "unprotected": "عملکرد آن با رله‌های پایش فرکانس و ولتاژ کنترل می‌شود.",
    "grid_normal": "بسته است؛ ارتباط پورت شبکه برقرار است.",
    "grid_outage": "ظرف کمتر از ۲۰ میلی‌ثانیه باز می‌شود و شبکه را به طور قطعی جدا می‌کند.",
    "probable_failures": "جوش‌خوردن تیغه‌های رله در اثر کلیدزنی اتصال کوتاه.",
    "installer_mistakes": "پل زدن دستی رله KSEP یا عدم توجه به گواهی استاندارد ضد جزیره‌ای اینورتر.",
    "supervisor_notes": "باید دارای گواهینامه معتبر انطباق با IEC 62116 و VDE-AR-N 4105 باشد.",
    "datasheet_check": "رله دوگانه سری با فاصله هوایی تاییدشده مطابق استاندارد IEC 62109-1."
  },
  "kne_relay": {
    "id": "kne_relay",
    "name": "رله پیوند دینامیکی نول به زمین در جزیره (Island N-PE Dynamic Bonding Relay - KNE)",
    "category": "حفاظت سیستم زمین و اشخاص",
    "badgeClass": "badge-eps",
    "function": "اتصال خودکار نول خروجی اضطراری اینورتر به شینه زمین حفاظتی (PE/MET) در زمان قطعی شبکه.",
    "location": "داخل اینورتر یا جعبه سوئیچینگ سازگار، در سمت منبع کلیدهای محافظ جان RCD.",
    "current_flow": "در حالت عادی جریانی عبور نمی‌کند؛ تنها در زمان خطای اتصال فاز به بدنه جریان خطا را عبور می‌دهد.",
    "protects": "امکان عملکرد صحیح و قطع سریع کلیدهای محافظ جان RCBO را در حالت جزیره‌ای فراهم می‌سازد.",
    "unprotected": "نباید در زمان وصل بودن شبکه بسته باشد.",
    "grid_normal": "باز است (Open)؛ نول سیستم به نول شبکه متکی است و از اتصال تکراری نول-زمین جلوگیری می‌شود.",
    "grid_outage": "بلافاصله پس از باز شدن قطعی KSEP بسته می‌شود و سیستم محلی TN-S را تشکیل می‌دهد.",
    "probable_failures": "عدم بسته شدن رله KNE در جزیره که موجب بی‌خاصیت شدن کلیدهای محافظ جان می‌گردد.",
    "installer_mistakes": "پل زدن دائمی نول خروجی به شینه ارت که در حالت متصل به شبکه موجب تریپ کاذب RCD اصلی می‌شود.",
    "supervisor_notes": "توالی باز شدن KNE پیش از وصل مجدد KSEP بررسی شود؛ هادی PE هرگز قطع نمی‌گردد.",
    "datasheet_check": "رله استاندارد مورد تایید سازنده با کنتاکت‌های مقاوم به جریان اتصال کوتاه نامی."
  },
  "ksafe_relay": {
    "id": "ksafe_relay",
    "name": "رله ایمنی ناظر مدار فرمان (Master Safety Loop Relay - KSAFE)",
    "category": "مدار فرمان و ایمنی صنعتی",
    "badgeClass": "badge-eps",
    "voltage_V": "24VDC",
    "function": "نظارت پیوسته بر شستی قطع اضطراری EPO، سنسورهای دمای تابلو و خطاهای بحرانی اینترلاک.",
    "location": "داخل تابلوی کنترل و مدار فرمان ATS.",
    "current_flow": "جریان تغذیه بوبین رله‌های ایمنی کمتر از ۱ آمپر DC.",
    "protects": "در صورت بروز هرگونه خطر، تغذیه بوبین تمامی کنتاکتورهای قدرت را فوراً قطع می‌نماید.",
    "unprotected": "مدار باید ذاتا Fail-Safe و در صورت قطع سیم فرمان قطع شود.",
    "grid_normal": "انرژی‌دار (Energized) و کنتاکت‌های NO آن در مدار بوبین‌های قدرت بسته هستند.",
    "grid_outage": "در صورت سلامت مدارها انرژی‌دار باقی مانده و اجازه مانور انتقال را صادر می‌کند.",
    "probable_failures": "سوختن فیوز مدار فرمان FU-C یا فعال ماندن شستی EPO.",
    "installer_mistakes": "بای‌پاس کردن کنتاکت رله ایمنی با سیم مستقیم در هنگام تعمیرات.",
    "supervisor_notes": "فشردن شستی EPO باید بلافاصله KSAFE را باز کند و تا زمان ریست دستی قفل بماند.",
    "datasheet_check": "رله ایمنی با استاندارد ISO 13849-1 رده ایمنی Cat 4 / PLe یا SIL 3."
  },
  "timer_tg": {
    "id": "timer_tg",
    "name": "تایمر پایداری بازگشت شبکه (Grid Restoration Stabilization Timer - TG)",
    "category": "زمان‌بندی کنترل انتقال",
    "badgeClass": "badge-grid",
    "function": "شمارش معکوس زمان پایداری شبکه پس از وصل مجدد (معمولاً ۳۰ الی ۶۰ ثانیه) قبل از انتقال بار.",
    "location": "داخل کنترلر انتقال یا رله زمانی تابلوی فرمان ATS.",
    "current_flow": "سیگنال کنترلی دیجیتال یا تغذیه مولتی‌تایمر.",
    "protects": "از انتقال زودهنگام بار به شبکه‌ای که پس از مانور پست ممکن است مجدداً قطع شود جلوگیری می‌کند.",
    "unprotected": "در صورت ناپایداری ولتاژ شبکه در حین شمارش، تایمر ریست شده و از نو آغاز می‌شود.",
    "grid_normal": "تایمر سپری شده و فرمان در وضعیت پایدار است.",
    "grid_outage": "ریست شده و در وضعیت آماده‌باش قرار دارد.",
    "probable_failures": "تنظیم اشتباه زمان روی صفر ثانیه که موجب خاموش و روشن شدن مکرر بارها می‌شود.",
    "installer_mistakes": "انتقال فوری بار به شبکه بدون تاخیر زمانی که موجب آسیب به کمپرسورها می‌گردد.",
    "supervisor_notes": "تنظیم حداقل روی ۶۰ ثانیه جهت انطباق با دستورالعمل‌های بهره‌برداری توصیه می‌شود.",
    "datasheet_check": "تایمر تاخیر در وصل (On-Delay) با دقت میلی‌ثانیه‌ای و پایداری در برابر نویز."
  },
  "timer_td": {
    "id": "timer_td",
    "name": "تایمر زمان مرده انتقال باز (Dead-Time Delay Timer - TD)",
    "category": "زمان‌بندی کنترل انتقال",
    "badgeClass": "badge-eps",
    "function": "اعمال تاخیر قطعی بین باز شدن کنتاکتور قبلی و وصل کنتاکتور بعدی (۱۰۰ الی ۵۰۰ میلی‌ثانیه).",
    "location": "داخل کنترلر منطقی FSM یا ماژول تایمر تاخیر بین سوئیچ‌ها.",
    "current_flow": "فرمان دیجیتال زمان مرده.",
    "protects": "اطفای کامل قوس الکتریکی و میرایی ولتاژ القایی بارهای موتوری قبل از اتصال به منبع جدید.",
    "unprotected": "حذف این زمان مرده موجب انفجار پلاتین‌ها خواهد شد.",
    "grid_normal": "غیرفعال؛ هر دو کلید در وضعیت مشخص هستند.",
    "grid_outage": "در لحظه انتقال فعال شده و فاصله باز بین قطع منبع اول و وصل منبع دوم را تضمین می‌کند.",
    "probable_failures": "خرابی تایمر که می‌تواند موجب وصل زودهنگام منبع روبرو شود.",
    "installer_mistakes": "تنظیم زمان مرده کمتر از زمان خاموش شدن جرقه پلاتین‌های کنتاکتور.",
    "supervisor_notes": "حداقل زمان مرده ۳۰۰ میلی‌ثانیه برای بارهای دارای کولر و پمپ الزامی است.",
    "datasheet_check": "تایمر ترانزیستوری فوق‌سریع با تکرارپذیری زیر ۵ میلی‌ثانیه مطابق IEC 61812-1."
  }
};
Object.assign(components, additional);

console.log('Total merged components:', Object.keys(components).length);

// 3. Assemble complete PERSIAN_ELECTRICAL_DB
const fullDB = {
  metadata: {
    document_code: "HYB-FA-001",
    revision: "B",
    title: "سامانه جامع خورشیدی هیبرید تک‌فاز و سه‌فاز و تجهیزات انتقال منبع",
    date: "2026-09-08",
    schematics: ["SLD-01", "SLD-02", "SLD-03", "DC-01", "DC-02", "E-01", "C-01"]
  },
  components: components,
  why_data: why_data,
  fat_sat_tests: fat_sat_tests,
  troubleshooting_matrix: troubleshooting_matrix,
  checklists: checklists,
  calculators: calculators,
  guide_data: HYB_GUIDE_DATA
};

const fileHeader = `/**
 * ==============================================================================
 * Hybrid Solar PV Simulator & Engineering Knowledge Base
 * Persian Electrical Database & Engineering Standards Registry (PERSIAN_ELECTRICAL_DB)
 * Document Code: HYB-FA-001 Rev B (Single-Phase SLD-01, True 3-Phase SLD-02, External ATSE SLD-03)
 * Standards Compliance: IEC 60364-7-712:2025, IEC 60947-6-1:2026, IEC 62548-1,
 *                       IEC 62109-1/2, IEC 62619, IEC 63056, IEC 62446-1, IEC 61643
 * ==============================================================================
 */

const PERSIAN_ELECTRICAL_DB = ${JSON.stringify(fullDB, null, 2)};

// Attach canonical registry and graph
if (typeof CANONICAL_REGISTRY !== 'undefined') {
  PERSIAN_ELECTRICAL_DB.registry = CANONICAL_REGISTRY;
  PERSIAN_ELECTRICAL_DB.CANONICAL_REGISTRY = CANONICAL_REGISTRY;
}

if (typeof window !== "undefined") {
  window.PERSIAN_ELECTRICAL_DB = PERSIAN_ELECTRICAL_DB;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { PERSIAN_ELECTRICAL_DB };
}
`;

const targetPath = path.resolve(__dirname, '../js/electrical-db.js');
fs.writeFileSync(targetPath, fileHeader, 'utf8');
console.log(`Successfully built updated ${targetPath} (${fs.statSync(targetPath).size} bytes)`);
