# صفحة طباعة السركي

_Started 2026-09-20 13:34 UTC_

---

## User

complete last task please

## Assistant

## User

Resume

## Assistant

## User

Save as standalone HTML: `EADRS-Export-src.dc.html`

## Assistant

## User

Save as standalone HTML: `EADRS-Export-src.dc.html`

## Assistant

_[tool: read_file]_

_[tool: list_files]_

_[tool: grep]_

Source is already prepared. Bundling now.

_[tool: super_inline_html]_

_[tool: show_html]_

_[tool: get_webview_logs]_

_[tool: show_html]_

_[tool: get_webview_logs]_

_[tool: present_fs_item_for_download]_

الملف جاهز — نسخة مستقلة واحدة (1.4 ميجا) تعمل بدون إنترنت، والبيانات مضمّنة بداخلها.

## User

الدور والمهمة:

بصفتك مطور واجهات وتطبيقات Full-Stack محترف، أحتاج منك إجراء تعديلات محددة على "صفحة طباعة السركي" لتحسين التنسيق وتجربة الفلترة والفرز:

1. تحسين التفاف النصوص وتنسيق الخلايا (Table Cell Wrapping & Line Breaks)
خلية "بيان الأعمال" وخلية "المهنة":

ضبط خصائص الـ CSS / التنسيق بحيث يلتف النص تلقائياً داخل الخلية ويظهر كاملاً على سطرين مدمجين وواضحين دون اقتطاع (No Truncation / text-overflow) ودون الخروج عن حدود الخلية.

التأكد من ضبط الارتفاع المناسب للصف (line-height و min-height) للحفاظ على تناسق الجدول أثناء العرض وقبل الطباعة.

2. ترقية وتوسيع نظام الفلاتر (Dropdown Filters)
تحويل الفلاتر إلى قوائم منسدلة (Dropdown Lists):

تعديل فلاتر الأعمدة في الصفحة لتعتمد نمط القائمة المنسدلة (Dropdown Select) المبنية ديناميكياً من القيم المتاحة، وفقاً للنموذج المرفق بالأسفل.

إضافة خيارات فلترة جديدة:

تفعيل وإضافة فلاتر القوائم المنسدلة للأعمدة والبيانات التالية:

ساعات / قيمة الإضافي (Overtime)

ساعات / قيمة الخصم (Deductions)

الإجمالي (Total)

كود الوردية (Shift Code)

المطلوب برمجياً:

توضيح التعديلات بدقة على مستوى الـ CSS/Styling لضبط الخلايا، وتحديث كود المكون (Component) ومنطق الفلترة (Filtering Logic)، مع ضمان استقرار الصفحة عند الطباعة والتصدير.
بدون اي تغيير جوهري في السيستم فقط المطلوب

## Assistant

_[tool: grep]_

_[tool: grep]_

_[tool: grep]_

_[tool: grep]_

_[tool: read_file]_

_[tool: grep]_

_[tool: read_file]_

_[tool: grep]_

_[tool: dc_html_str_replace]_

Now the cells and the filter bar.

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: grep]_

_[tool: read_file]_

Now the logic edits.

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

Now the `spMetrics` helper and print-pagination row sizing.

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: ready_for_verification]_

تم على شاشة «طباعة سركي للاعتماد» فقط:

**الخلايا** — المهنة وبيان العمل (والملاحظات) صارت `sk-wrap`: التفاف كامل بلا اقتطاع (`white-space:normal` + `word-break` بدل `nowrap/ellipsis`)، `line-height:1.22` وارتفاع صف أدنى 20px، وعمود المهنة 70px. وللحفاظ على ثبات الطباعة، الصف الطويل يُحتسب بوحدتين عند تقسيم صفحات A4 فلا يفيض عن الصفحة.

**الفلاتر** — كل فلاتر الأعمدة صارت قوائم منسدلة تُبنى ديناميكيًا من القيم المتاحة داخل النطاق (التاريخ/المنطقة/المشروع/البحث)، والمطابقة صارت مساواة تامة بدل بحث نصي. وأُضيفت فلاتر: الإضافي، الخصم، الإجمالي، كود الوردية. «مسح الفلاتر» يعيد الجميع إلى «الكل».

النسخة المستقلة لم أُعد تصديرها — قل لي لو تريدها محدَّثة بهذه التعديلات.

## User

Found issues — fixing…

## Assistant

_[tool: grep]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: ready_for_verification]_

