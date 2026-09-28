# طباعة مستخلص سركة

_Started 2026-09-13 10:22 UTC_

---

## User

Continuing from "طباعة سركي للاعتماد".

## Assistant

We're building an HR management system (EADRS) focused on payroll and attendance analytics for construction projects. The core need is a professional-grade tool for tracking workers, shifts, overtime, and generating official payroll attestation reports (سركي).

Key decisions made:
- National ID auto-extracts birth date, age, and governorate code
- Split data intake: worker profiles (الادارة.xlsx), check-in/out logs (CheckInOut.xlsx), and payroll summaries (عرض سراكى العمال.xlsx)
- Screen naming: "اضافة بيانات عمل سركي" (payroll detail entry) and "طباعة مستخلص سركي" (print attestation)
- Removed legacy sheets (العمالة الذاتي, IN & Out) to avoid data duplication

Current state: The system now holds 20 active staff across 6 departments, 1,335 check-in/out records (Aug 2026, 31 days), and 667 payroll entries. 14 worker codes in payroll lack matching employee profiles yet. Auto-calculation runs on employee add/edit and in the payroll print view. All screens integrated into a single standalone HTML file.

Next steps: Reconcile the 14 unmatched worker codes (add missing profiles or flag as external labor), then validate payroll calculations against actual hours and overtime ratios.

Files: EADRS-Prototype.dc.html (main source), EADRS-Standalone-Source.dc.html (deployed single-file version), الادارة.xlsx, CheckInOut.xlsx, عرض سراكى العمال.xlsx.

## User

طبق هذا البرومت علي " طباعة مستخلص سركة"

## Assistant

_[tool: grep]_

_[tool: list_files]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: grep]_

_[tool: grep]_

_[tool: read_file]_

_[tool: grep]_

_[tool: run_script]_

_[tool: grep]_

Now applying the rebuild.

_[tool: str_replace_edit]_

_[tool: dc_html_str_replace]_

_[tool: read_file]_

_[tool: grep]_

_[tool: read_file]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: show_html]_

_[tool: show_html]_

_[tool: save_screenshot]_

_[tool: get_webview_logs]_

_[tool: save_screenshot]_

_[tool: show_html]_

_[tool: sleep]_

_[tool: eval_js]_

_[tool: show_html]_

_[tool: run_script]_

_[tool: grep]_

_[tool: show_html]_

_[tool: sleep]_

_[tool: eval_js]_

_[tool: grep]_

_[tool: grep]_

_[tool: show_html]_

_[tool: eval_js]_

_[tool: run_script]_

_[tool: ready_for_verification]_

نُفِّذت المتطلبات على شاشة **طباعة مستخلص سركي** (مع زرّي الطباعة في شاشة *اضافة بيانات عمل سركي*):

**التنفيذ**
- المنطقة أصبحت فلتر فقط (حُذف عمودها)، + فلتر **من تاريخ / إلى تاريخ** + فلتر المشروع + بحث بكود/اسم العامل.
- حُذف عمود الوردية؛ فُصل **كود الموظف** عن **اسم الموظف**؛ أُضيفت أعمدة **اليوم / التاريخ / قيمة الفئة**.
- الطباعة A4 (أفقي للاتساع لـ15 عمودًا) — **كشف كل عامل في صفحة مستقلة** بشريط بياناته وصف إجماليات أسفله (أيام، ساعات، إضافي، خصم، ساعات بعد 12 ليلاً، إجمالي الاستحقاق).
- الترويسة تُظهر **المنطقة + المشروع** والفترة ورقم الصفحة.
- نموذجان: **الإدارة المالية** (عمود التوقيع) و**المكتب الفني** (عمود ملاحظات) — من الشاشتين.
- صفحة ختامية **"إحصائيات فئات"** بالأعمدة التسعة المطلوبة + صف الإجمالي العام.

**1) منطق الوردية الليلية:** الوقت يُقارن كأرقام عشرية؛ إذا كان `out ≤ in` فهي ليلية ⇒ `hours = (out+24) − in`، و«الساعات بعد 12 ليلاً» = قيمة وقت الخروج نفسه، ويُنسب يوم العمل بالكامل لتاريخ **بصمة الدخول** (لا يُنشأ صف لليوم التالي). في بياناتك الحالية لا يوجد أي سجل ليلي فعلي (0 من 667)، فالمنطق جاهز لكن غير مُختبَر بالبيانات.

**2) تحديثات الهيكل المقترحة:** `sarak` يحتاج `workerCode` منفصلًا (موجود) + `projectCode` و`categoryValue` مُجمَّدة وقت الاستحقاق (حاليًا تُشتق من `professions`/`workers` وقت الطباعة، فالتعديل اللاحق للفئة يغيّر تقارير قديمة) + حقل `crossMidnight` محسوب مسبقًا.

