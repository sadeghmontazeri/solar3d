# GPT ideas — independent planning proposal

## بازبینی سوم: اثر توسعهٔ شش خانوادهٔ سامانه بر کار انجام‌شده و نمای سه‌بعدی

**زمان:** 2026-09-13T16:22:33-04:00  
**شناسهٔ عامل:** Codex-GPT6-/root  
**مبنای بررسی:** `PLAN.md`، `work.md` و کد پوشهٔ `17` در commit `8dff80d1b5b8ac0e43c598dae62bc5e6246f6585`.  
**وضعیت:** دامنهٔ زیر درخواست صریح مالک است؛ راهکارها و ترتیب توسعهٔ پیشنهادی این بخش هنوز PROPOSED هستند. این نوبت فقط سند ایده‌ها را به‌روزرسانی می‌کند؛ کد، گزارش عامل کارگر و تأییدهای ثبت‌شده تغییر نمی‌کنند.

### دامنهٔ تازه و پاسخ کوتاه

| خانواده | محدودهٔ توان درخواستی | انواع سیستم | خروجی مورد انتظار |
|---|---|---|---|
| تک‌فاز | تا ۱۰ کیلووات؛ حد پایین هنوز مشخص نشده | هیبرید، آنگرید، آفگرید | SLD و صحنهٔ سه‌بعدی متناسب با هر پیکربندی |
| سه‌فاز | ۵ تا ۱۰۰ کیلووات | هیبرید، آنگرید، آفگرید | SLD و صحنهٔ سه‌بعدی متناسب با هر پیکربندی |

مالک SLDها را هنوز آماده نکرده و در مراحل بعد می‌فرستد. فرض پیشنهادی برای نام‌گذاری محدوده‌ها، توان نامی **کل AC سامانه** است؛ باید هنگام دریافت مشخصات روشن شود که اعداد به AC اینورتر اشاره دارند یا DC آرایه. در سه‌فاز، «۱۰۰ کیلووات» خودبه‌خود به معنی ۱۰۰ کیلووات برای هر فاز نیست. توان DC، ظرفیت باتری و حدود هر پورت جدا ثبت شوند.

**این تغییر کارهای انجام‌شده را باطل نمی‌کند، ولی با افزایش چند عدد هم اجرا نمی‌شود.** زیرساخت فعلی قابل استفاده است؛ تعمیم مدل تک‌فاز، ساخت صحنه‌های متناسب با تجهیزات و نگاشت SLDهای تازه، فاز توسعهٔ جدا می‌خواهد. الزام یک HTML مستقل و آفلاین همچنان برقرار است؛ چند فایل اجرایی جدا پیشنهاد نمی‌شود.

در نسخهٔ بررسی‌شده، همین محدوده‌ها **از قبل در فاز ۷ `PLAN.md` ثبت شده‌اند** (`950` به بعد). بنابراین نیاز به افزودن دوبارهٔ دامنه نیست؛ نکات زیر اصلاحات پیشنهادی برای اجرای آن فاز هستند.

### وضعیت واقعی کار انجام‌شده

- `work.md` تا **Step 8** را DONE گزارش کرده و اصلاح **7b** هم وجود دارد. تاریخچهٔ Git، commitهای اصلاح تراز توان، جهت ذرات، دوربین، SBY، فونت و RCD را نشان می‌دهد؛ ارزیابی محدود به گزارش مرحلهٔ ۷ نماند.
- مستقل از گزارش عامل کارگر، `node tests/power-model.test.js` اجرا شد: **۸ از ۸ آزمون پاس شد**. مدل زنده اکنون از `js/power-model.js` استفاده می‌کند. خطای قدیمی ۵۹۰۰ وات برای بار ۳۷۰۰ وات در این مسیر اصلاح شده است.
- خروجی موجود `dist/solar-app.html` حدود **۲٫۶۱ مگابایت** است؛ بررسی متنی، تگ script خارجی و import راه‌دور CSS پیدا نکرد. این بررسی جای آزمون کامل شبکه/مرورگر را نمی‌گیرد؛ فایل خروجی دوباره ساخته نشد.
- اکنون گزارش‌های اجرای مرورگر و تصاویر تازه در `work.md` و `evidence/` وجود دارند؛ تصویر مرحلهٔ 7b نیز دیده شد. این شواهدِ عامل کارگرند، نه اجرای مجدد مرورگر توسط من. برخلاف نوبت‌های قبل، دیگر عبارت «هیچ مدرک اجرای مرورگر نداریم» دربارهٔ وضعیت فعلی درست نیست.
- این تأیید، مدل را برای سه‌فاز یا ۱۰۰ کیلووات اعتبارسنجی نمی‌کند. اعداد ثابتِ دو استرینگ ۲۸۰۰ وات، ولتاژ ۳۸۵/۲۳۰، آستانهٔ EPS برابر ۵۲۰۰ وات، محدودیت‌های شارژ/دشارژ و ظرفیت ۵۱۲۰Wh هنوز در مدل و کنترل‌کننده دیده می‌شوند (`power-model.js` و `app.js:368`).
- مرز آزمون‌ها مهم است: P4 عمداً رفتار فعلیِ بدون clipping را نگه می‌دارد؛ قرارداد حفظ رفتار هنگام refactor با تأیید صحت کامل الکتریکی یکسان نیست. همچنین آزمون مرورگری 7b با عنوان QG open، **Q0 را هم باز می‌کند** (`scripts/verify_step7b.js`)؛ آن بخش به‌تنهایی رفتار بازشدن فقط QG را ثابت نمی‌کند. P2 محاسباتِ QG باز را جداگانه بررسی می‌کند.

بخش‌های بازبینی اول و دومِ پایین این فایل سابقهٔ تاریخی‌اند؛ ایرادهای رفع‌شدهٔ آن‌ها نباید دوباره به‌عنوان ایراد فعلی فهرست شوند.

### کدام کارها حفظ شوند و کجا تغییر لازم است؟

