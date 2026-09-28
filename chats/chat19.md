# واجهة نظام حضور الشروق

_Started 2026-09-27 07:28 UTC_

---

## User

Continuing from "نظام إدارة العمالة".

## Assistant

We were refining the EADRS labor management system for Sherouk General Contracting. The scope grew from 10 initial improvements to a full redesign across QR codes, Sarak entry, BOQ tracking, transfers, and executive reporting.

Key decisions made:
- QR format switched to digits-only (worker code–job code–check) for universal scanner compatibility; Arabic job names optional but may garble on USB scanners.
- Sarak grid uses parent-child rowspan pattern: work descriptions merge vertically, with one line per worker underneath showing overtime, deductions, allowances, bonus, contractor charge, and notes; daily cost = (grade value) + (overtime × day rate ÷ 8) + allowances + bonus − deduction.
- BOQ rates table (فئات المشروع) sits above items; VAT (14%) and inclusive rate calculated automatically.
- Transfer audit trail shows before/after side-by-side with changed fields highlighted; old transfers missing "before" values show "—" except project.
- Reports split into: global filter bar (date range, project, dept, sector manager); four KPI cards (labour cost vs budget, productivity, contractor attendance, scan accuracy); five tabbed reports (project spending, departments, projects, sector managers, attendance); Balanced Scorecard tied to filters.
- Shift names expanded to full Arabic (الوردية الصباحية / المسائية / الليلية) throughout.
- Column filters added to Saraks tab (search for code/worker/description, dropdowns for project/contractor/BOQ/shift).
- All screens preserve RTL, navy/slate branding (#2B3080), and LocalStorage state linkage.

Current state: All changes coded in `EADRS-Prototype.dc.html` and bundled into standalone offline file `نظام العمالة غير المنتظمة - الشروق للمقاولات.html` (1.5 MB). QR images and BOQ previews remain runtime-generated (expected). File loads with no errors; screens not yet walked through.

Open next step: Test the standalone file end-to-end. Walk through QR generation and scanning, Sarak entry with worker rowspan, BOQ rates, transfer history diff view, report filters and all five report tabs, and Excel exports. Report any freezes, data loss, or calculation errors.

Project files: `EADRS-Prototype.dc.html`, `EADRS-Export-src.dc.html`, `نظام العمالة غير المنتظمة - الشروق للمقاولات.html`

## User

"بصفتك مطور واجهات وبصريات محترف، أريدك أن تقوم بتحديث واجهة سيستم حضور وانصراف العمالة غير المنتظمة الخاص بـ شركة الشروق للمقاولات لتكون بالهوية البصرية الرسمية (تدرجات الفحمي الداكن Charcoal والزرقاء الخاصة بالمقاولات).

المتطلبات الأساسية:

إضافة زر تبديل (Toggle Switch) في الشريط العلوي (Header) يتيح للمستخدم الاختيار بين الوضع المظلم (Dark Mode) والوضع العادي/الفاتح (Normal Mode) مع حفظ الحالة.

دعم كامل للغة العربية واتجاه الصفحة (RTL).

تصميم بطاقات الإحصائيات (KPIs) وجداول بيانات العمالة بشكل أنيق واحترافي يناسب أنظمة الموارد البشرية (HR Dashboards) العالمية.

برجاء تزويدي بالكود كاملاً وجاهزاً للتشغيل."

## Assistant

_[tool: run_script]_

_[tool: run_script]_

_[tool: run_script]_

_[tool: copy_files]_

_[tool: run_script]_

_[tool: multi_screenshot]_

_[tool: show_html]_

_[tool: multi_screenshot]_

_[tool: ready_for_verification]_

_[tool: super_inline_html]_

_[tool: present_fs_item_for_download]_

طبّقت الهوية الجديدة على `EADRS-Prototype.dc.html`، وأعدت بناء النسخة المستقلة (رابط التحميل بالأعلى). لم أجرّب الواجهة بنفسي بعد، والفحص التلقائي يعمل الآن في الخلفية.

- **الوضع الداكن:** زر تبديل في الشريط العلوي، وتُحفظ الحالة المختارة على الجهاز وتبقى بعد إعادة الفتح.
- **الألوان:** الشريط الجانبي بلون فحمي دائمًا، ويظهر الشعار على خلفية بيضاء. البنود المحددة باللون الكحلي المؤسسي #2B3080، ويتحول إلى أزرق أفتح في الوضع الداكن ليبقى واضحًا.
- **البطاقات والجداول:** أعدت تصميم بطاقات المؤشرات وجداول البيانات: حدود ناعمة، وتظليل للصفوف بالتناوب، وتمييز الصف عند المرور عليه، وأرقام متساوية العرض.
- **الطباعة:** نماذج السراكي والمستخلصات تبقى على ورق أبيض حتى في الوضع الداكن.
- **الاتجاه:** الاتجاه من اليمين لليسار كما كان.

نسخة ما قبل التعديل محفوظة في `backup/`. صور رموز QR ومعاينات بنود المقايسة ما زالت تُنشأ أثناء التشغيل، وهذا متوقع.

## User

عندي نظام حضور وانصراف للعمالة غير المنتظمة خاص بشركة الشروق للمقاولات (Dar Group). المطلوب تعديل التصميم الجرافيكي للنظام الأساسي بالكامل، من غير أي تغيير في الوظائف أو البيانات أو هيكل الصفحات.

مرفق:
1) لقطة من التصميم المطلوب (تصميم_الشروق_v6.png): دي المرجع البصري الأساسي.
2) صورتين لمبنى الشركة بعد التنظيف: تُستخدم في خلفية الـ Hero.
3) ملف ألوان وتنسيق (brand-theme-v3.css): للاسترشاد بالقيم.

