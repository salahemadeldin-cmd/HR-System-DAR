# # El Shorouk Labor Management System

_Started 2026-09-13 13:24 UTC_

---

## User

Continuing from "طباعة مستخلص سركة".

## Assistant

We're building an HR management system (EADRS) focused on payroll and attendance analytics for construction projects. The core need is a professional-grade tool for tracking workers, shifts, overtime, and generating official payroll attestation reports (سركي).

Key decisions made:
- Rebuilt "طباعة مستخلص سركي" screen with A4 horizontal layout, one worker per page with full-month data compressed into single sheet.
- Night shift logic: if checkout ≤ checkin (decimal comparison), hours = (checkout+24) − checkin; midnight-crossing hours tracked separately; entire day assigned to checkin date.
- Worker roster expanded from 20 to 687 staff by merging العمالة الذاتى sheet; payroll records (667) now auto-linked to full employee profiles (name, ID, profession, department, project, category value).
- Two print forms: Finance (توقيع) and Technical (ملاحظات) — controlled by single `spForm` flag.
- Row height compressed to ~18px, ellipsis on long text (full text in tooltip), print limit raised to 200 records.

Current state: 633 of 667 payroll records matched to employee profiles. 10 worker codes remain unregistered (12910103, 12910104, 12910118, 12916041, 12916042, 13610121, 13610161, 13610188, 13610189, 13610193) shown in red. Project filter now functional (المقر الادارى الجديد / القديم). Category value calculated per hour (annual salary ÷ 8). System exported as single offline-capable HTML file.

Next steps: Supply data for 10 missing worker codes, or flag as external labor. Test night-shift logic with actual overnight records (currently 0 of 667).

Files: EADRS-Prototype.dc.html, نظام السراكي - الشروق للمقاولات (نسخة مستقلة).html, عرض سراكى العمال-f30dcd22.xlsx.

## User

Act as an Expert Full-Stack Developer and UI/UX Specialist. I am the Manager of Organizational Development and Labor System Development at "El Shorouk Construction Company" (شركة الشروق للمقاولات). I have designed a highly efficient management system for site workers and employees, and I need you to write the code and implement the logic for the following critical system updates and features.

Objective:
Upgrade specific modules in the Labor Management System focusing on UI matching, relational database logic, state management, and financial settlements.

Here are the detailed technical requirements:

1. UI/UX Revamp ("إضافة بيانات عمل سركي" Module):

I have attached an image of the desired UI. Completely rebuild the frontend of the "إضافة بيانات عمل سركي" (Add Sirky Work Data) page to identically match this attached image. Ensure the design is professional, responsive, and user-friendly.

2. Projects & Allowances Module ("البدلات والمشروعات"):

Enable the creation of new projects from this page.

Implement robust relational data binding: the new project must be integrated professionally with all other departments. Ensure all its specific data fields can be recorded and mapped exactly like existing projects in the system.

3. Dependent Dropdowns (Categories & Professions):

Update the UI and backend logic to link Professions (المهن) exclusively to their respective Departments (الإدارات).

Implement a cascading dropdown effect: When a user selects a specific "Department", the "Profession" dropdown must dynamically filter to show ONLY the professions belonging to that department, preventing cross-department errors.

4. State Management for Subcontractors (المقاولين):

Add a status toggle or field (Active / Inactive) for Contractors/Subcontractors, replicating the exact logic currently used for direct Employees.

5. Contractor Registration & Validation Flow:

When adding a new Contractor, make the "National ID" (رقم البطاقة) a mandatory unique field for tracking.

Duplicate Check: If the entered National ID already exists in the database, trigger an alert/notification, and auto-populate the rest of the form with the existing data.

File Uploads: Add functionality to upload official documents as images (e.g., Bill of Quantities "مقايسة", Commercial Register "سجل تجاري", or ID scans).

Add a multi-line text area for "Notes" (ملاحظات) as free space for additional details.

6. Employee Transfer Workflow:

Standardize the employee transfer process (from one site/project to another) to follow a strict sequential selection flow:
Step 1: Select Sector (القطاع) -> Step 2: Select Project (المشروع) -> Step 3: Select Worker (العامل).

7. Dynamic Category Rate Updates (تغيير قيمة الفئات):

When a user edits the financial value/rate of a category, trigger a confirmation prompt (Modal/Dialog).

The prompt must ask the user: "Apply this rate change to ALL projects?" OR "Apply to this specific entry only?". Execute the database update dynamically based on the user's choice.

8. Dynamic Worker Coding (التكويد الديناميكي):

When a worker is transferred to a new project, the system must automatically generate and assign a new unique code for that worker, strictly adhering to the system's predefined coding rules/prefixes for the destination project.