**3) الطباعة الشرطية:** حالة واحدة `spForm` ('fin' | 'tec') تتحكم في عنوان العمود الأخير ومصدر محتواه (فارغ للتوقيع / `record.note` للملاحظات) وفي اسم الجهة المعتمدة بخانة التوقيعات.

**ثغرات تحتاج قرارك:** (أ) سجلات السركي لا تحمل المشروع — فلتر المشروع الآن عرضي في الترويسة فقط؛ (ب) «قيمة الفئة» عُرضت بالساعة (ج.م/س) لأن الحسابات بالساعات — أخبرني إن أردتها باليومية؛ (ج) 14 كود عامل بلا ملف يظهر باسم السركي فقط؛ (د) الطباعة محدودة بـ40 صفحة للأداء.

## User

Found issues — fixing…

## Assistant

_[tool: str_replace_edit]_

_[tool: dc_html_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: ready_for_verification]_

أُصلحت الثلاث نقاط: جدول الكشف يُرقَّم الآن عبر الصفحات مع منع قطع الصف (`break-inside` مع `!important` لتجاوز قواعد الطباعة العامة)، وخلية **بيان العمل** محدودة بسطرين (النص الكامل في tooltip) فيُصبح الشهر كاملًا في صفحة واحدة، وحدّ الطباعة رُفع إلى 200 كشف فلا يسقط أي عامل في التشغيل الشهري.

## User

برجاء تحديث الشيت الذي تم رفعه قبل ذللك بالمرفق 
كما اريد منك اضافة اسم الموظف وبياناته بناء علي الكود المرفق في هذا الشيت

## Assistant

_[tool: run_script]_

_[tool: list_files]_

_[tool: copy_files]_

_[tool: run_script]_

_[tool: run_script]_

_[tool: run_script]_

_[tool: run_script]_

_[tool: run_script]_

_[tool: copy_files]_

_[tool: run_script]_

_[tool: run_script]_

_[tool: run_script]_

Now re-joining the payroll records against the expanded roster.

_[tool: run_script]_

_[tool: run_script]_

_[tool: read_file]_

_[tool: grep]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: grep]_

_[tool: ready_for_verification]_

حُدِّثت بيانات السراكي من الشيت المرفق (667 سجل، 31 يوم أغسطس 2026) وربطت بكود العامل:

- **الأسماء والبيانات** صارت حقيقية بدل «عامل 12910108»: الاسم، رقم البطاقة، المهنة، الإدارة/القسم، المشروع، الفئة، قيمة الفئة — وقد وسّعت سجل العمال من 20 إلى **687 موظفًا** (من شيت العمالة الذاتى) ليغطي أكواد السركي.
- **633 من 667 سجل** مرتبطة بملف موظف كامل. تبقّى **10 أكواد** بلا ملف في أي شيت مرفوع (12910103، 12910104، 12910118، 12916041، 12916042، 13610121، 13610161، 13610188، 13610189، 13610193) وتظهر بوسم «كود غير مسجل» بالأحمر — أرسل لي بياناتها أو أضِفها من شاشة العمال.
- **الخصم وساعات الإضافي والملاحظات وبيان العمل** من الشيت الجديد، و**الدخول/الخروج/الساعات** محسوبة من بصمات الحضور (650 سجل ببصمة، 17 بدون بصمة).
- فلتر **المشروع** في شاشة الطباعة أصبح فلترًا فعليًا (مشروعان في البيانات: المقر الادارى الجديد / القديم)، و«قيمة الفئة» تُقرأ من قيمة الفئة المسجّلة للموظف ÷ 8 ساعات عند توفرها.

## User

Found issues — fixing…

## Assistant

_[tool: str_replace_edit]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: str_replace_edit]_

_[tool: ready_for_verification]_

ضُغط ارتفاع الكشف ليطابق صفحة A4 واحدة للشهر الكامل: أسماء/مهن/بيان العمل في سطر واحد بقصّ ellipsis (النص الكامل في tooltip) فصار ارتفاع الصف ~18px، وقُلّصت الترويسة والشعار وشريط بيانات العامل وخانات التوقيع وهوامش الورقة.

## User

Save as standalone HTML: `EADRS-Prototype.dc.html`

## Assistant

_[tool: read_file]_

_[tool: run_script]_

_[tool: super_inline_html]_

_[tool: show_html]_

_[tool: get_webview_logs]_

_[tool: present_fs_item_for_download]_

الملف جاهز للتحميل — نسخة واحدة تعمل بلا إنترنت: بيانات السراكي (667 سجل) وسجل العمال (687) والبصمات والشعار كلها مضمّنة داخل الملف.