الهوية والألوان (مأخوذة من اللوجو):
- كحلي أساسي #2E3192، وكحلي غامق #1C1F66
- رمادي فحمي #2B2B2E، وللقائمة الجانبية #1E1E21
- خلفية الصفحة #EEF0F4، وعليها شبكة خفيفة زي ورق الرسم الهندسي
- أصفر السلامة #F2A900: للتمييز والتنبيهات فقط
- أحمر #B3261E: للغياب والنسب الضعيفة فقط
- الخط: IBM Plex Sans Arabic، والأرقام tabular

القائمة الجانبية (يمين، RTL):
- خلفية فحمي غامق، وفوقها شريط مخطط أصفر وأسود بعرض 6px زي شريط السلامة
- اللوجو داخل كارت أبيض، حوافه مدورة 4px، وتحته خط كحلي
- العنصر النشط: خلفية كحلي، نص أبيض، وخط أصفر 3px على الجانب
- الـ hover: خلفية أفتح شوية وخط بنفسجي فاتح على الجانب

منطقة الـ Hero أعلى كل صفحة (ارتفاعها حوالي 300px):
- صورتا المبنى بالتبادل (crossfade) كل 9 ثوانٍ تقريبًا
- حركة Ken Burns بطيئة (zoom من 1.05 لـ 1.18) مع ميل rotateY ±4 درجات، عشان يبان عمق 3D
- Parallax خفيف يتبع حركة الماوس
- طبقة كحلي متدرجة: غامقة ناحية العنوان (يمين) وتخف ناحية المبنى (شمال) عشان المبنى يبان
- لمعة ضوء تعدي على الواجهة الزجاج كل 7 ثوانٍ
- شبكة هندسية بمنظور 3D في الأرض بتتحرك لقدّام
- نقط صفرا صغيرة بتطلع لفوق ببطء (زي غبار الموقع)
- شريط سلامة أصفر وأسود متحرك في أسفل الـ Hero
- نص صغير بالإنجليزي: "DAR GROUP · ALSHOROUK CONSTRUCTION — FIELD WORKFORCE MANAGEMENT"
- عنوان الصفحة بالأبيض فوق الصورة، وجنبه خط أصفر عمودي
- زراير التصدير (Excel وPDF) شفافة بإطار أبيض، وتتلوّن أصفر مع الـ hover
- احترام prefers-reduced-motion (إيقاف الحركة)

الكروت:
- بيضاء، حوافها 4px، وظل خفيف
- الصف الأول من المؤشرات (KPIs) يطلع فوق حافة الـ Hero السفلية، وعليه ظل أوضح
- كروت KPI فوقها خط كحلي 3px، والأرقام بالكحلي الغامق وبخط عريض
- زرار الإغلاق (×) صغير ورمادي، ويتلوّن أحمر مع الـ hover