| بخش | اثر دامنهٔ تازه |
|---|---|
| Git، شواهد، آزمون‌ها، بسته‌بندی آفلاین و فونت | حفظ شوند؛ برای خانواده‌های بعدی هم مفیدند. |
| اصلاح دوربین، اعتبارسنجی SBY و لغو فرمان دیررس | حفظ شوند؛ در سیستم فاقد SBY، فرمان/کنترل آن اصلاً ارائه نشود. |
| مدل مستقل و تراز توان مرحلهٔ ۷ | نقطهٔ شروع مناسب؛ وابستگی به ظرفیت و توپولوژی ثابت باید جدا شود. مسئلهٔ سه‌فاز در لایهٔ مدل حل شود، نه با دستکاری HUD. |
| مراحل ۹ تا ۱۱، انتخاب و بازرسی تابلو | ادامهٔ آن‌ها مفید است؛ فرمان‌ها براساس ID و قابلیت تجهیز تعریف شوند. نسخهٔ اول روی MDB فعلی اثبات شود، ولی منطق عمومی در همان یک شناسه قفل نشود. |
| ظاهر و کنترل‌های مراحل ۱۲ تا ۱۴ | قبل از در دسترس قرار گرفتن خانواده‌های جدید تکمیل شوند؛ شش مجموعه دکمه و پنل دائمی نسازیم. |
| ساخت صحنه و اتصال SLD | برای چند پیکربندی آماده نیستند. `scene-3d.js` یک چیدمان مشخص می‌سازد و تله‌متری SLD فعلاً فقط برای `SLD-01` به‌روزرسانی می‌شود (`sld-schematic.js:2206`). |

### اصلاحات پیشنهادی برای فاز ۷ `PLAN.md`

1. **Step 15 را به چند تغییر کوچک تقسیم کنیم.** تبدیل تمام سازنده‌های 3D، مدل، inspector و کابل‌ها در یک refactor بزرگ ریسک زیادی دارد. 15a قرارداد داده و پروفایل سیستم فعلی؛ 15b خواندن پارامترهای مدل از پروفایل با آزمون‌های حفظ رفتار؛ 15c تبدیل تدریجی یک کابینت/گروه و سپس گروه‌های دیگر به سازندهٔ قابل استفاده مجدد؛ 15d تعویض پروفایل و پاک‌سازی منابع. برای این مراحل، SLD جدید لازم نیست؛ سیستم موجود مرجع است.
2. **وابستگی مراحل را روشن کنیم.** متن فعلی هم «وجود معماری پروفایل» را پیش‌نیاز فاز ۷ می‌داند، هم ساخت آن را Step 15 همان فاز قرار می‌دهد. طراحی قرارداد می‌تواند اکنون انجام شود؛ پیاده‌سازی پروفایل فعلی بعد از مراحل بازرسی؛ ساخت و فعال کردن هر خانوادهٔ جدید فقط پس از دریافت SLD/مشخصات همان خانواده.
3. **سه‌فاز را ضرب همه‌چیز در سه تعریف نکنیم.** سه‌فاز متعادل می‌تواند نسخهٔ اولیهٔ آموزشی باشد، با برچسب روشنِ فرض تعادل؛ داده‌ها از ابتدا جای وضعیت و توان هر فاز داشته باشند. توان کل AC از توان فازها، ولتاژ خط‌به‌خط از خط‌به‌نول و مسیر DC/باتری از AC تفکیک شود. همهٔ ولتاژها، ظرفیت باتری و حدود اینورتر سه‌برابر نمی‌شوند. بار نامتعادل/قطع یک فاز تا زمان مدل‌سازی، «پشتیبانی نشده» باشد، نه یک عدد تخمینی ظاهراً دقیق.
4. **نوع سیستم را از اسمش نتیجه‌گیری کامل نکنیم.** آنگریدِ ساده و آفگریدِ باتری‌دار می‌توانند الگوهای اولیه باشند، ولی وجود باتری، EPS، بای‌پس، نحوهٔ جداسازی و حدود عملکرد از SLD و مشخصات تجهیزات می‌آید. جمله‌های مطلقی مانند «آفگرید همیشه باتری اجباری دارد» قرارداد عمومی برنامه نشوند. حذف ظاهری شبکه از hybrid نیز به‌تنهایی مدل آفگرید معتبر نمی‌سازد.
5. **توان یک پارامتر است، اما همهٔ ظرفیت‌ها یک آرایش تجهیزات ندارند.** برای هر خانواده، پیکربندی‌های تأییدشده با حدود سازگاری تعریف شود. تا زمان داشتن مشخصات، اسلایدر آزاد ۵ تا ۱۰۰ کیلووات که خودش تعداد اینورتر، استرینگ یا رک باتری را حدس بزند ارائه نشود. مرز تغییر تعداد تجهیزات و کلاس تابلو می‌تواند پله‌ای باشد.
6. **ترتیب خانواده‌ها تابع SLD آماده و قابلیت‌های لازم باشد.** ابتدا سیستم فعلی در قالب پروفایل؛ سپس ساده‌ترین خانواده‌ای که SLD آن رسیده است. اولین نمونهٔ سه‌فاز لزوماً نباید پیچیده‌ترین hybrid باشد. مراحل بررسی per-phase و عملکرد سیستم بزرگ، قبل از برچسب «پشتیبانی ۱۰۰ کیلووات» انجام شوند.
7. **نقشهٔ مالک را به قالب داخلی تحمیل نکنیم.** هنگام دریافت هر SLD یک جدول نگاشت شناسهٔ نقشه↔component/port/terminal بسازیم. لازم نیست مالک فقط برای رعایت نام‌های داخلی برنامه، نقشهٔ خود را دوباره رسم کند. شمارهٔ بازبینی SLD، مشخصات تجهیزات، فرض‌ها و موارد نامشخص همراه پروفایل ذخیره شوند.

### ظاهر سه‌بعدی پیشنهادی

**سه سطح مشاهده:** «نمای کلی سامانه → تجهیزات و تابلوها → داخل تابلو و ترمینال‌ها». کاربر در نمای کلی ارتباط بخش‌ها را می‌بیند و برای جزئیات روی همان تجهیز Focus می‌کند. معماری این تعامل در همهٔ خانواده‌ها یکسان می‌ماند؛ تجهیزات و چیدمان از پروفایل می‌آیند.

