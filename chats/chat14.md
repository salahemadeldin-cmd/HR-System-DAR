# تقرير يوميات العمال

_Started 2026-09-20 08:07 UTC_

---

## User

Continuing from "ربط النظام بـ LOVeable".

## Assistant

We're converting the standalone El Shorouk HR system into a real Lovable web application with persistent database storage.

You provided three design-system files and asked to migrate the system to Lovable using local storage temporarily. I built a complete migration package: a Vite + React + TypeScript + Tailwind project structure with ten screens covering workers, professions, departments, projects, sectors, payroll attestations (سركي), settlements, allowances, transfers, reports, and user permissions.

Key decisions made:
- Kept data in IndexedDB (local browser storage) initially, avoiding server dependency as requested — migration to Supabase is one .env variable change later because data access is isolated in a single layer.
- Prepared full Supabase schema (schema.sql) with seed CSVs for all reference data and transactional records, allowing instant production migration without code changes.
- Built ten React screens matching your exact workflows: sequential transfers (Sector → Project → Worker), financial separation for settlements (old/new project codes independent), contractor allowances calculated daily, National ID validation with duplicate detection.
- Created CSV import/export utilities on every data-entry screen for Excel integration.

Current state: Complete project package ready — GitHub-pushable source code at `lovable/` folder with all screens, seed data in `public/seed.json` and SQL, and `LOVABLE-PROMPT.md` containing full Arabic specifications (ten departments, A–E categories, validation rules, business logic).

Next steps: Push to GitHub, connect to Lovable via "Import from GitHub," paste LOVABLE-PROMPT.md into Lovable's system prompt, run `npm install && npm run dev` locally to verify, then either keep IndexedDB or migrate to Supabase by updating `.env`.

Files: lovable/ (complete source), LOVABLE-PROMPT.md, supabase/schema.sql, seed CSVs (departments, professions, projects, sectors, contractors, workers, sarak_entries).

## User

أريد إنشاء شاشة تقرير جديدة مخصصة للطباعة والمراجعة بعنوان "تقرير عن إجمالي يوميات العمل للعمال" بنظام مقاس ورق A4 (RTL - من اليمين لليار)، مطابقة للنموذج والتفاصيل التالية:

### 1. الرأس والترويسة (Header):
- **جهة اليمين:** اسم الشركة ونشاطها (مثال: "شركة الشروق للمقاولات العمومية والتوريدات للقطاع العام").
- **جهة اليسار:** مكان مخصص لشعار الشركة (Logo).
- **في الوسط (عنوان التقرير):** شريط بارز مكتوب فيه "تقرير عن إجمالي يوميات العمل للعمال".
- **بيانات الفترة الزمنية (أعلى اليسار أسفل العنوان):** 
  - جدول/مربع يوضح "عن الفترة": 
    - من: [تحديد التاريخ]
    - إلى: [تحديد التاريخ]

### 2. بيانات المشروع والمقاول (Project Details Header):
جدول معلومات منظم بألوان هادئة (خلفيات بألوان مثل الأخضر الفاتح/الأزرق الفاتح/البيج طبقاً للنموذج):
- **اسم المشروع:** حقل لعرض اسم المشروع (مثل: مشروع إنشاء المقر الإداري الجديد).
- **اسم المقاول:** حقل لعرض اسم المقاول (مثل: ذاتي الإدارة).
- **المنطقة:** حقل لعرض المنطقة (مثل: الشئون الإدارية).

### 3. جدول / بطاقات بيانات العمال (Workers Records):
تصميم كل سجل عامل بنظام شبكي أنيق ومحاط بحدود واضحة ومفصولة بخط مميز (طبقاً للنموذج المرفق):
- **كود العامل:** (مثل: 13610034)
- **اسم العامل:** (مثل: إبراهيم جلال محمد نوغان)
- **عدد اليوميات:** (مثل: 16)
- **القيمة المستحقة:** (بالجنيه المصري، مثل: 6,296.25 ج.م)
- **خانة التوقيع:** إضافة خانة مخصصة لتوقيع أو بصمة العامل بجانب بياناته.

### 4. إجمالي التقرير (Summary & Footer Totals):
- في نهاية السجلات (الصفحة الأخيرة)، شريط إجمالي يحتوي على:
  - **إجمالي المستحق للمقاول عن الفترة:** المبلغ الإجمالي محسوباً بالجنيه المصري (مثال: 48,275.58 ج.م).

