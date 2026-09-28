import { useMemo, useState } from 'react';
import { useData } from '../lib/DataContext';
import { Field, Table, Denied } from '../components/ui';

/** النقل التتابعي: قطاع ← مشروع ← عامل، مع توليد كود جديد وفصل الحسابات */
export default function Transfers() {
  const { db, update, can } = useData();
  const [sector, setSector] = useState('');
  const [project, setProject] = useState('');
  const [workerCode, setWorkerCode] = useState('');
  const [toProject, setToProject] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState('');
  const [q, setQ] = useState('');

  const projectsInSector = useMemo(() => {
    if (!db) return [];
    return sector ? db.projects.filter(p => p.sectorCode === sector) : db.projects;
  }, [db, sector]);

  const workers = useMemo(() => {
    if (!db || !project) return [];
    const t = q.trim();
    return db.workers.filter(w => w.projectCode === project && (!t || w.name.includes(t) || w.code.includes(t))).slice(0, 100);
  }, [db, project, q]);

  const worker = db?.workers.find(w => w.code === workerCode);
  const newCode = useMemo(() => {
    if (!worker || !toProject) return '';
    const tail = worker.code.length > 3 ? worker.code.slice(-5) : worker.code;
    return toProject + tail;
  }, [worker, toProject]);

  if (!can('editWorker')) return <Denied />;

  const doTransfer = () => {
    if (!worker || !toProject || !newCode) return;
    update(d => ({
      ...d,
      workers: d.workers.map(w => w.code === worker.code
        ? { ...w, code: newCode, projectCode: toProject }
        : w),
      transfers: [{
        id: 'T' + (d.transfers.length + 1), workerCode: newCode, oldCode: worker.code, newCode,
        fromProject: worker.projectCode, toProject, toSector: sector || null, transferDate: date, reason,
      }, ...d.transfers],
    }));
    setWorkerCode(''); setReason('');
  };

  return (
    <div className="space-y-5">
      <div className="card">
        <h2 className="mb-1 text-sm font-bold text-navy">نقل عامل بين المشروعات</h2>
        <p className="mb-3 text-xs text-ink/60">
          الترتيب إلزامي: القطاع ← المشروع ← العامل. عند النقل يُولَّد كود جديد، ويظل الكود القديم محتفظًا بسراكيه
          فتُحسب التسويات القديمة والجديدة منفصلتين تمامًا.
        </p>
        <div className="grid gap-3 md:grid-cols-4">
          <Field label="١ — القطاع">
            <select className="input" value={sector} onChange={e => { setSector(e.target.value); setProject(''); setWorkerCode(''); }}>
              <option value="">— اختر القطاع —</option>
              {db!.sectors.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
            </select>
          </Field>
          <Field label="٢ — المشروع الحالي">
            <select className="input" value={project} disabled={!sector} onChange={e => { setProject(e.target.value); setWorkerCode(''); }}>
              <option value="">— اختر المشروع —</option>
              {projectsInSector.map(p => <option key={p.code} value={p.code}>{p.code} — {p.name}</option>)}
            </select>
          </Field>
          <Field label="٣ — العامل">
            <select className="input" value={workerCode} disabled={!project} onChange={e => setWorkerCode(e.target.value)}>
              <option value="">— اختر العامل —</option>
              {workers.map(w => <option key={w.code} value={w.code}>{w.code} — {w.name}</option>)}
            </select>
          </Field>
          <Field label="بحث داخل العمال"><input className="input" value={q} disabled={!project} onChange={e => setQ(e.target.value)} /></Field>
          <Field label="المشروع المنقول إليه">
            <select className="input" value={toProject} disabled={!workerCode} onChange={e => setToProject(e.target.value)}>
              <option value="">— اختر المشروع —</option>
              {db!.projects.filter(p => p.code !== project).map(p => <option key={p.code} value={p.code}>{p.code} — {p.name}</option>)}
            </select>
          </Field>
          <Field label="تاريخ النقل"><input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} /></Field>
          <Field label="الكود الجديد"><input className="input bg-navy-pale font-bold text-navy" dir="ltr" value={newCode} readOnly /></Field>
          <Field label="سبب النقل"><input className="input" value={reason} onChange={e => setReason(e.target.value)} /></Field>
        </div>
        <div className="mt-4">
          <button className="btn btn-primary" onClick={doTransfer} disabled={!worker || !toProject}>تنفيذ النقل</button>
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-bold text-navy">سجل عمليات النقل</h2>
        {db!.transfers.length === 0
          ? <div className="card text-center text-sm text-ink/50">لا توجد عمليات نقل بعد.</div>
          : (
            <Table head={['العملية', 'الكود القديم', 'الكود الجديد', 'من مشروع', 'إلى مشروع', 'التاريخ', 'السبب']} maxH="40vh">
              {db!.transfers.map(t => (
                <tr key={t.id}>
                  <td className="td" dir="ltr">{t.id}</td>
                  <td className="td" dir="ltr">{t.oldCode}</td>
                  <td className="td font-bold text-navy" dir="ltr">{t.newCode}</td>
                  <td className="td" dir="ltr">{t.fromProject}</td>
                  <td className="td" dir="ltr">{t.toProject}</td>
                  <td className="td" dir="ltr">{t.transferDate}</td>
                  <td className="td text-xs">{t.reason}</td>
                </tr>
              ))}
            </Table>
          )}
      </div>
    </div>
  );
}