- **تک‌فاز کوچک:** مدل دیواری/اتاق تجهیزات موجود قابل استفاده است، با تعداد و نوع تجهیزات مطابق SLD. باتری یا تابلوی پشتیبانِ ناموجود نباید باقی بماند یا اطلاعات فرضی نمایش دهد.
- **سه‌فاز و ظرفیت بالاتر:** چیدمان چند تجهیز، تابلوهای مناسب آن پیکربندی و آرایهٔ گسترده لازم می‌شود. یک اینورتر ۵ کیلوواتی را صرفاً بزرگ نکنیم و نام آن را ۱۰۰ کیلووات نگذاریم. شکل، تعداد و ترمینال‌ها مطابق equipment list باشد؛ جزئیات هندسی صرفاً تزئینی می‌توانند ساده بمانند.
- **آرایهٔ بزرگ:** نمای کلی ردیف‌ها/گروه‌ها با شمارش روشن و انتخاب یک استرینگ برای جزئیات. تکرار مدل پنل با instancing یا روش مناسبِ کاهش تعداد رسم انجام شود. مدل فعلی از `InstancedMesh` استفاده نمی‌کند؛ بزرگ شدن فایل تنها هزینه نیست، مصرف حافظه و زمان رسم هم باید سنجیده شود.
- **دوربین وابسته به ابعاد صحنه:** قاب‌بندی خودکار براساس محدودهٔ تجهیزات و فضای آزاد کنار inspector؛ Home، فاصلهٔ دوربین و صفحات برش برای اتاق کوچک و سایت بزرگ یکسان فرض نشوند. نمای روبروی خوانا برای ترمینال‌ها حفظ شود.
- **نمایش فازها در صورت انتخاب:** کاربر یک مسیر/فاز را برجسته کند؛ L1/L2/L3 و نولِ موجود در طرح، با برچسب روشن تفکیک شوند. همهٔ کابل‌ها و برچسب‌ها هم‌زمان روی تصویر نیفتند. معرفی وجود نول یا نوع حفاظت از روی تصویر عمومی انجام نشود.
- **شدت ذرات نسبی:** سرعت جریان فعلی با تقسیم بر ۵۰۰۰ تنظیم می‌شود (`scene-3d.js:4241`)؛ برای مدل ۱۰۰ کیلووات تقریباً همهٔ جریان‌های بزرگ به سقف سرعت می‌رسند. نمایش شدت نسبت به ظرفیت مسیر/تجهیز تعریف شود و مقدار واقعی کنار مسیر انتخاب‌شده قابل مشاهده بماند.
- **تعویض پروفایل بدون باقی‌مانده:** انتخاب قبلی، timerها، callbackهای انتقال، listenerها، labelها و جریان‌ها متعلق به پروفایل قبلی پاک یا بی‌اعتبار شوند. هندسه/بافت/material اختصاصی آزاد و منابع مشترک با مالکیت مشخص مدیریت شوند. `dispose()` فعلی این چرخه را کامل پوشش نمی‌دهد؛ فقط حذف renderer برای تعویض مکرر صحنه کافی نیست.

پیشنهاد رابط: یک انتخابگر جمع‌وجور برای **فاز، نوع سیستم و پیکربندی تأییدشده**؛ در نمای اصلی توان کل و وضعیت منابع، و در جزئیات اطلاعات هر فاز/تجهیز. خانوادهٔ بدون SLD می‌تواند با وضعیت «در انتظار نقشه» فهرست شود، ولی شبیه‌سازی معتبر و اعداد ساختگی نداشته باشد.

### مدل داده و مرز کار قبل/بعد از دریافت SLD

پیشنهاد تفکیک داده‌ها:

`SystemProfile → تجهیزات/قابلیت‌ها + اتصال‌های الکتریکی + چیدمان نمایشی + نگاشت SLD`

پروفایل شامل شناسه و نسخه، تعداد فاز، نوع سیستم، حدود توانِ واحددار، فهرست تجهیزات و پورت‌ها، وضعیت اعتبارسنجی و مرجع SLD باشد. «برق‌دار بودن»، «توان عبوری»، «وضعیت کلید» و «اعتبار داده» در state جدا باشند. اطلاعات هندسی، جانمایی یا رنگ، منبع تعیین رابطهٔ الکتریکی نشوند.

**قبل از SLDهای جدید قابل انجام است:** طراحی قرارداد پروفایل، اصلاح تعامل و ظاهر عمومی، یک تابلوی قابل بازرسی، پارامتری کردن تدریجی سیستم فعلی، زیرساخت بسته‌بندی مدل/تصویر آفلاین، و آزمون بار گرافیکی با دادهٔ صریحاً آزمایشی. چنین آزمون گرافیکی‌ای تأیید یک سیستم واقعی ۱۰۰ کیلووات نیست.

**بعد از دریافت SLD لازم است:** نگاشت تجهیزات و ترمینال‌ها، روابط فاز و نول/زمین، انتخاب نوع و حدود تجهیز از اطلاعات مالک، اتصال صحنه به نقشه، سناریوهای مجاز، و آزمون هر پیکربندی. ورود تصویر نقشه به برنامه به‌تنهایی به معنی پشتیبانی شبیه‌سازی آن نیست.

SLD معمولاً برای تعیین شکل و ابعاد دقیق تجهیزات کافی نیست. برای مدل دقیق، تصویر/کاتالوگ، ابعاد تابلو و چیدمان داخلی لازم می‌شود؛ تا آن زمان جزئیات فیزیکی نامعلوم با مدل نماینده و برچسب روشن نشان داده شوند، نه با ادعای انطباق کامل با تجهیز واقعی.

### معیارهای پذیرش این توسعه

1. پروفایل فعلی ۵ کیلووات بعد از refactor آزمون‌های ۸گانه را حفظ کند؛ موارد شناخته‌شدهٔ نادرست در مجموعهٔ جدا برای اصلاح مدل ثبت شوند و هنگام اصلاح، انتظار آزمون مستند تغییر کند.
2. هر خانوادهٔ جدید، SLD دارای نسخه، نگاشت معتبر، مشخصات تجهیزات و سناریوهای مستقل داشته باشد. تک‌فاز تا ۱۰ و سه‌فاز ۵ تا ۱۰۰ دامنهٔ هدف‌اند؛ تا قبل از اعتبارسنجی، پشتیبانی سراسری این بازه‌ها اعلام نشود.
3. نبود باتری/شبکه/EPS در پیکربندی، کنترل و نمایش مربوط را هم حذف یا نامرتبط کند؛ هیچ مقدار یا جریان متعلق به سیستم قبلی باقی نماند.
4. در سه‌فاز، جمع توان فازها با توان کل سازگار باشد؛ واحدها و حدود کل/هر فاز روشن باشند. فرض متعادل بودن آشکار و سناریوی خارج از مدل مسدود/مشخص باشد.
5. تعویض مکرر میان پیکربندی‌ها، سناریو و انتخاب را طبق قرارداد reset کند؛ شمار renderer، listener، timer و مصرف حافظه رشد مداوم نداشته باشد.
6. نمونهٔ بزرگ با تعداد واقعی تجهیزاتِ پیکربندی منتخب روی PC مرجع سنجیده شود؛ FPS پیشنهادی حداقل ۳۰ هنگام گردش/بازرسی، همراه اندازه‌گیری زمان بارگیری و حافظه. ظرفیت نامی به‌تنهایی تعداد دقیق پنل را تعیین نمی‌کند.
7. همهٔ نقشه‌ها، فونت‌ها، کد، مدل‌ها و decoderهای لازم در **همان یک HTML** قرار بگیرند. انتخاب صحنهٔ بعدی از دادهٔ تعبیه‌شده انجام شود؛ دریافت شبکه‌ای یا فایل جانبی لازم نباشد. خروجی نهایی روی PC دوم با شبکه قطع آزموده شود.
8. رابط در ۱۳۶۶×۷۶۸ و زوم ۲۰۰٪ قابل استفاده بماند؛ انتخاب و بررسی با صفحه‌کلید نیز ممکن باشد و inspector تجهیز هدف را نپوشاند.