### 5. تذييل الطباعة والصفحات (Print Page Footer):
- **تاريخ ووقت الطباعة:** يظهر تلقائياً في أسفل الصفحة عند أمر الطباعة موضحاً باليوم والتاريخ والساعة والدقيقة بدقة.
- **ترقيم الصفحات:** إظهار ترقيم الصفحات في أسفل اليمين/اليسار بنظام: `Page 1 of X`.

### المتطلبات التقنية:
1. وفر لي الكود الكامل (HTML / CSS / Tailwind CSS أو كود React/Next.js) مع ضبط إعدادات الطباعة `@media print`:
   - مقاس الصفحة A4 عمودي (`@page { size: A4 portrait; margin: 10mm; }`).
   - تجنب انقسام سجل العامل في منتصف الصفحة أثناء الفاصل بين الصفحات (`page-break-inside: avoid;`).
   - إخفاء أي أزرار تحكم أو فلاتر غير ضرورية عند الطباعة وظهور زر "طباعة" وزر "تصدير PDF" في الواجهة للمستخدم.
2. استخدام خط عربي أنيق وواضح (مثل `Cairo` أو `Tajawal`).

## Assistant

_[tool: grep]_

_[tool: dc_write]_

_[tool: ready_for_verification]_

شاشة التقرير جاهزة: A4 عمودي RTL، ترويسة بالشعار واسم الشركة، شريط العنوان، صندوق الفترة (من/إلى قابل للتغيير)، جدول بيانات المشروع/المقاول/المنطقة بألوان هادئة، سجلات العمال مع خانة توقيع وحماية من الانقسام بين الصفحات، شريط الإجمالي، وتذييل بتاريخ/وقت الطباعة وترقيم الصفحات — مع زرّي طباعة وتصدير PDF مخفيين عند الطباعة.

ملاحظة: البيانات حالياً نموذجية (٩ عمال) — أعطني مصدر البيانات الفعلي (أو اربطها بشاشة السراكي) لأجعلها حقيقية.

## User

Found issues — fixing…

## Assistant

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: ready_for_verification]_

أزلت حساب الصفحات بالجافاسكريبت الذي كان يسبب التجميد؛ التذييل الآن ثابت (تاريخ/وقت الطباعة + ترقيم الصفحة).

## User

Found issues — fixing…

## Assistant

_[tool: dc_write]_

_[tool: ready_for_verification]_

استبدلت مكوّن الصفحات بهيكل A4 مملوك داخل التقرير (`@page A4 portrait` + هامش 10mm)، وهذا أزال سبب التجميد. الشاشة الآن ورقة A4 واحدة بالترويسة والشعار وشريط العنوان وصندوق الفترة وجدول المشروع/المقاول/المنطقة و٩ سجلات عمال بخانة توقيع وشريط الإجمالي وتذييل الطباعة.

## User

اريد ايضا اضافة المهنة لكل كود واريد عمل هذه الشاشه في السيستم الذي بنية سابقا الخاص بالحضور والانصراف 
والتوقيعات التي تكون بادني هذه الصفحة هي "HR Site - محاسب الموقع - مدير المشروع "

## Assistant

_[tool: grep]_

_[tool: grep]_

_[tool: list_files]_

_[tool: grep]_

_[tool: grep]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: grep]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: grep]_

_[tool: str_replace_edit]_

Now the standalone report DC: add profession + the new signature labels.

_[tool: str_replace_edit]_

_[tool: show_html]_

_[tool: ready_for_verification]_

أضفت الشاشة داخل نظام الحضور والانصراف: عنصر جانبي جديد **"🧾 تقرير إجمالي اليوميات"** يفتح تقرير A4 عمودي (`@page a4p`) مع فلاتر (من/إلى، المشروع، المقاول، المنطقة) وزرّي طباعة وتصدير PDF مخفيين عند الطباعة — البيانات محسوبة فعليًا من السراكي: عدد اليوميات المميزة + القيمة المستحقة (ساعات + إضافي − خصم × سعر الفئة)، ١٨ سجلًا للصفحة مع ترقيم `Page x of X` وتاريخ/وقت الطباعة.

عمود **المهنة** أُضيف لكل كود (في الشاشة الجديدة وفي ملف التقرير المستقل)، والتوقيعات صارت: HR Site · محاسب الموقع · مدير المشروع.