الجداول:
- رأس الجدول فحمي غامق بنص أبيض
- الصفوف متبادلة الألوان (zebra)، ومع الـ hover كحلي فاتح جدًا

المطلوب:
طبّق الهوية دي على كل شاشات النظام (لوحة التحكم، العمال، المقاولون، السراكي، التقارير، إلخ)، مش لوحة التحكم بس. وحافظ على الاتجاه RTL، وعلى كل الوظائف والبيانات الحالية.

## User

عندي نظام حضور وانصراف للعمالة غير المنتظمة خاص بشركة الشروق للمقاولات (Dar Group). المطلوب تعديل التصميم الجرافيكي للنظام الأساسي بالكامل، من غير أي تغيير في الوظائف أو البيانات أو هيكل الصفحات.

مرفق:
1) لقطة من التصميم المطلوب (تصميم_الشروق_v6.png): دي المرجع البصري الأساسي.
2) صورتين لمبنى الشركة بعد التنظيف: تُستخدم في خلفية الـ Hero.
3) ملف ألوان وتنسيق (brand-theme-v3.css): للاسترشاد بالقيم.

الهوية والألوان (مأخوذة من اللوجو):
- كحلي أساسي #2E3192، وكحلي غامق #1C1F66
- رمادي فحمي #2B2B2E، وللقائمة الجانبية #1E1E21
- خلفية الصفحة #EEF0F4، وعليها شبكة خفيفة زي ورق الرسم الهندسي
- أصفر السلامة #F2A900: للتمييز والتنبيهات فقط
- أحمر #B3261E: للغياب والنسب الضعيفة فقط
- الخط: IBM Plex Sans Arabic، والأرقام tabular

القائمة الجانبية (يمين، RTL):
- خلفية فحمي غامق، وفوقها شريط مخطط أصفر وأسود بعرض 6px زي شريط السلامة
- اللوجو داخل كارت أبيض، حوافه مدورة 4px، وتحته خط كحلي
- العنصر النشط: خلفية كحلي، نص أبيض، وخط أصفر 3px على الجانب
- الـ hover: خلفية أفتح شوية وخط بنفسجي فاتح على الجانب

منطقة الـ Hero أعلى كل صفحة (ارتفاعها حوالي 300px):
- صورتا المبنى بالتبادل (crossfade) كل 9 ثوانٍ تقريبًا
- حركة Ken Burns بطيئة (zoom من 1.05 لـ 1.18) مع ميل rotateY ±4 درجات، عشان يبان عمق 3D
- Parallax خفيف يتبع حركة الماوس
- طبقة كحلي متدرجة: غامقة ناحية العنوان (يمين) وتخف ناحية المبنى (شمال) عشان المبنى يبان
- لمعة ضوء تعدي على الواجهة الزجاج كل 7 ثوانٍ
- شبكة هندسية بمنظور 3D في الأرض بتتحرك لقدّام
- نقط صفرا صغيرة بتطلع لفوق ببطء (زي غبار الموقع)
- شريط سلامة أصفر وأسود متحرك في أسفل الـ Hero
- نص صغير بالإنجليزي: "DAR GROUP · ALSHOROUK CONSTRUCTION — FIELD WORKFORCE MANAGEMENT"
- عنوان الصفحة بالأبيض فوق الصورة، وجنبه خط أصفر عمودي
- زراير التصدير (Excel وPDF) شفافة بإطار أبيض، وتتلوّن أصفر مع الـ hover
- احترام prefers-reduced-motion (إيقاف الحركة)

الكروت:
- بيضاء، حوافها 4px، وظل خفيف
- الصف الأول من المؤشرات (KPIs) يطلع فوق حافة الـ Hero السفلية، وعليه ظل أوضح
- كروت KPI فوقها خط كحلي 3px، والأرقام بالكحلي الغامق وبخط عريض
- زرار الإغلاق (×) صغير ورمادي، ويتلوّن أحمر مع الـ hover

الجداول:
- رأس الجدول فحمي غامق بنص أبيض
- الصفوف متبادلة الألوان (zebra)، ومع الـ hover كحلي فاتح جدًا

المطلوب:
طبّق الهوية دي على كل شاشات النظام (لوحة التحكم، العمال، المقاولون، السراكي، التقارير، إلخ)، مش لوحة التحكم بس. وحافظ على الاتجاه RTL، وعلى كل الوظائف والبيانات الحالية.