**گام بعدی پیشنهادی:** مرحلهٔ ۹ِ انتخاب/عملیات ادامه پیدا کند و قرارداد قابل استفادهٔ مجدد برای تجهیزات همان‌جا لحاظ شود؛ مراحل ۱۰–۱۱ روی یک تابلو اثبات شوند. طراحی قرارداد پروفایل هم‌زمان قابل بررسی است. پیاده‌سازی خانواده‌های جدید تا دریافت SLD همان خانواده انجام نشود. دامنهٔ شش‌خانواده‌ای را به وعدهٔ قبلی ۳–۴ روز اضافه نکنیم؛ بعد از اولین پروفایل و اولین SLD جدید، برآورد جدا ارائه شود.

---

## بازبینی دوم: ارزیابی طرح Opus و نظر Gemini

**زمان:** 2026-09-13T13:10:30-04:00  
**شناسهٔ عامل:** Codex-GPT6-/root  
**وضعیت:** PROPOSED — پیشنهاد برای تصمیم‌گیری مالک؛ مجوز پیاده‌سازی نیست.  
**دامنهٔ این نوبت:** فقط به‌روزرسانی `gpt-ideas.md`. به درخواست جدید کاربر، `HISTORY.md` و کد برنامه تغییر نمی‌کنند. بررسی مستقل قبلی در ادامه حفظ شده است.

### نظر من دربارهٔ دو پاسخ

طرح نسخهٔ ۲ Opus مبنای مناسبی برای تجمیع است: حذف مسیریاب خودکار از برنامهٔ کوتاه‌مدت، حفظ مدل‌های موجود، انتخاب با کلیک و عملیات با فرمان مستقل، نمایش جزئیات در صورت نیاز، و آزمایش خروجی آفلاین در ابتدای کار را توصیه می‌کنم.

با دو نتیجه‌گیری آن موافق نیستم: «کار باقی‌مانده فقط آداپتور است، نه فیزیک» و اینکه تأیید پنج باگ اولیه، کل طرح را تأیید می‌کند. تست‌های موجود نقطهٔ شروع خوبی هستند؛ مشخصات کامل و مستقلاً اعتبارسنجی‌شدهٔ رفتار برنامه نیستند. بررسی تازه، خطاهایی در خود موتور پیشنهادی برای جایگزینی پیدا کرد.

ارزیابی Gemini چند باگ واقعی را درست توضیح می‌دهد، اما عبارت‌های «۱۰۰٪ قطعی»، «تأیید کامل» و «سبز کامل» فراتر از شواهد ارسالی‌اند. در متن ارائه‌شده، دستورهای Node برای خواندن/جست‌وجوی کد و مشاهدهٔ فایل‌ها دیده می‌شود؛ نتیجهٔ اجرای تعاملی مرورگر، نسخهٔ مرورگر، لاگ راه‌اندازی یا تصویر تازه وجود ندارد. نمی‌توان از همین متن نتیجه گرفت که پروژه در مرورگر اجرا و بررسی شده است؛ اگر اجرای جداگانه‌ای انجام شده، مدرکش باید به گزارش اضافه شود. همچنین خطای آموزشی یک شبیه‌ساز را باید دقیق توصیف کرد؛ این بررسی نشان نمی‌دهد که برنامه تجهیزات واقعی را کنترل می‌کند.

### یافته‌های تازه و اصلاح ادعاها

این موارد با کد فعلی پوشهٔ `17` و بررسی‌های بدون تغییر فایل بازتولید شدند. بررسی‌های `app.js` در Node با غیرفعال کردن راه‌اندازی DOM اجرا شدند؛ بررسی موتور مستقل از طریق API خود آن انجام شد. آزمون مرورگر یا تأیید استاندارد الکتریکی انجام نشده است.