## User

Re-running the check

## Assistant

_[tool: ready_for_verification]_

أُعيد إرسال الملف للمراجعة.

## User

Found issues — fixing…

## Assistant

_[tool: str_replace_edit]_

_[tool: ready_for_verification]_

حساب التقرير صار كسولًا (يُنفَّذ فقط عند فتح الشاشة) + مُخزَّن مؤقتًا على مفتاح الفلاتر، وبسقف ٣٦٠ سجلًا مع تنبيه لتضييق الفترة — هذا يرفع التجميد عن باقي الشاشات.

## User

Found issues — fixing…

## Assistant

_[tool: str_replace_edit]_

_[tool: ready_for_verification]_

_[tool: str_replace_edit]_

_[tool: ready_for_verification]_

حُذف عمود "الفئة" من جدول التقرير — الأعمدة الآن: م، كود العامل، اسم العامل، المهنة، عدد اليوميات، القيمة المستحقة، التوقيع/البصمة.

## User

Save as standalone HTML: `EADRS-Standalone-Source.dc.html`

## Assistant

_[tool: super_inline_html]_

_[tool: show_html]_

_[tool: get_webview_logs]_

_[tool: save_screenshot]_

_[tool: sleep]_

_[tool: save_screenshot]_

_[tool: show_html]_

_[tool: sleep]_

_[tool: eval_js]_

_[tool: sleep]_

_[tool: eval_js]_

_[tool: show_html]_

My preview webview is wedged (even a trivial page times out), so I can't screenshot-verify the bundle — the source itself loaded cleanly in the last two checks, and the bundle inlined without missing assets.

_[tool: present_fs_item_for_download]_

الملف المستقل جاهز للتحميل (1.3 ميجا، يعمل بدون إنترنت) — افتحه من الرابط أعلاه وأخبرني إن ظهرت أي مشكلة في شاشة التقرير.

## User

قم قمت بربط الصفحة التي انشاتها بالسيستم السابق ولكن يبدوا انك اغفلت الكثير من الاشياء قم بمراجعة التصميم المرفق مع التصميم الحالي واستكمل الناقص من المرفق الي الحالي بشكل احترافي دون تغيير شكل اي شئ وعلي سبيل المثال المفقود في هذا السيستم اذافه مشروع وكانت موجوده من قبل 
لذا راجع هذا مرة اخري

## Assistant

_[tool: grep]_

_[tool: run_script]_

_[tool: list_files]_

_[tool: copy_files]_

_[tool: run_script]_

_[tool: run_script]_

_[tool: run_script]_

_[tool: run_script]_

_[tool: run_script]_

_[tool: list_files]_

_[tool: list_files]_

_[tool: run_script]_

_[tool: run_script]_

_[tool: run_script]_

_[tool: grep]_

_[tool: run_script]_

_[tool: ready_for_verification]_

السبب: كنت أعدّل نسخة قديمة متفرّعة (`EADRS-Standalone-Source.dc.html`) وليس الملف الرئيسي — لذلك ظهر النظام ناقصًا (إضافة مشروع، بيانات عمل سركي بالسطور، فئات الأجر، القطاعات… إلخ).

نقلت الآن شاشة "تقرير إجمالي اليوميات" كما هي إلى الملف الرئيسي **EADRS-Prototype.dc.html** وإلى **EADRS-Export-src.dc.html** (نسخة التصدير) دون تغيير أي شيء آخر — كل ميزات المرفق موجودة كما كانت. قل لي وأُصدر نسخة HTML مستقلة محدّثة من ملف التصدير.

## User

Found issues — fixing…

## Assistant

_[tool: super_inline_html]_

_[tool: copy_files]_

_[tool: show_html]_

_[tool: sleep]_

_[tool: eval_js]_

_[tool: eval_js_user_view]_

_[tool: show_to_user]_

_[tool: eval_js_user_view]_

_[tool: present_fs_item_for_download]_

النسخة المستقلة أُعيد بناؤها من الملف الرئيسي الكامل (EADRS-Export-src) — تحتوي كل الميزات (إضافة مشروع، سطور بيانات عمل سركي، فئات الأجر، القطاعات…) بالإضافة لشاشة تقرير اليوميات. والنسخة القديمة المتفرّعة نُقلت إلى `backup/` كي لا يتكرر الالتباس.