## Assistant

_[tool: list_files]_

_[tool: run_script]_

_[tool: image_metadata]_

_[tool: run_script]_

_[tool: run_script]_

_[tool: run_script]_

_[tool: run_script]_

_[tool: run_script]_

_[tool: copy_files]_

_[tool: run_script]_

_[tool: ready_for_verification]_

_[tool: super_inline_html]_

_[tool: run_script]_

_[tool: super_inline_html]_

_[tool: str_replace_edit]_

_[tool: super_inline_html]_

_[tool: ready_for_verification]_

The new identity is now applied to every screen in `EADRS-Prototype.dc.html`. I also rebuilt the standalone file, `نظام العمالة غير المنتظمة - الشروق للمقاولات.html`. A checker found the English line in the header overlapping the Excel/PDF buttons at medium widths. I fixed it and rebuilt the standalone again, and that check is running now.

**What's missing from your attachments:** Only one photo of the building arrived. The reference screenshot, the second photo and `brand-theme-v3.css` never came through. For now the header crossfades between two different crops of the same photo, and I worked from your written specs instead of the reference design. Send the rest and I'll match them.

**Things that behave differently from before:**
- **Page titles:** Each screen's title and subtitle now sit inside the header over the photo. The old title at the top of each screen is hidden on screen but still appears when printing.
- **Dashboard:** Its old description line under the title now shows as the header subtitle.
- **Print pages:** Saraks and statements that print on paper keep their original look.

**Other notes:**
- **Standalone file size:** The standalone file grew to 6.9 MB because the building photo is a 4 MB PNG. A compressed JPEG would shrink it a lot, but I couldn't convert it here.
- **Unchanged:** The dark mode switch, RTL layout, functions and data are the same as before.
- **Backup:** The previous version is saved as `backup/EADRS-Prototype-before-hero.dc.html`.

## User

Found issues — fixing…

## Assistant

_[tool: str_replace_edit]_

_[tool: super_inline_html]_

_[tool: ready_for_verification]_

صلّحت تجمّد الصفحة اللي ظهر بعد تعديل الواجهة الأخيرة، وأعدت بناء النسخة المستقلة. الفحص التلقائي شغال دلوقتي، ولسه ما اتأكدتش إن الصفحة بقت بتستجيب.

- **التجمّد:** ألغيت آخر تغيير في طريقة احتساب عرض منطقة المحتوى، وده الأرجح إنه كان السبب.
- **تداخل السطر الإنجليزي مع الأزرار:** العنوان والسطر الإنجليزي بقوا يبدأوا تحت صف أزرار Excel وPDF، فمش هيتداخلوا معاها تاني.
- **الشاشات الأضيق:** على أي شاشة عرضها أقل من 1200px، نص الـ Hero بقى ياخد عرض المنطقة كلها.

## User

Found issues — fixing…

## Assistant

_[tool: run_script]_

_[tool: run_script]_

_[tool: run_script]_

_[tool: ready_for_verification]_

_[tool: update_todos]_

_[tool: grep]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: grep]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

Now the bcCards logic and contractors screen.

_[tool: grep]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: grep]_

_[tool: grep]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: grep]_

_[tool: read_file]_

_[tool: grep]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

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

_[tool: read_file]_

_[tool: grep]_

_[tool: copy_files]_

_[tool: run_script]_

_[tool: run_script]_

_[tool: run_script]_

_[tool: run_script]_

_[tool: run_script]_

_[tool: write_file]_

_[tool: ready_for_verification]_

_[tool: update_todos]_

طبّقت كل البنود الخمسة على `EADRS-Prototype.dc.html`، وكتبت هيكل قاعدة البيانات وواجهات الـ API في `EADRS-Schema.md`. لم أجرّب الشاشات بنفسي بعد؛ الفحص التلقائي يعمل الآن، ولم أُعِد بناء النسخة المستقلة بعد.

**ملف الـ Schema والـ API:** فيه تعديلات الجداول (PostgreSQL)، والفهرس الفريد للثلاثية (المشروع + المهنة + الرقم القومي)، وحساب نهاية أمر الشغل تلقائيًا بعد شهرين. فيه أيضًا جدول جديد لتعديلات الوظائف، وأكواد Node/Express لنقاط الإضافة والمسح والطباعة.