| موضوع | نتیجهٔ مشاهده‌شده | اثر بر تصمیم |
|---|---|---|
| **موتور مستقل: توان بای‌پس** | در `simulation-engine.js` با تابش صفر، باتری قطع، بار عادی ۱۸۰۰ وات، بار بحرانی ۱۲۰۰ وات و SBY=II، خروجی شبکه **۱۸۰۰**، بار بحرانی **۰**، ولتاژ همان بار **۲۳۰** و کل بار **۱۸۰۰** گزارش شد. `pCritFromBypass` محاسبه می‌شود ولی وارد حساب نهایی نمی‌شود (`572,581,858–859`). | این موتور هم پیش از جایگزینی به اصلاح محاسبه و قرارداد تله‌متری نیاز دارد. تست بای‌پس باید توان بار و توان شبکه را هم بررسی کند، نه فقط صفر بودن خروجی EPS اینورتر. |
| **موتور مستقل: خروجی QO** | در SBY=I، با `qoBreaker=false`، توان بار بحرانی **۰** ولی `criticalLoadsVoltage_V=230` باقی ماند (`855–858`). | ولتاژ پورت اینورتر و ولتاژ پایین‌دست کلید خروجی باید جدا شوند. این نتیجه با منطق قطع بار در همین مدل ناسازگار است. |
| **موتور مستقل: باقی ماندن تریپ** | `setFault(RCD_TRIP,true)` تریپ را فعال می‌کند؛ `setFault(RCD_TRIP,false)` بدون فرمان بازنشانی مستقل آن را پاک می‌کند (`1157`). | ادعای کامل بودن رفتار لچ‌شدهٔ موتور تأیید نمی‌شود. رفع علت خطا و بازنشانی وسیلهٔ تریپ‌کرده باید در قرارداد فرمان‌ها تفکیک شوند. |
| **QPv در کنترل‌کنندهٔ فعلی** | فرمان `AppOrchestrator.onBreakerStateChanged('qpv_isolator',false,...)` توان استرینگ اول را از حدود **۲۲۸۵** به **۰** می‌رساند؛ استرینگ دوم حدود **۲۲۸۵** می‌ماند. علت، نگاشت به `dc_isolator` و `dc_iso_1` است (`app.js:2265–2270`). | «نام مستقیماً در فرمول خوانده نمی‌شود» برابر «کلید کاملاً بی‌اثر است» نیست. ابهام نگاشت/دامنهٔ اثر باقی است و باید با تعریف تجهیز تطبیق داده شود. این اصلاح، مشکل جداگانهٔ `eps_rcd` را رد نمی‌کند. |
| **رفع یک‌خطی خطای شبکه** | با QG باز، SBY=0، تابش صفر و باتری قطع، شبکه به‌درستی **۲۲۰۰** وات بار عادی را تغذیه می‌کند (`app.js:495–496`). | خطای شمارش دوباره در همهٔ حالت‌ها وجود ندارد. حذف بی‌قیدوشرط `normalPower` از جمع نهایی، این حالت درست را خراب می‌کند. اصلاح باید در چند مسیر تغذیه آزموده شود. |
| **فرمان دیررس SBY** | در آزمون با صف زمان‌سنج کنترل‌شده: فرمان I→II وضعیت را موقتاً 0 می‌کند؛ فرمان بعدی کاربر برای ماندن در 0 صادر می‌شود؛ سپس callback قبلی ۸۰ میلی‌ثانیه‌ای، وضعیت را دوباره II می‌کند (`app.js:2213–2245`). | علاوه بر جلوگیری از `undefined`، انتقال قبلی باید با فرمان جدید لغو/بی‌اعتبار شود. آخرین فرمان معتبر کاربر باید ملاک بماند. این آزمون ترتیبی بود، نه اندازه‌گیری زمان در مرورگر. |

چند عبارت دیگر نیز بهتر است دقیق‌تر شوند:

- سناریوی نام‌گذاری‌شدهٔ «کمتر از ۲۰ms» زمان واقعی را اندازه نمی‌گیرد. تست SBY هم 0 را خودش بین I و II می‌فرستد؛ اثبات نمی‌کند که انتقال مستقیم حتماً از 0 عبور می‌کند. توالی آموزشی موتور از تأخیرهای ۲۰۰+۲۰۰+۱۵۰ میلی‌ثانیه استفاده می‌کند و برچسب‌های زمانی جدا دارد. زمان شبیه‌سازی، زمان انیمیشن و ادعای عملکرد سخت‌افزار باید تفکیک شوند.
- `verify_dc_box.js` فایل `app.js` را می‌خواند و با `vm.Script` نحو آن را بررسی می‌کند؛ رفتار زندهٔ کنترل‌کننده را اجرا نمی‌کند. عبارت دقیق «تست رفتاری کنترل‌کننده نداریم» است. پیام موفقیت «۲۶ معیار» نیز متن ثابت اسکریپت است و درصد پوشش کد محسوب نمی‌شود.
- `sound-fx.js` کاملاً بدون اجرا نیست: singleton می‌سازد و listenerهای تعامل کاربر ثبت می‌کند (`564`, `_bindGestureUnlock`). رابط از موتور صدای دیگری استفاده می‌کند. حذف/ادغام این تکرار باید پس از بررسی اثرات راه‌اندازی انجام شود.
- نبود `aria-*` به‌تنهایی به معنی فقدان کامل دسترس‌پذیری نیست؛ برخی کنترل‌ها HTML بومی‌اند. ایرادهای قابل اقدام، دسترسی صفحه‌کلید به تجهیزات، نام‌گذاری، مدیریت فوکوس و توضیح متنی وضعیت هستند.
- سقف توان AC اینورتر را با توان DC آرایه یا توان کل بارهای شبکه یکی نکنیم. معیار clipping باید پورت و مسیر تبدیل را مشخص کند؛ عبارت کلی «توان PV هرگز از توان نامی AC بیشتر نشود» معیار دقیقی برای این مدل نیست.

### اصلاح پیشنهادی برنامهٔ اجرایی

1. **تصمیم دربارهٔ موتور را مشروط نگه داریم.** موتور جداگانه نامزد استفاده است؛ انتخاب قطعی آن بعد از رفع موارد بالا و آزمون روی قرارداد خروجی مشترک باشد. آداپتور ترجمهٔ شناسه/واحد/فرمان انجام دهد؛ محل انباشته شدن یک موتور محاسباتی سوم نشود.
2. **قابلیت‌های خاموش 3D را یک‌جا فعال نکنیم.** خود Opus درست نوشته که `isolateSubsystem()` در برخورد با material مشترک، عمق گروه‌ها و بازگرداندن شفافیت مشکل دارد. ابتدا یک تابلو، با ذخیره و بازیابی حالت اصلی اجسام، end-to-end بررسی شود. روشن کردن هم‌زمان شش API هدف روز اول مناسبی نیست.
3. **اصلاح تعامل هم‌زمان با اتصال قابلیت‌ها انجام شود.** انتخاب بدون تغییر مدار، اعتبارسنجی فرمان در کنترل‌کننده، لغو انتقال‌های قدیمی و تفکیک drag/click از ابتدا لازم‌اند؛ فقط جابه‌جا کردن دکمه‌ها کافی نیست.
4. **قواعد خطا را دسته‌بندی کنیم.** تغییر شرایط محیطی، فرمان قطع کلید، علت خطا و وضعیت تریپ یک چیز نیستند. «همهٔ خطاها همیشه لچ شوند» قاعدهٔ عمومی مناسبی نیست؛ رفتار بازیابی هر مورد باید از تعریف تجهیز/سناریوی تأییدشده بیاید. برای `fspd_mcb` نیز صرفاً برای قابل‌مشاهده شدن اثر، قطع تمام بارها را اختراع نکنیم؛ وضعیت حفاظت مرتبط باید مدل شود.
5. **سقف ۱۲ کنترل و ۸۰٪ صحنه را هدف طراحی بدانیم، نه اثبات کیفیت.** برای نمای کلی و بازرسی تابلو معیار جدا تعریف شود. Home، Focus و باز/بسته کردن تابلو باید قابل کشف بمانند؛ میان‌برهای 1..9 و دوبارکلیک راه تکمیلی‌اند. پنل بازشده نباید تجهیز انتخاب‌شده را بپوشاند؛ دوربین براساس فضای آزاد قاب‌بندی شود.
6. **کابل‌کشی همچنان در اختیار مالک بماند.** فعلاً قرارداد شناسه‌ها و terminal anchorها را تعریف کنیم. حتی اتصال نهایی endpointها بدون نگاشت تأییدشده ممکن است رابطهٔ اشتباه را تثبیت کند؛ آن را کار اجباری روز چهارم نگذاریم. طراحی SLD، مسیر فیزیکی و topology در این مرحله تغییر نمی‌کنند.