معاينة النظام معطّلة مؤقتًا عندي (حتى صفحة فارغة تتوقف)، لذا لم أتمكن من مشاهدة الشاشة داخل الملف الرئيسي — افتح التقرير من الشريط الجانبي وأبلغني إن رأيت أي خلل.

## User

قم بعمل التعديل علي هذا السيستم "بصفتك خبير نظم معلومات موارد بشرية (HRIS) ومطور برمجيات Full-Stack محترف، أحتاج إلى تحديث الكود الحالي لنظام إدارة شؤون العاملين وعمالة المواقع. يُرجى إجراء التعديلات والتحسينات التالية بدقة عبر المكونات وقواعد البيانات ذات الصلة:

1. إدارة المشاريع وبيانات المناطق (Projects & Work Zones)
إضافة حقل "منطقة العمل / Work Zone": في نموذج إضافة مشروع جديد، أضف حقلاً مخصصاً لتحديد منطقة العمل وربطها بالمشروع.

إتاحة الحقل للمشاريع الحالية (Migration / Update): تمكين تعديل حقل "منطقة العمل" لجميع المشروعات المسجلة مسبقاً في النظام.

الربط الشامل: تأمين ربط هذه المنطقة تلقائياً في كافة الشاشات والتقارير المرتبطة بالمشروع (شاشات السركي، طباعة المستخلصات، والتقارير العامة).

2. منطق الحسابات والبيانات في "صفحة طباعة المستخلص"
ساعات العمل الأساسية: تعديل منطق احتساب ساعات العمل الرسمية لتكون 8 ساعات يومياً بدلاً من 9 ساعات، وإعادة ضبط كافة معادلات الأجر الإضافي والخصومات بناءً على هذه القاعدة.

أعمدة الحسابات: إضافة عمود خاص بـ "إجمالي ساعات وقيمة الإضافي" موازياً ومطابقاً في التنسيق لعمود "إجمالي ساعات الخصم".

ملخص الفئات في نهاية التقرير: عرض قيمة الفئة بوضوح أمام مسمى كل فئة وظيفية/عمالية في قسم الملخص الإجمالي بنهاية الصفحة.

3. واجهة المستخدم وتجربة الطباعة والتصدير (Print & UI Features)
الفلاتر الداخلية: إضافة خيارات فلترة سريعة (Table Filters) على رأس كل عمود داخل جدول مراجعة المستخلص لتسهيل التدقيق والفرز قبل الطباعة.

تصدير إكسيل: إضافة زر تصدير مباشر إلى ملف Excel (.xlsx) لبيانات صفحة المستخلص بكامل تفاصيلها.

تنسيق الطباعة (Print CSS / Pagination):

إلغاء فواصل الصفحات التلقائية بين بيانات الموظفين، بحيث تتدفق الصفوف بالتتابع دون فراغات غير مبررة.

تثبيت بلوك التوقيعات ليظهر فقط في نهاية الورقة الأخيرة من المستخلص.

اعتماد مسميات التوقيعات الثلاثة التالية:

مسؤول الموارد البشرية بالموقع (HR Site)

مدير التنفيذ (Execution Manager)

مدير المشروع (Project Manager)

4. سجل الحضور والانصراف (Attendance Log)
تاريخ ووقت الرفع (Audit Metadata): إضافة حقل واضح يُظهر الطابع الزمني لرفع البيانات: "تاريخ ووقت رفع بيانات الحضور والانصراف" (Upload Timestamp).

المطلوب برمجياً:

تقديم التعديلات موضحة ومحددة على الملفات المستهدفة (سواء الواجهات الأمامية UI، الدوال الخلفية Backend Logic، أو تحديث هيكل البيانات Schema)، مع الحفاظ على استقرار الوظائف الحالية للنظام."

## Assistant

_[tool: update_todos]_

_[tool: grep]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: grep]_

_[tool: read_file]_

_[tool: grep]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: run_script]_

_[tool: run_script]_

Now the logic layer (zones, 8‑hour basis, filters, xlsx export, timestamps).

_[tool: run_script]_

Now the sarakPrintVals rewrite (8‑hour basis, filters, zone, new stats columns) and the remaining view values.

_[tool: run_script]_

_[tool: run_script]_

Last piece: the remaining view values (zone editor rows, npZone handler, attendance timestamp label).

_[tool: run_script]_

_[tool: ready_for_verification]_

