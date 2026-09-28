import { useMemo, useState } from 'react';
import { useData } from '../lib/DataContext';
import { Field, Table, Modal } from '../components/ui';
import { exportBook } from '../lib/excel';

export default function Projects() {
  const { db, update } = useData();
  const [tab, setTab] = useState<'projects' | 'sectors'>('projects');
  const [open, setOpen] = useState(false);
  const [p, setP] = useState({ code: '', name: '', sectorCode: '' });
  const [q, setQ] = useState('');

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    db?.workers.forEach(w => { if (w.projectCode) m.set(w.projectCode, (m.get(w.projectCode) || 0) + 1); });
    return m;
  }, [db]);

  const projects = useMemo(() => {
    const t = q.trim();
    return (db?.projects ?? []).filter(x => !t || x.name.includes(t) || x.code.includes(t));
  }, [db, q]);

  const dupCode = !!db && db.projects.some(x => x.code === p.code.trim());

  const save = () => {
    if (!p.code.trim() || !p.name.trim() || dupCode) return;
    update(d => ({ ...d, projects: [{ code: p.code.trim(), name: p.name.trim(), sectorCode: p.sectorCode || null, active: true }, ...d.projects] }));
    setP({ code: '', name: '', sectorCode: '' });
    setOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex gap-1 rounded-lg bg-navy-pale p-1">
          {([['projects', 'المشروعات'], ['sectors', 'القطاعات والمواقع']] as const).map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)}
              className={'rounded-md px-3 py-1.5 text-sm font-semibold ' + (tab === k ? 'bg-white text-navy shadow-sm' : 'text-navy/60')}>
              {l}
            </button>
          ))}
        </div>
        {tab === 'projects' && <Field label="بحث"><input className="input" value={q} onChange={e => setQ(e.target.value)} placeholder="كود أو اسم المشروع" /></Field>}
        <div className="flex gap-2">
          {tab === 'projects' && <button className="btn-primary" onClick={() => setOpen(true)}>إنشاء مشروع</button>}
          <button className="btn-ghost" onClick={() => exportBook([
            { name: 'Projects', rows: db!.projects as unknown as Record<string, unknown>[] },
            { name: 'Sectors', rows: db!.sectors as unknown as Record<string, unknown>[] },
            { name: 'Sites', rows: db!.sites as unknown as Record<string, unknown>[] },
          ], 'المشروعات والقطاعات')}>تصدير Excel</button>
        </div>
      </div>

      {tab === 'projects' ? (
        <Table head={['الكود', 'المشروع', 'القطاع', 'عدد العمال', 'الحالة']}>
          {projects.map(x => (
            <tr key={x.code}>
              <td className="td" dir="ltr">{x.code}</td>
              <td className="td font-semibold">{x.name}</td>
              <td className="td text-xs">{db!.sectors.find(s => s.code === x.sectorCode)?.name || '—'}</td>
              <td className="td" dir="ltr">{(counts.get(x.code) || 0).toLocaleString('en-US')}</td>
              <td className="td"><span className="tag">{x.active ? 'قائم' : 'موقوف'}</span></td>
            </tr>
          ))}
        </Table>
      ) : (
        <Table head={['كود القطاع', 'القطاع', 'كود الموقع', 'الموقع']}>
          {db!.sites.map(s => (
            <tr key={s.code}>
              <td className="td" dir="ltr">{s.sectorCode}</td>
              <td className="td">{db!.sectors.find(x => x.code === s.sectorCode)?.name}</td>
              <td className="td" dir="ltr">{s.code}</td>
              <td className="td font-semibold">{s.name}</td>
            </tr>
          ))}
        </Table>
      )}

      <Modal open={open} title="إنشاء مشروع جديد" onClose={() => setOpen(false)}>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="كود المشروع"><input className="input" dir="ltr" value={p.code} onChange={e => setP({ ...p, code: e.target.value })} /></Field>
          <Field label="اسم المشروع"><input className="input" value={p.name} onChange={e => setP({ ...p, name: e.target.value })} /></Field>
          <div className="md:col-span-2">
            <Field label="القطاع">
              <select className="input" value={p.sectorCode} onChange={e => setP({ ...p, sectorCode: e.target.value })}>
                <option value="">— بدون قطاع —</option>
                {db!.sectors.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
              </select>
            </Field>
          </div>
        </div>
        {dupCode && p.code && <p className="mt-2 text-xs text-danger">هذا الكود مستخدم بالفعل.</p>}
        <div className="mt-4 flex gap-2">
          <button className="btn-primary" onClick={save} disabled={!p.code.trim() || !p.name.trim() || dupCode}>حفظ</button>
          <button className="btn-ghost" onClick={() => setOpen(false)}>إلغاء</button>
        </div>
      </Modal>
    </div>
  );
}