| مرحلهٔ پیشنهادی پس از تأیید مالک | خروجی قابل بررسی |
|---|---|
| روز ۱ | ثبت baseline و راه‌اندازی Git در صورت تأیید؛ اثبات HTML مستقل؛ تست‌های کنترل‌کننده و موتور نامزد؛ اصلاح محدود خطاهای فوری تعامل/حساب توان با آزمون مسیرهای مرتبط. |
| روز ۲ | نمای اصلی خلوت و یک تابلوی کامل: انتخاب، Focus، بازکردن، مشخصات، بازگشت؛ مدیریت فوکوس/صفحه‌کلید و فرمان‌های متوالی SBY. |
| روز ۳ | یکپارچه‌سازی مرحله‌ای موتورِ اصلاح‌شده، هم‌خوانی تله‌متری و جهت جریان؛ سپس تعمیم بازرسی به تابلوهای دیگر در حد زمان باقی‌مانده. |
| روز ۴ | آزمون خروجی نهایی روی PC دوم، مرورگرهای توافق‌شده، آفلاین، زوم و کارکرد طولانی؛ رفع اشکال و تحویل نسخهٔ مشخص. افزودن topology جدید و کابل‌کشی جزو تعهد این چهار روز نباشد. |

برآورد ۳–۴ روز برای این برش محدود قابل بررسی است، اما هنوز با اجرای زنده و اندازه‌گیری حجم اصلاحات تأیید نشده. زمان آزمون/تحویل را برای کامل کردن فهرست قابلیت‌ها مصرف نکنیم.

### پیشنهادهای تکمیلی من برای تجربهٔ 3D

- **«این تجهیز اکنون از کجا تغذیه می‌شود و چرا خاموش است؟»** پاسخ یک‌خطی از state در بالای inspector، همراه با نمایش مسیر مرتبط. این توضیح از نمایش هم‌زمان ده‌ها عدد مفیدتر است.
- **بازگشت به دید قبلی:** پس از ورود به داخل تابلو، یک دکمه کاربر را به همان موقعیت قبلی دوربین برگرداند؛ Home همچنان نمای کلی را باز کند. هنگام تغییر دوربین، انتخاب تجهیز و سناریو بی‌دلیل پاک نشوند.
- **اعدادِ تابع وضعیت:** inspector باز با تغییر سناریو به‌روز شود؛ مقادیر ثابت با برچسب «مشخصات مرجع» و اطلاعات ناموجود با «مدل نشده» نمایش داده شوند. عدد صفر جای اطلاعات نامعلوم ننشیند.
- **قابلیت تحویل قابل ردگیری:** HTML ساخته‌شده، شناسهٔ نسخه/commit داشته باشد و به‌عنوان artifact یا پیوست Release همراه checksum تحویل شود. لازم نیست فایل تولیدشده در شاخهٔ سورس commit شود، ولی کاربر باید بداند فایل روی دو دستگاه دقیقاً یک نسخه است. اطلاعات ورود و secrets وارد سورس یا HTML نشوند.

### معیارهای افزوده برای تأیید بعدی

- بای‌پس: با ورودی‌های آزمون بالا، بار بحرانی از حساب حذف نشود؛ در مدل بدون تلفاتِ مسیر بای‌پس، مجموع تقاضا ۳۰۰۰ وات است. پورت EPS و بار بحرانی دو فیلد مستقل داشته باشند.
- قطع QO: در توپولوژی فعلی و بدون منبع پایین‌دست دیگر، خروجی بار قطع‌شده به‌اشتباه ۲۳۰ ولت نگیرد؛ برق‌دار بودن پورت بالادست را جدا نشان دهیم.
- نام‌های معادل فرمان‌ها نتیجهٔ واحد و دامنهٔ اثر مستند داشته باشند؛ SBY ورودی نامعتبر نپذیرد و فرمان OFF با انتقال قدیمی بازنویسی نشود.
- پس از اصلاح انرژی، QG باز، بای‌پس، باتری پر/خالی، قطع یک استرینگ و تغییر سریع سناریو بررسی شوند؛ اختلاف توان با قرارداد تلفات/گردکردنِ مشخص سنجیده شود.
- تست‌های موجود حفظ و گسترش یابند؛ آزمون واقعی مرورگر روی همان HTML تحویلی انجام شود. تکرار یک نتیجه توسط چند گزارش، شواهد اجرایی تازه تولید نمی‌کند.

**نتیجهٔ پیشنهادی:** جهت طراحی Opus پذیرفتنی است؛ جزئیات فنی و زمان‌بندی آن با اصلاحات بالا برای تصمیم‌گیری آماده‌تر می‌شود. تأیید قطعی Gemini را مبنای شروع پیاده‌سازی نمی‌دانم. در این نوبت فقط سند ایده‌ها به‌روزرسانی می‌شود و تأیید اجرای برنامه همچنان با مالک است.

---

## Original independent proposal — preserved

Date: 2026-09-13T12:41:35-04:00  
Agent: Codex-GPT6-/root  
Status: PROPOSED — await the consolidated plan before implementation.

Reviewed folder: `C:\Users\11\Desktop\PC\shahrivar\solar-app\APP\17`

## Recommendation and scope

Keep the existing procedural 3D equipment and useful technical content. Make the scene the main workspace, with one contextual inspector and one authoritative simulation state. Fix misleading interaction and telemetry behavior before adding visual detail.

**User-confirmed constraints:** planning documentation only; prioritize desktop; deliver one self-contained HTML file that opens offline without a server; support incremental additions. The user owns the existing SLD and will revise SLD/cabling later. Routing ideas below are future integration proposals, not an approved wiring design. No application files were changed, and no Git repository or remote was created.

## Evidence and limits