_[tool: update_todos]_

نُفِّذت التعديلات في الملف الرئيسي ونسخة التصدير:

1. **منطقة العمل** — حقل إلزامي في نموذج إنشاء مشروع + بطاقة "تحديد منطقة العمل للمشروعات المسجلة" (بحث + تعديل مباشر لأي مشروع قديم)، والمنطقة تظهر تلقائيًا في شريط بيانات العامل بالمستخلص، وترويسة صفحة إحصائيات الفئات، وملف الإكسل.
2. **أساس 8 ساعات** — الساعات المحتسبة تُقصر على 8 يوميًا وما زاد يُرحَّل إضافيًا تلقائيًا (إن لم يكن مسجّلًا)، وسعر الساعة = قيمة الفئة ÷ 8، مع بيان "أساس الاحتساب" ظاهرًا في الواجهة.
3. **الملخص** — عمود "قيمة الفئة (ج.م/ساعة)" أمام كل مهنة، وعمود "إجمالي حسابات ساعات الإضافي" موازٍ لعمود الخصم، والإجمالي العام محدَّث.
4. **الفلاتر والتصدير** — شريط فلترة أعمدة (كود/اسم/مهنة/فئة/بيان العمل + مسح) وزر "تصدير Excel (.xlsx)" يُنزّل ملفًا حقيقيًا RTL بكل التفاصيل والإحصائيات.
5. **الطباعة** — أُلغيت الفواصل بين كشوف العمال (تدفّق متتابع)، وبلوك التوقيعات صار مرة واحدة في النهاية بمسميات: مسؤول الموارد البشرية بالموقع (HR Site) · مدير التنفيذ · مدير المشروع.
6. **الحضور** — سطر "تاريخ ووقت رفع بيانات الحضور والانصراف" أعلى السجل، ويُحدَّث عند كل رفع لملف حضور (مع الوقت في جدول الملفات المرفوعة).

بعد مراجعتك، أُعيد بناء النسخة المستقلة من ملف التصدير.

## User

بصفتك محترف في تعديلات هذا السيستم قم باعتبار ان ساعات العمل هم 9 ساعات وداخلها ساعه راحه وبالتالي في حالة الاضافي يتم احتساب اجر الساعه تكون الفئة مقسومه علي 8 في حالة ورديه 9 ساعات عمل او11 في حالة وردية 12 ساعه عمل 
، وقم ايضا ب اضافة اجمالي عدد ساعات العمل وامامها اجمالي قيمتهم امام كل اسم وكل يوم 
الفئة في هذه الصفحة تكون باليومية وليس بالساعه 
وكل هذا في طباعة مستخلص سركي 
واضف علي الفلتر مثل كود الموظف اضف ايضا الدخول والخروج ورئوس الاعمده الموجوده في طباعة هذا الصفحة 
نفذ هذه الاوامر بشكل احترافي

## Assistant

_[tool: run_script]_

_[tool: run_script]_

_[tool: ready_for_verification]_

تم في شاشة طباعة مستخلص سركي:

- **نموذج الوردية**: 9 ساعات تواجد بها ساعة راحة = 8 ساعات مدفوعة · وردية 12 ساعة = 11 ساعة مدفوعة. سعر الساعة = قيمة الفئة اليومية ÷ (8 أو 11) حسب الوردية، وما زاد عن الساعات المدفوعة يُرحَّل إضافيًا.
- **الفئة** تُعرض الآن **باليومية** (في شريط بيانات العامل، وعمود الجدول، وصفحة إحصائيات الفئات)، مع إظهار "سعر الساعة المحتسب" بجوارها.
- **أعمدة جديدة**: "إجمالي ساعات العمل" وأمامها "إجمالي قيمة ساعات العمل" لكل يوم ولكل عامل في صف الإجمالي (وكذلك في ملف الإكسل).
- **الفلاتر**: أُضيفت اليوم، التاريخ، الدخول، الخروج إلى جانب الكود والاسم والمهنة والفئة وبيان العمل، مع زر مسح الفلاتر.

## User

Found issues — fixing…

## Assistant

_[tool: run_script]_

_[tool: show_html]_

_[tool: sleep]_

_[tool: eval_js]_

_[tool: save_screenshot]_

_[tool: save_screenshot]_

_[tool: eval_js]_

_[tool: eval_js]_

_[tool: ready_for_verification]_

