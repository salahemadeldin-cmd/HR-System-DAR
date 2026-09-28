# EADRS — هيكل البيانات (Schema) + واجهات API — إصدار v3

> قواعد الإصدار v3: أمر الشغل وتاريخ نهايته · الإلزامية · حالة «غير نشط» · كارت العامل · فلاتر المقاولين ونافذة العامل · منع التكرار الثلاثي · شاشة تعديل وظائف العمال · كمية الفئات · بدلات المقاول · كود السركى · تعديل/حذف البنود.

---

## 1) تعديلات قاعدة البيانات (PostgreSQL)

```sql
-- العمال: أمر الشغل وتواريخه + صورة البطاقة + الحالة
ALTER TABLE workers
  ADD COLUMN reg_date        DATE        NOT NULL,              -- تاريخ أمر الشغل
  ADD COLUMN start_date      DATE        NOT NULL,              -- أول يوم عمل
  ADD COLUMN end_date        DATE        NOT NULL,              -- نهاية أمر الشغل (افتراضى +2 شهر)
  ADD COLUMN work_order_file TEXT        NOT NULL,              -- مسار ملف أمر الشغل (إلزامى)
  ADD COLUMN card_image      TEXT,                              -- صورة البطاقة الشخصية
  ADD COLUMN status          VARCHAR(10) NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  ALTER COLUMN name          SET NOT NULL,
  ALTER COLUMN national_id   SET NOT NULL,
  ADD CONSTRAINT chk_nid   CHECK (national_id ~ '^[0-9]{14}$'),
  ADD CONSTRAINT chk_dates CHECK (end_date >= start_date);

-- الافتراض: نهاية أمر الشغل = أول يوم عمل + شهرين إذا لم تُحدَّد
CREATE OR REPLACE FUNCTION workers_default_end() RETURNS trigger AS $$
BEGIN
  IF NEW.end_date IS NULL THEN NEW.end_date := NEW.start_date + INTERVAL '2 months'; END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;
CREATE TRIGGER trg_workers_end BEFORE INSERT OR UPDATE ON workers
  FOR EACH ROW EXECUTE FUNCTION workers_default_end();

-- منع التكرار الثلاثى: (المشروع + المهنة + الرقم القومى)
CREATE UNIQUE INDEX uq_worker_project_job_nid ON workers (project_code, job_code, national_id);

-- المقاولون: كود الحساب + بدلات السكن والمواصلات لكل مقاول
ALTER TABLE contractors
  ADD COLUMN account_code VARCHAR(30),
  ADD COLUMN housing_allowance   NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN transport_allowance NUMERIC(10,2) NOT NULL DEFAULT 0;

-- المشروعات: حذف بدل السكن وقيمة المقايسة من المقايسة العامة (أصبحا لكل مقاول)
ALTER TABLE projects DROP COLUMN housing_allowance, DROP COLUMN boq_value;
ALTER TABLE projects ADD COLUMN boq_drawing TEXT;               -- رسم المقايسة العام (ملف)

-- فئات المشروع: خانة الكمية بجوار الوحدة
ALTER TABLE project_rates ADD COLUMN qty NUMERIC(14,3) NOT NULL DEFAULT 0;

-- بنود المقايسة: ربط اختيارى بالمقاول (القطاع مشتق من المشروع)
ALTER TABLE boq_items ADD COLUMN contractor_code VARCHAR(12) REFERENCES contractors(code);

-- السراكى: كود السركى على الرأس + بيان الأعمال من قائمة مع إدخال يدوى
ALTER TABLE sarak_works ADD COLUMN sarak_code VARCHAR(20) NOT NULL;
CREATE TABLE work_statements (id SERIAL PRIMARY KEY, project_code VARCHAR(10), text TEXT NOT NULL, UNIQUE(project_code, text));

-- تعديل وظائف العمال (بتاريخ استحقاق — لا يُمحى القديم)
CREATE TABLE job_changes (
  id          SERIAL PRIMARY KEY,
  worker_code VARCHAR(12) NOT NULL REFERENCES workers(code),
  sector_code VARCHAR(10), dept VARCHAR(60) NOT NULL, project_code VARCHAR(10) NOT NULL,
  old_job     VARCHAR(80) NOT NULL, old_grade CHAR(1) NOT NULL, old_value NUMERIC(10,2) NOT NULL,
  new_job     VARCHAR(80) NOT NULL, new_grade CHAR(1) NOT NULL, new_value NUMERIC(10,2) NOT NULL,
  due_date    DATE NOT NULL,                                      -- تاريخ الاستحقاق
  notes       TEXT,
  created_by  INT, created_at TIMESTAMPTZ DEFAULT now()
);
-- كل تغيير يُكتب أيضًا فى change_log (entity='worker', field ∈ profession|category|dept|rate, eff=due_date)
```

## 2) قواعد العمل (تُطبَّق فى الـ Backend وتتكرر فى الواجهة)

| القاعدة | التطبيق |
|---|---|
| جميع حقول العامل إلزامية + ملف أمر الشغل | `400` مع قائمة الحقول الناقصة |
| نهاية أمر الشغل | إن لم تُرسل: `start_date + 2 months` |
| التكرار الثلاثى | `409 DUPLICATE_TRIPLE` (فهرس فريد + فحص مسبق برسالة واضحة) |
| عامل غير نشط | `GET /workers/:code/card` و`/barcodes/print` ترفض أو تستبعده · `POST /attendance/scan` ← `403 WORKER_INACTIVE` |
| تعديل الوظيفة | الفئة القديمة تسرى حتى `due_date − 1`، الجديدة من `due_date` (عبر `valueAt`) |