سبب الانهيار كان عمود «بيان العمل» بلا عرض مع `table-layout:fixed` فانضغط إلى 0px. أعطيته 120px، وضبطت الالتفاف على `overflow-wrap:break-word` (بدل كسر الحرف)، وأضفت `min-width:840px` للجدول مع تمرير أفقي داخل الورقة على الشاشة — ويُلغى كلاهما عند الطباعة.

## User

أحتاج منك إجراء تعديلات دقيقة على جدول "طباعة السركي" لتحسين تجربة الطباعة والتنسيق الداخلي للأعمدة وفقاً للمحددات التالية:

1. تكرار ترويسة الجدول عند الطباعة (Repeating Table Header)
اعتماد الترويسة المحددة أدناه كـ <thead> رسمي للجدول:

المهنة | الفئة | التاريخ | دخول | خروج | يومية | صافى الإضافى | الخصم | ساعات إضافية | صافى الساعات | القيمة | بيان العمل | ملاحظات | المبنى | المنطقة | الدور | كود السركى | كود الوقت

تطبيق قواعد الـ Print Media Query / CSS اللازمة (مثل display: table-header-group واستخدام وسوم thead القياسية) لضمان تكرار هذا الـ Header تلقائياً في أعلى كل صفحة عند تقسيم التقرير لعدة صفحات أثناء أمر الطباعة (window.print).

2. إعادة ضبط وتنسيق عمود "بيان العمل" (Work Description Cell Styling)
عرض الخلية والتفاف النص: تحديد حد أدنى/أقصى مناسب لعرض العمود مع تفعيل الالتفاف التلقائي للنص (white-space: normal و word-break: break-word) لمنع تمدد الجدول أفقياً.

المظهر والخط: ضبط المسافات الداخلية (padding)، وارتفاع السطر (line-height)، ومحاذاة النص عمودياً وأفقياً (vertical-align: middle) بحيث يظهر النص الطويل منسقاً ومنظماً داخل الخلية دون اقتطاع أو تداخل مع بقية الصفوف.

المطلوب برمجياً:

توضيح كود الـ CSS والـ HTML/JSX المحدث، وضمان استقرار الجدول وتوافقه الكامل مع معاينة الطباعة (Print Preview).

## Assistant

_[tool: dc_js_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: ready_for_verification]_

تم:

**الترويسة** — `<thead>` قياسي بالأعمدة الثمانية عشر كما هي، ويُعرض الآن `display:table-header-group` لأول جدول في **كل صفحة A4** (وليس للصفحة الأولى فقط)، فيتكرر تلقائيًا عند `window.print`. أُضيف `break-inside:avoid` للصفوف حتى لا ينقسم الصف بين صفحتين.

**بيان العمل** — خلية `sk-wrap sk-work`: عرض 120px مع `min-width:110px` / `max-width:170px` على الشاشة (بلا حد أقصى عند الطباعة)، التفاف `white-space:normal` + `word-break:break-word`، `line-height:1.3`، `padding:4px 3px`، ومحاذاة رأسية `middle` وأفقية لليمين — بلا اقتطاع وبلا تمدد أفقي للجدول.

## User

Found issues — fixing…

## Assistant

_[tool: grep]_

_[tool: read_file]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: show_html]_

_[tool: show_html]_

_[tool: get_webview_logs]_

_[tool: eval_js]_

_[tool: show_html]_

_[tool: eval_js]_

_[tool: sleep]_

_[tool: eval_js]_

_[tool: show_html]_

_[tool: sleep]_

_[tool: eval_js]_

_[tool: eval_js_user_view]_

_[tool: sleep]_

_[tool: show_html]_

_[tool: save_screenshot]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: show_html]_

_[tool: sleep]_

_[tool: eval_js]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: read_file]_

_[tool: dc_js_str_replace]_

_[tool: show_html]_

_[tool: show_html]_

_[tool: ready_for_verification]_

عالجت أسباب التعليق المحتملة (معاينتي الخاصة كانت معطّلة حتى مع ملف فارغ، فاعتمدت على المراجعة الخلفية):

- **كاش للحسابات**: قيم الإضافي/الخصم/الإجمالي/الوردية تُحسب مرة واحدة لكل نطاق في `Map` وتُعاد استخدامها في الفلترة وبناء القوائم، بدل إعادة حسابها لكل صف في كل رسم — كان هذا أثقل تغيير أدخلته.
- **حلقة التقسيم**: `rowUnits` رُفعت خارج الحلقة مع حارس للصف غير الموجود، `avail` لا تقل عن 1، تجاهل الكتل الفارغة، وسقف 400 صفحة.
- **حذف المخاطر التخطيطية**: أزلت `overflow-x:auto` من الورقة و`min-width:840px` من الجدول و`min/max-width` من خلية بيان العمل — لم تعد لازمة بعد إعطاء العمود عرضًا صريحًا 120px.