Reviewed the HTML/CSS, app controller, scene construction/interactions, simulation engine, registry/connectivity evaluator, supporting data, sound, SLD integration, and existing verification scripts. `node scripts/verify-all.js` completed successfully, including **9/9 scenario tests**. These primarily exercise the separate simulation engine and database, not the live controller.

Additional checks evaluated the unchanged `app.js` in Node with DOM initialization suppressed and exercised scene methods without rendering. Findings marked **reproduced** are logic results, not browser click tests. The browser tool blocked the local file URL under its security policy; current rendering, responsiveness, FPS, and browser compatibility remain unverified. The existing `scripts/screenshot-test.png`, dated September 8, shows clutter and overlapping labels, but is historical evidence only.

Source locations below are relative to the reviewed folder for portability across devices.

## Verified findings

| Finding | Evidence and consequence |
|---|---|
| Hybrid is the implemented live model | `app.js:253,318,899` provides five operating scenarios for one hybrid installation. There is no separate live on-grid/off-grid topology selector. A hybrid outage scenario is not proof of a complete off-grid system model. |
| Two simulation implementations | `app.js:318,2141` calculates state every 100 ms and feeds HUD, SLD, and 3D. `simulation-engine.js` exports another engine, but the app does not instantiate it. The registry's `ElectricalConnectivityGraph` is a hard-coded evaluator, not a general terminal graph (`electrical-db.js:2298`). Passing its tests does not validate the live app. |
| Incorrect power accounting | **Reproduced:** zero irradiance, battery disconnected, normal/critical loads 2200/1500 W gives grid import **5900 W**, although load demand totals 3700 W. Normal demand is counted in both `totalLoadToInverter` and `gridPower` (`app.js:434,495–496`). |
| Port/load/state conflation | **Reproduced:** bypass selected with no PV/battery still reports inverter output 1500 W; bypass at grid voltage 165 V reports load voltage 230 V. Setting `eps_rcd=false` leaves aggregate EPS powered. See `app.js:392–427,506`. Per-circuit behavior needs an explicit contract with the user's later SLD. |
| Limits and ratings differ | Live PV uses 2 × 2800 W and 385 V (`app.js:342–357`); the separate engine specifies 2 × 6 × 450 W with module Vmp 41.5 V (`simulation-engine.js:118`). **Reproduced:** 1200 W/m², full battery, zero loads gives 6451 W reported output for the labeled 5 kW inverter. Select one approved parameter set; model curtailment and losses explicitly. |
| 3D SBY and Front View defects | **Reproduced without rendering:** `toggleBreaker3D('sby_switch')` passes an undefined position into the rotary switch (`scene-3d.js:3744–3797`). `setCameraFrontView()` throws because `_animateCamera` is absent (`3800`). |
| Flow display is inconsistent | Bottom filters call only `SLDSchematic.setFlowFilter` (`app.js:851–862`). Battery cable points run battery→inverter, while positive charging watts animate forward; inverter-grid cable direction similarly conflicts with import sign. Incoming-grid particles are disabled during export (`app.js:530–543`; `scene-3d.js:3326,4209`). These are source-verified direction/filter mismatches, not a full routing audit. |
| Inspector values can mislead | EPS conductor metadata embeds values such as 230 V/16.5 A (`scene-3d.js:2817–3133`). The inspector reads these as live values and treats missing/low voltage as de-energized/isolated (`app.js:2153`). Unknown, no power flow, de-energized, and isolated must be distinct states. |
| Interface competes with the scene | HTML defines 12 header actions, five scenario buttons, seven telemetry cards, eight quick actions, and eight bottom filters. CSS adds a 320 px right control panel and 420 px left inspector. Technical controls and camera actions are duplicated. No ARIA attributes appear in the HTML; clickable div labels and hover-dependent 3D selection need keyboard/touch alternatives. |
| Good reusable 3D foundation | `scene-3d.js` already contains cabinet interiors, doors, DIN rails, ducts, terminals, ferrules, camera presets, inverter X-ray, and procedural textures. Preserve these. External routes and many interior paths use hand-entered Catmull–Rom control points rather than terminal-derived endpoints. Exact clipping/crossings still need live inspection. |
| Not yet one standalone file | `index.html:1115–1124` loads ten local scripts plus external CSS. Three.js r128 and OrbitControls are already local. `styles.css:7` imports the Persian font from a CDN. There is no Git repository at this folder or its parents according to `git rev-parse`. |

## Proposed interface and 3D experience

1. **Compact top bar:** short title, system selector when validated, scenario selector, pause/reset, and a More menu. Move standards badges, long subtitles, contractors, exercises, commissioning, calculators, and reference guides out of the default workspace. Retain useful material in a searchable Reference area; remove duplicated navigation rather than deleting content immediately.
2. **Scene first:** default to an uncluttered overview with a compact strip for Solar, Battery, Grid, and Loads. Show units and words such as “Charging” or “Exporting”; voltage/current/efficiency belong in Details. Keep a concise active-fault message visible when relevant.
3. **One contextual inspector:** selecting equipment shows name, purpose, current state, and available actions. Offer Overview, Connections, and Technical details. Environment/load sliders live in a collapsible Scenario drawer, faults under Advanced. Eliminate the permanent full-width bottom filter bar; put Show flow/Selected circuit/Labels in a compact View menu.
4. **Inspection must not operate equipment:** single click selects; an explicit Open/Close/Change source action operates it. Double-click or Focus centers the selection. Separate dragging from clicking; provide visible zoom, pan, Front, and Home controls plus equivalent keyboard actions. This prevents exploration from silently changing the scenario.
5. **Cabinet inspection:** reuse existing geometry. Focus one cabinet, open its door, suppress nearby labels, and provide Exterior / Interior / Connections views. Add a straight-on camera with optional orthographic projection for reading terminals. Use local cutaway or removable covers before making the entire scene transparent. Defer a full exploded view until the basic cabinet view is clear.
6. **Trace one connection:** select a terminal or conductor to highlight its endpoints and connected path; dim unrelated items and show an ordered connection list. Keep conductor identity/color separate from the animated energy-flow overlay. Display reference values explicitly as reference values; show “Unknown/not modeled” where state is unavailable.
7. **Accessible, quieter presentation:** Persian RTL interface with isolated LTR technical identifiers/units, readable local font, visible focus, labeled native controls, focus-contained dialogs with Escape/return focus, keyboard component list, and text-plus-shape status cues. Sound should be optional; pause/reduced-motion should stop particles and camera animation. Show only selected/important labels and avoid label overlap.