**ما تغيّر في النظام:**
- **العامل:**
  - حقل «تاريخ نهاية أمر الشغل» يُملأ افتراضيًا بشهرين من أول يوم عمل.
  - كل الحقول وملف أمر الشغل إلزامية، وزر الحفظ يظل معطّلًا مع سطر يوضح الناقص.
  - أُضيف عمود نهاية أمر الشغل في جدول العمال.
- **العامل غير النشط:** يُستبعد كارته من الطباعة ويظهر بدون باركود. أي مسح أو تسجيل يدوي له يُرفض برسالة واضحة.
- **الكارت:** الاسم رباعي والوظيفة، ثم جدول (الكود | المقاول / الرقم القومي | المشروع)، ثم الباركود، ثم تاريخ البداية والنهاية.
- **المقاولون:**
  - بحث مع اقتراحات تلقائية للقطاع والمشروع والمقاول، ويُطبَّق على كل جداول الشاشة.
  - حقل كود الحساب.
  - جدول العمال عليه فلتر، والضغط على أي عامل يفتح نافذة بتفاصيله: البيانات والصورة والباركود والحضور والملخص المالي.
- **شاشة تعديل وظائف العمال:** شاشة جديدة في القائمة الجانبية، تعرض الفئة القديمة بجانب الجديدة مع المقارنة وتاريخ الاستحقاق. ترفض التعديل لو تكررت الثلاثية.
- **المشروعات:**
  - خانة «الكمية» في فئات المشروع.
  - جدول بدل السكن والمواصلات لكل مقاول، وحذفت الحقلين من نموذج المشروع.
  - زرّا حذف (أعلى) وتعديل (أسفل) لكل فئة وبند.
  - عند اختيار بيان البند من فئات المشروع تُملأ الوحدة والكمية والفئة تلقائيًا.
- **السراكي:**
  - «بيان الأعمال» صار قائمة منسدلة وتقبل الكتابة اليدوية.
  - بنود المقايسة تُفلتر حسب المقاول وتعرض المطلوب والمنفذ والمتبقي.
  - أُضيف «كود السركي» في طباعة المستخلص.

**ملاحظات:**
- الإضافات الجديدة (نهاية أمر الشغل، صورة البطاقة، تعديلات الوظائف) لا تُحفظ بعد إعادة تحميل الصفحة، مثل تعديلات العمال الحالية.
- حساب الملخص المالي في نافذة العامل تقديري. الراتب الشهري = اليومية × 26 يومًا، والإضافي والخصم من ساعات البصمة (يوم العمل 8 ساعات بعد خصم ساعة راحة) مع قيم السراكي.
- معنى «حذف لأعلى مع تعديل لأسفل» فسّرته بمكان الزرّين؛ لو كنت تقصد شيئًا آخر قل لي.

النسخة السابقة محفوظة في `backup/EADRS-Prototype-before-v3rules.dc.html`.

## User

Found issues — fixing…

## Assistant

_[tool: show_html]_

_[tool: run_script]_

_[tool: show_html]_

_[tool: show_html]_

_[tool: run_script]_

_[tool: show_html]_

_[tool: sleep]_

_[tool: save_screenshot]_

_[tool: show_html]_

_[tool: read_file]_

_[tool: write_file]_

_[tool: show_html]_

_[tool: delete_file]_

_[tool: eval_js_user_view]_

_[tool: screenshot_user_view]_

_[tool: super_inline_html]_

I still can't confirm the page works, because the preview itself isn't responding right now, even for pages that aren't the system. I tried the current version, the versions before the hero and before the theme, a one-line test page, and a blank HTML file. All timed out the same way, and your live preview doesn't respond either.

So the freeze the checker reported probably isn't caused by my recent changes. If it were a code problem, the versions from before them and the blank file would still load.

I rebuilt the standalone file with all of this turn's changes: `نظام العمالة غير المنتظمة - الشروق للمقاولات.html`. Please open it directly in your browser, outside the preview, and tell me:
- Does the page freeze?
- Do these work: the end-of-work-order date on the worker form, the new worker card, the contractor filters and worker pop-up, and the worker job-change screen?

If it does freeze in the browser, the first suspect is the moving 3D effect on the building photo, which is also still a heavy 4 MB image. I'd switch it to a still, compressed photo right away.