الترويسة المتكررة لكل صفحة وتنسيق خلية بيان العمل كما سبق.

## User

Found issues — fixing…

## Assistant

_[tool: dc_js_str_replace]_

_[tool: show_html]_

صحّحت بصمة الكاش لتستخدم نص `sarakAdj` كاملًا بدل طوله، فلا تبقى القيم قديمة بعد أي تعديل يدوي على الإضافي/الخصم.

معاينتي ما زالت معلّقة حتى مع ملف فارغ (`ping.dc.html`)، فلا أستطيع قياس الصفحة بنفسي. من فضلك أغلق تبويب المعاينة وأعد فتح `EADRS-Prototype.dc.html`؛ لو استمر التعليق عندك أخبرني وسأتعقّبه في كود الشاشة نفسها.

## User

في كود الوقت هنا استبدل كود الوقت بالوردية واكتب الوردية كا اسم وليس كود 
واعد تنسيق الجدول بشكل اكثر احترافيه حتي يتاسب الطباعه A4 Landscape

## Assistant

_[tool: grep]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: show_html]_

_[tool: ready_for_verification]_

تم:

- **عمود «كود الوقت» → «الوردية»** ويعرض اسم الوردية (مثل «وردية عمل العمال») بدل الكود، وفلتر القائمة المنسدلة صار بالأسماء كذلك.
- **تنسيق A4 عرضي**: أعرض الأعمدة صارت نِسبًا مئوية (مجموعها 100%) فتتمدّد بانتظام على عرض الورقة بدل البكسلات الثابتة — بيان العمل 15.5%، الملاحظات 8.5%، الوردية 8%، المهنة 8%، والأعمدة الرقمية ضيقة.
- ترويسة أوضح (وزن 700، التفاف، حدّ سفلي أثقل)، فواصل رأسية خفيفة بين الخلايا، وأرقام بعرض ثابت `tabular-nums` لتصطف القيم رأسيًا.

## User

Found issues — fixing…

## Assistant

_[tool: grep]_

_[tool: grep]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

Now the shift name in rows, metrics and options.

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: read_file]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: ready_for_verification]_

- **الوردية** تُعرض الآن دائمًا باسم من قائمة الورديات المعرّفة في السيستم («وردية عمل العمال» / «وردية عمل الأمن»)؛ لو السجل بلا كود وردية يُستنتج من مدى الحضور (12 ساعة ⇒ الأمن، غير ذلك ⇒ العمال). القائمة المنسدلة للفلتر تعرض هذه الأسماء فقط.
- **الأداء**: نتيجة شاشة الطباعة صارت محفوظة بالكامل ولا تُعاد حسابها إلا عند تغيّر فلتر أو بيانات، وبصمة الكاش صارت عدّاد تعديلات بدل `JSON.stringify` في كل رسم.

## User

Found issues — fixing…

## Assistant

_[tool: grep]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: ready_for_verification]_

أُصلحت بصمة الكاش: صارت تشمل أسعار الفئات (`catRates`)، وعدّاد تعديلات البيانات `_dataRev` (يُزاد عند حفظ تعديل أي عامل)، وعدد العمال — لكلٍّ من الذاكرة الكاملة والكاش الداخلي. كذلك خريطة `_codeToWorker` تُعاد بناؤها بعد أي تعديل عامل بدل بقائها قديمة.

ملاحظة: معاينتي ومعاينة المراجع ما زالتا معلّقتين حتى مع ملف فارغ — من فضلك أغلق تبويب المعاينة وافتحه من جديد لأتمكن من تأكيد الشكل النهائي.

## User

Found issues — fixing…

## User

Found issues — fixing…

## User

Save as standalone HTML: `EADRS-Prototype.dc.html`

## Assistant

_[tool: grep]_

_[tool: grep]_

_[tool: run_script]_

_[tool: super_inline_html]_

_[tool: present_fs_item_for_download]_

النسخة المستقلة جاهزة (1.4 ميجا) — شاملة آخر تعديلات شاشة السركي والبيانات مضمّنة بداخلها، وتعمل بلا إنترنت.