## 3) واجهات API (Node/Express — مختصر)

```js
// POST /api/workers
router.post('/workers', upload.single('workOrderFile'), async (req, res) => {
  const b = req.body, miss = [];
  ['dept','jobCode','projectCode','contractorCode','name','nationalId','grade','hours','regDate','startDate']
    .forEach(k => { if (!String(b[k] ?? '').trim()) miss.push(k); });
  if (!/^\d{14}$/.test(b.nationalId || '')) miss.push('nationalId');
  if (!req.file) miss.push('workOrderFile');
  if (miss.length) return res.status(400).json({ error: 'REQUIRED', fields: miss });
  const end = b.endDate || addMonths(b.startDate, 2);
  if (end < b.startDate) return res.status(400).json({ error: 'END_BEFORE_START' });
  const dup = await db.one('SELECT code FROM workers WHERE project_code=$1 AND job_code=$2 AND national_id=$3',
                           [b.projectCode, b.jobCode, b.nationalId]).catch(() => null);
  if (dup) return res.status(409).json({ error: 'DUPLICATE_TRIPLE', code: dup.code });
  const code = await nextWorkerCode(b.contractorCode);
  await db.none(`INSERT INTO workers (...) VALUES (...)`, { ...b, code, end_date: end, work_order_file: req.file.path });
  res.status(201).json({ code, endDate: end });
});

// POST /api/attendance/scan   { payload: "14710001-0312-7" }
router.post('/attendance/scan', async (req, res) => {
  const code = String(req.body.payload || '').split(/[-|\s]/)[0];
  const w = await db.oneOrNone('SELECT code,name,status FROM workers WHERE code=$1', [code]);
  if (!w) return res.status(404).json({ error: 'NOT_FOUND' });
  if (w.status === 'inactive') return res.status(403).json({ error: 'WORKER_INACTIVE', message: 'العامل غير نشط — التسجيل مرفوض' });
  const type = await toggleInOut(code);
  res.json({ code, name: w.name, type, at: new Date() });
});

// GET /api/barcodes/print?project=&contractor=   — يستبعد غير النشطين
//   SELECT ... FROM workers WHERE status='active' AND ...
// GET /api/workers/:code/card  → 403 WORKER_INACTIVE إن كان غير نشط

// GET /api/contractors?q=&sector=&project=   (autocomplete بالاسم أو الكود)
// GET /api/contractors/:code/workers?q=&status=&project=&sector=
// GET /api/workers/:code/details  → { personal, job, cardImage, barcode,
//      attendance: { today, totalDays, avgHours }, finance: { monthly, extractTotal, otHours, otValue, dedHours, dedValue } }

// POST /api/job-changes  { workerCode, dept, jobCode?, newGrade, dueDate, notes }
//   → فحص التكرار الثلاثى · كتابة job_changes + change_log · تطبيق فورى إن due_date <= today

// PATCH/DELETE /api/projects/:code/rates/:id     (الفئات + qty)
// PATCH/DELETE /api/projects/:code/boq/:id       (بنود المقايسة + contractor_code)
// GET /api/projects/:code/boq?contractor=        (بنود منسدلة حسب المقاول، مع required/executed/remaining)
// PATCH /api/contractors/:code  { accountCode, housingAllowance, transportAllowance }
```

## 4) ما نُفِّذ فى النموذج الأولى (`EADRS-Prototype.dc.html`)

- **العامل:** حقل «تاريخ نهاية أمر الشغل» (افتراضى شهران) · كل الحقول وملف أمر الشغل إلزامية مع سطر يوضح الناقص · عمود النهاية فى جدول العمال.
- **غير نشط:** كارت بلا باركود ومستبعد من الطباعة · رفض المسح/التسجيل اليدوى برسالة.
- **الكارت:** الاسم رباعى والوظيفة ← شبكة (الكود|المقاول / الرقم القومى|المشروع) ← الباركود ← (البداية|النهاية).
- **المقاولون:** بحث تلقائى للقطاع/المشروع/المقاول يربط كل الجداول · كود الحساب · جدول عمال بفلتر ونافذة تفاصيل (بيانات، صورة بطاقة، باركود، حضور، ملخص مالى).
- **تعديل وظائف العمال:** شاشة جديدة (القطاع/الإدارة/المشروع/العامل/الوظيفة/الفئة القديمة/الجديدة/مقارنة/استحقاق/ملاحظات) مع سجل.
- **المشروعات:** خانة الكمية فى الفئات · بدل السكن والمواصلات لكل مقاول · حذف بدل السكن وقيمة المقايسة من نموذج المشروع · تعديل/حذف (✕ أعلى، ✎ أسفل) للفئات والبنود · البند يستدعى الوحدة والكمية والفئة من فئات المشروع.
- **السراكى:** بيان الأعمال قائمة منسدلة مع كتابة يدوية · بنود المقايسة مفلترة بالمقاول مع المطلوب/المنفذ/المتبقى · كود السركى فى طباعة المستخلص.
