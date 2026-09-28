# استيراد البيانات إلى Supabase

الترتيب مهم لأن الجداول مرتبطة بمفاتيح خارجية:

1. `departments.csv`
2. `sectors.csv` ثم `sites.csv`
3. `projects.csv`
4. `professions.csv`
5. `contractors.csv`
6. `workers.csv` (12,830 صفًا — ذاتى + باطن)
7. `sarak_entries.csv` (667 صفًا)

**الطريقة:** Supabase Dashboard → Table Editor → الجدول → `Import data from CSV`.
لو فشل صف بسبب رقم قومي مكرر أو غير مكتمل، أوقف قيد `workers_nid_unique` مؤقتًا، استورد، ثم صحّح المكرر:

```sql
alter table workers drop constraint workers_nid_unique;
-- بعد التصحيح
alter table workers add constraint workers_nid_unique unique (national_id);
```

الحقول الفارغة في CSV تُقرأ كنص فارغ لا NULL — نظّفها بعد الاستيراد:

```sql
update workers set national_id = null where national_id = '';
update workers set start_date = null where start_date::text = '';
update workers set contractor_code = null where contractor_code = '';
```