## Proposed architecture and incremental additions

Use this dependency direction:

`system definition + user commands → one simulation state → UI / 3D / future SLD adapter`

- Keep maintainable source files in Git. Split by responsibility: equipment definitions, system profiles, simulation/commands, scene factories, selection/camera, inspector/reference content, and release packaging. Avoid a wholesale framework or Three.js upgrade during this short iteration; first establish a working baseline with the bundled version.
- Define stable component, port, terminal, and connection IDs. Store ratings and topology separately from cabinet placement, geometry, and UI labels. Translate legacy aliases at one boundary instead of spreading substring matching through controllers.
- Reconcile both existing calculation implementations against approved scenarios; do not simply wire in the separate engine because its tests pass. Separate measured/simulated values, reference specifications, and display formatting. Advance physics using elapsed simulation time; UI refreshes must not advance battery SOC.
- Introduce profiles incrementally: validate hybrid first; derive on-grid/off-grid from their actual permitted equipment and operating rules, not by hiding battery/grid meshes. Exact profiles and hardware behavior remain pending user SLD/equipment confirmation.
- Add each component through a definition plus a scene factory and inspector entry. Add each content section through a registry entry. A new reference section should not require changes to simulation code.
- For the later cabling revision, bind routes to terminal anchors and explicit duct waypoints. Prefer predictable straight sections with rounded bends; separate electrical connectivity from route geometry. Add endpoint continuity and enclosure-intersection checks after the approved routing model exists. No topology, neutral/earth bond, or protection-rating changes are proposed as approved work now.

## Offline feasibility and risks

**A single-file desktop release appears feasible**, given local libraries and procedural assets, but is not yet demonstrated. Build a minimal release early: inline CSS, classic bundled JavaScript, data, SVG, licensed font bytes, and all required images/models/decoders. Preserve library/license notices. Instantiate heavy sections on demand from embedded data; do not download them at runtime.

The release must have no required network calls, sidecar files, runtime imports, localhost service, or installation step. Development/build tools may run on developer machines; the user's exported HTML must not require them. Loaded ES-module dependencies can encounter file-URL CORS restrictions, so emit a self-contained classic bundle. [MDN module guidance](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)

Use optional, guarded local storage for preferences, with explicit JSON export/import for portable user state. File-URL storage behavior is not guaranteed across browsers or moved files. [MDN localStorage guidance](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)

File size is secondary, but GPU memory and startup cost still matter: reuse geometry/materials, instance repeated parts where practical, reduce quality on slower hardware, and pause rendering when idle/hidden. Provide a readable component/status view if WebGL fails. Mobile local-file opening and touch interaction need device testing; desktop acceptance should not imply universal mobile compatibility.

Electrical compliance statements in existing text have not been independently validated. Keep hardware-dependent timing and protection claims in qualified reference content pending review against the user's actual equipment and documents.

## Proposed 3–4 day implementation sequence — after consolidation

| Phase | Deliverable and gate |
|---|---|
| Day 1 | Agree scope and shared IDs; establish Git baseline and live-controller regression cases; prove an initial single-file offline build. Resolve which simulation implementation owns state. |
| Day 2 | Simplify interface; repair SBY/front-view and selected-state synchronization; make selection distinct from operation; validate one cabinet end to end. |
| Day 3 | Extend cabinet focus/connection inspection, reconcile displayed telemetry and flows, and add accessible controls/quality settings. Integrate only validated system profiles. |
| Day 4 / buffer | Test exported HTML on a second PC and agreed browsers, check keyboard/zoom/offline behavior, fix regressions, and record release evidence. |

Assumption: this schedule covers a focused first pass using current models. A complete three-topology simulator, full electrical validation, automatic cable routing, and universal device support should not be promised within four days. If only three days are available, defer new profiles and cosmetic detail before cutting offline or logic verification.

## Proposed acceptance criteria

- Only planning Markdown changes before consolidated approval. Later implementation has one authoritative state and meaningful tests against the controller used by the UI, retaining the existing tests.
- Reproduce and resolve the grid accounting, bypass attribution/voltage, switch-state, and power-limit cases above. One command produces consistent component state in controls, 3D, telemetry, and the existing SLD integration. Sign conventions, losses, and unserved/curtailed power are explicit.
- SBY accepts only I/0/II; Front/Home work; inspection never toggles a breaker; pointer dragging never triggers operation. Every visible switch either affects its modeled circuit or is explicitly labeled illustrative.
- One cabinet can be opened, focused, and understood without overlapping panels; selected terminals reveal endpoints and connection details. Filters visibly affect 3D. Any later routing work terminates at registered anchors and passes its agreed geometry checks.
- At 1366×768 and 1920×1080, core controls remain reachable and equipment is not hidden by persistent panels. At 200% browser zoom, controls reflow or scroll without becoming unreachable. Essential tasks work by keyboard; status is not color-only.
- Copy the exported HTML alone into an otherwise empty folder on a second PC. In fresh browser profiles with network disabled, open it directly in agreed Chrome/Edge/Firefox versions: 3D, Persian fonts, reference content, and scenarios work without sidecar requests or startup errors. Record browser/device versions and failures.
- Agree a reference PC before promising performance; proposed minimum is 30 FPS during normal orbit/inspection. Measure startup, memory, and a sustained session. Test WebGL-unavailable and reduced-motion behavior separately.
- Add one small component and one reference section through their registries to demonstrate extensibility. Any new system profile passes its own approved scenario matrix before being labeled supported.

## Proposed GitHub workflow and consolidation

Create/connect the repository only in the implementation phase. One integrator owns merges and generated release HTML; contributors work in separate clones/worktrees and short-lived branches, with one owner per shared file during an overlapping task. Do not have two agents edit the current monolithic scene file simultaneously.

Use small PRs with changed behavior and validation evidence. Commit and push before changing devices; fetch and check branch/commit before resuming. Keep tooling versions/lockfile reproducible. Generate the release from merged source rather than hand-editing or merging generated HTML. Inspect diffs and exclude credentials, tokens, `.env` files, private logs, and local-only artifacts; use secret scanning when configuring the repository.

Maintain append-only HISTORY entries: ISO timestamp, agent, status (PROPOSED / APPROVED / IMPLEMENTED / VERIFIED), affected scope, evidence, and next step. Merge concurrent entries by retaining both. Consolidation should explicitly choose the default layout, authoritative simulation, profile scope, browser matrix, and ownership. **No redesign proposal in this document is approved yet.**