9. Financial Settlements Logic (المستخلصات):

Ensure strict financial separation between projects.

Calculate the settlement (المستخلص) for the period the worker spent in the Old Project using their Old Project Code.

Calculate the settlement for the period in the New Project using the New Project Code. Both records must be processed independently without overlapping.

Output format required:
Please provide the necessary frontend code, backend logic, and database schema updates (specify the tech stack if needed) to achieve these 9 points efficiently. Break down your solution step-by-step.

## Assistant

_[tool: run_script]_

## User

Resume

## Assistant

_[tool: run_script]_

_[tool: list_files]_

_[tool: copy_files]_

_[tool: run_script]_

_[tool: run_script]_

_[tool: grep]_

_[tool: run_script]_

_[tool: read_file]_

_[tool: run_script]_

_[tool: run_script]_

_[tool: run_script]_

_[tool: run_script]_

_[tool: run_script]_

_[tool: grep]_

_[tool: grep]_

Now implementing all nine changes.

_[tool: run_script]_

_[tool: run_script]_

Now the contractor and transfer views.

_[tool: run_script]_

_[tool: run_script]_

_[tool: run_script]_

_[tool: run_script]_

_[tool: run_script]_

_[tool: show_html]_

_[tool: get_webview_logs]_

_[tool: show_html]_

_[tool: get_webview_logs]_

_[tool: save_screenshot]_

_[tool: eval_js]_

_[tool: show_html]_

_[tool: sleep]_

_[tool: eval_js]_

_[tool: run_script]_

_[tool: run_script]_

_[tool: run_script]_

_[tool: run_script]_

_[tool: show_html]_

_[tool: eval_js]_

_[tool: show_html]_

_[tool: eval_js]_

_[tool: save_screenshot]_

_[tool: show_html]_

_[tool: sleep]_

_[tool: save_screenshot]_

_[tool: show_html]_

_[tool: save_screenshot]_

_[tool: run_script]_

_[tool: delete_file]_

_[tool: ready_for_verification]_

نُفِّذت النقاط التسع داخل `EADRS-Prototype.dc.html`:

1. **بيان أعمال سركى** — أُعيد بناء الشاشة كمطبوعة مطابقة للصورة: ترويسة الشركة والشعار، حقول (اسم المشروع/المشرف/كود السركى/التاريخ)، شريط (رقم البند فى المقايسة · المنطقة · المبنى · الدور · اسم المقاول)، جدول أسطر العمال بأعمدته السبعة، سطر التوقيعات الأربعة، وصندوق التعليمات. الحقول التشغيلية (القطاع/الإدارة/الوردية/الدخول/الخروج) فى شريط منفصل أسفل المطبوعة.
2. **إنشاء مشروع** من شاشة البدلات والمشروعات — يُسجَّل بالقطاع وكود موقع تلقائى وبادئة أكواد عماله، ويظهر فورًا فى كل القوائم المنسدلة بالنظام.
3. **المهن مرتبطة بالإدارات** من ملف «المهن و الفئات» (195 سطرًا، 10 إدارات) — اختيار الإدارة يُرشِّح المهن، وقيمة الدرجة تُملأ تلقائيًا؛ مطبَّق فى شاشة المهن وشاشة النقل وبيان السركى.
4. **حالة المقاول** نشط/غير نشط مثل الموظفين، بزر تبديل فى بطاقة المقاول.
5. **رقم البطاقة إلزامى وفريد** (14 رقمًا) مع تنبيه واستدعاء تلقائى للبيانات عند التكرار، ورفع مستندات (مقايسة/سجل تجارى/صورة بطاقة) وخانة ملاحظات.
6. **النقل** بتسلسل صارم: القطاع ← المشروع ← العامل.
7. **تغيير قيمة الفئة** يفتح نافذة تأكيد: كل المشروعات أم مشروع واحد فقط، مع سجل للتغييرات.
8. **تكويد تلقائى** للعامل عند النقل ببادئة المشروع الجديد.
9. **فصل المستخلصات** — جدول يوضّح الكود القديم/المشروع القديم حتى تاريخ النقل والكود الجديد بعده، دون تداخل.

ملاحظة: معاينة هذا الملف ثقيلة جدًا فى بيئتى ولم تستجب للقطة الشاشة (نفس السلوك مع النسخة القديمة قبل التعديل)، فتحقّق من الشاشات عندك — خاصة شاشة السركى — وأبلغنى بأى فرق عن المطبوعة.

## User