أُصلح توكن المسافات المفقود (`--space-5`) في الملفين، وتحققت من الشاشة فعليًا بعد عودة المعاينة:

- 23 كشف عامل بتدفّق متصل + صفحة إحصائيات واحدة + بلوك توقيعات واحد بالمسميات الثلاثة.
- الأعمدة: الفئة (يومية) 128.00 · سعر الساعة المحتسب 16.00 · إجمالي ساعات العمل 8.00 · إجمالي قيمة ساعات العمل 128.00 · منطقة العمل تظهر (المقر الجديد).
- شريط الفلاتر وزر تصدير Excel يعملان في الواجهة.

ملاحظة صغيرة: بصمات مثل 07:57→16:59 تعطي إضافيًا هامشيًا (0.03 ساعة) بحكم الحساب الدقيق؛ أستطيع تقريبه لأقرب ربع ساعة أو تجاهل ما دون 15 دقيقة إن رغبت.

## User

انظر الي هذه النماذج وقم بتحليليها بشكل احترافي دون النظر الي البيانات وتجاهل البيانات ، قم بعمل هذا النموذج في هذه الصفحة "طباعة مستخلص سركي " 
واجعل الطباعة متراكمه في ورقمة  A4 مثل المرفق 
بقدر امكانياتك الاحترافية قم باستخراج وطباعة الملف علي هذا الشكل المرفق

## User

انظر الي هذه النماذج وقم بتحليليها بشكل احترافي دون النظر الي البيانات وتجاهل البيانات ، قم بعمل هذا النموذج في هذه الصفحة "طباعة مستخلص سركي " 
واجعل الطباعة متراكمه في ورقمة  A4 مثل المرفق 
بقدر امكانياتك الاحترافية قم باستخراج وطباعة الملف علي هذا الشكل المرفق

## Assistant

_[tool: run_script]_

_[tool: run_script]_

_[tool: run_script]_

_[tool: show_html]_

_[tool: eval_js]_

_[tool: sleep]_

_[tool: eval_js]_

_[tool: get_webview_logs]_

_[tool: sleep]_

_[tool: eval_js]_

_[tool: show_html]_

_[tool: run_script]_

_[tool: ready_for_verification]_

أعدت بناء "طباعة مستخلص سركي" على نموذج المرفق (سركى مجمع لعمالة مقاول):

- **ترويسة الصفحة الأولى**: شركة الشروق يمينًا · العنوان و"عن الفترة من/إلى" بالوسط · الشعار يسارًا، ثم شريط اسم المشروع/المنطقة/اسم المقاول/بدل سكن.
- **شريط بيانات العامل** (كود العامل · المهنة الافتراضية · مسلسل مُبرز · اسم العامل · بدل المنطقة · منطقة العمل) يعلو جدول أيامه.
- **أعمدة الجدول كما في النموذج**: المهنة · الفئة (يومية) · التاريخ واليوم · دخول · خروج · يومية · صافى الإضافى · الخصم · ساعات إضافية · صافى الساعات · القيمة · بيان العمل · ملاحظات · المبنى · المنطقة · الدور · كود السركى · كود الوقت.
- **شريط الإجماليات** بنص "عدد أيام عمل العامل = كود العامل … (n يوم عمل)" مع أيام معادِلة (مجموع اليومية ÷ 8) والقيمة الإجمالية.
- **طباعة متراكمة على A4**: الصفحات تُملأ بالتتابع وكشف العامل يُكمل على الصفحة التالية دون فراغات، والترويسة على الصفحة الأولى فقط، وتذييل كل ورقة: `Page N of X` · `Code: RE-CCW-001` · تاريخ ووقت الطباعة — وتنتهي النسخة بصفحة إحصائيات الفئات والتوقيعات الثلاثة.
- **الحساب**: صافى الساعات = (التواجد − ساعة راحة) بحد 8 للوردية العادية و11 لوردية 12 ساعة، والزائد صافى إضافى، وسعر الساعة = الفئة اليومية ÷ ساعات الوردية المدفوعة.

المعاينة عندي متوقفة حاليًا (حتى صفحة فارغة)، لكن الكود مُتحقَّق منه بناءً وصياغةً؛ افتح الشاشة وأخبرني بأي فرق عن النموذج.

## User

Save as standalone HTML: `EADRS-Export-src.dc.html`

## Assistant

_[tool: super_inline_html]_