استبدل جميع الادارات الموجوده في النظام الي الادارات المرفقه فقط لا غير "H.S.E
الامن الادارى
التنفيذ اعتيادى
السكن
الصيانة والمعدات
المخازن
المساحة
تنفيذ الالكتروميكانيك
مكتب فنى اعتيادى
مكتب فنى الكتروميكانيك
"
اضافة "بدل سكن " و "بدل مواصلات " في اضافة المقاولين لتضاف الي البدلات الخاصه بالمقاولين "

## Assistant

_[tool: grep]_

_[tool: run_script]_

_[tool: run_script]_

_[tool: run_script]_

_[tool: run_script]_

_[tool: ready_for_verification]_

تم:

**الإدارات** — النظام صار يعرف عشر إدارات فقط: H.S.E · الامن الادارى · التنفيذ اعتيادى · السكن · الصيانة والمعدات · المخازن · المساحة · تنفيذ الالكتروميكانيك · مكتب فنى اعتيادى · مكتب فنى الكتروميكانيك. أضفت دالة توحيد تُرجِع أى مسمى قديم (الكهرباء، الكهروميكانيك، عمالة مقاولين، الأمن، الشئون الإدارية…) إلى ما يقابله من العشرة، وتُطبَّق على العمال المحمّلين من البيانات وعلى المهن وعند الإضافة والتعديل والنقل. قوائم بدل المنطقة صارت من نفس القائمة (المستحقة: H.S.E · الامن الادارى · السكن · الصيانة والمعدات · المخازن · المساحة · تنفيذ الالكتروميكانيك).

**بدلات المقاولين** — حقلا «بدل السكن» و«بدل المواصلات» فى نموذج إضافة المقاول مع إجمالى يومى تلقائى، ويُحفظان مع المقاول ويظهران فى بطاقته، ويُستدعيان تلقائيًا عند تكرار رقم البطاقة. وأضفت فى شاشة البدلات والمشروعات جدول «بدلات المقاولين» لتعديل القيمتين لكل مقاول مباشرة.

الإدارتان «مكتب فنى اعتيادى/الكتروميكانيك» غير مستحقتين لبدل المنطقة حاليًا — قل لى إن أردت ضمّهما.

## User

Found issues — fixing…

## Assistant

_[tool: run_script]_

_[tool: show_html]_

_[tool: eval_js]_

_[tool: list_files]_

_[tool: show_html]_

_[tool: run_script]_

_[tool: show_html]_

_[tool: eval_js]_

_[tool: run_script]_

_[tool: show_html]_

_[tool: eval_js]_

_[tool: run_script]_

_[tool: show_html]_

_[tool: eval_js]_

_[tool: run_script]_

_[tool: show_html]_

_[tool: eval_js]_

_[tool: run_script]_

_[tool: show_html]_

_[tool: eval_js]_

_[tool: run_script]_

_[tool: run_script]_

_[tool: run_script]_

_[tool: run_script]_

_[tool: delete_file]_

_[tool: ready_for_verification]_

بحثت عن سبب التجمّد بالتنصيف: التجمّد **ليس من تعديلات اليوم** — نسخة أغسطس الاحتياطية (`backup/EADRS-Prototype-withdata-2026-08-31.dc.html`) تتجمّد بنفس الطريقة حتى بعد تعطيل تحميل البيانات وتفريغ شاشة السركى وتفريغ `renderVals` تمامًا. ولا يوجد أى حلقة لا نهائية ولا `setState` أثناء الرسم فى الكود.

التفسير المرجَّح: ثقل إعادة الرسم — كان كل رسم يعيد حساب مستخلصات 667 سجلًا وجداول كل الشاشات معًا. فقيّدت العمليات الثقيلة بالشاشة النشطة فقط: مستخلص السركى، جدول السراكى، قوائم المقاولين وعمالهم، قوائم النقل، وأسطر بيان السركى.

ملاحظة: جسر التنفيذ فى بيئتى معطّل تمامًا الآن (حتى صفحة `ping` لا تستجيب لى)، فلا أستطيع رؤية النتيجة بنفسى — التحقّق جارٍ فى الخلفية. لو استمر التجمّد عندك، أخبرنى وسأنقل التطبيق إلى بناء أخفّ (تقسيم الشاشات إلى مكوّنات منفصلة بدل قالب واحد ضخم).

## User

Save as standalone HTML: `EADRS-Prototype.dc.html`

## Assistant

_[tool: run_script]_

_[tool: super_inline_html]_

_[tool: show_html]_

_[tool: get_webview_logs]_

_[tool: present_fs_item_for_download]_

النسخة المستقلة جاهزة للتحميل — ملف واحد يعمل بدون إنترنت، بداخله كل البيانات (667 سجل سركى، 687 عاملاً، 195 مهنة) والشعار والتنسيقات.

