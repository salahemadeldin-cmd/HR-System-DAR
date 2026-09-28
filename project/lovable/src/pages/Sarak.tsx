import { useMemo, useState } from 'react';
import { useData } from '../lib/DataContext';
import { Field, Table, Denied } from '../components/ui';
import { DEPARTMENTS } from '../lib/dept';
import { exportSheet } from '../lib/excel';
import type { SarakEntry } from '../lib/types';

const SHIFTS = [
  { v: '8To17G', l: '٨ ص → ٥ م (عام)' },
  { v: 'am', l: 'صباحى ٧ ص → ٤ م' },
  { v: 'pm', l: 'مسائى ٤ م → ١٢ م' },
  { v: 'night', l: 'ليلى ١٢ م → ٨ ص' },
];

export default function Sarak() {
  const { db, update, can } = useData();
  const [f, setF] = useState({
    date: new Date().toISOString().slice(0, 10),
    sector: '', project: '', department: DEPARTMENTS[2] as string,
    region: '', shift: '8To17G', inTime: '08:00', outTime: '17:00',
    details: '', count: '', note: '',
  });
  const [search, setSearch] = useState('');
  const set = (k: string, v: string) => setF(p => ({ ...p, [k]: v }));

  const projects = useMemo(() => {
    if (!db) return [];
    return f.sector ? db.projects.filter(p => p.sectorCode === f.sector || !p.sectorCode) : db.projects;
  }, [db, f.sector]);

  const rows = useMemo(() => {
    if (!db) return [];
    const q = search.trim();
    const list = q
      ? db.sarakEntries.filter(e => e.workerName.includes(q) || e.workerCode.includes(q) || e.projectName.includes(q))
      : db.sarakEntries;
    return list.slice(-300).reverse();
  }, [db, search]);

  if (!can('sarakWork')) return <Denied />;

  const submit = () => {
    if (!db || !f.project || !f.details.trim()) return;
    const project = db.projects.find(p => p.code === f.project);
    const n = Number(f.count) || 1;
    const start = db.sarakEntries.length + 1;
    const entries: SarakEntry[] = Array.from({ length: n }, (_, i) => ({
      code: 'S' + (start + i), workDate: f.date, workerCode: '', workerName: '—',
      profession: '', department: f.department, category: null, nationalId: '',
      projectCode: f.project, projectName: project?.name ?? '', contractorCode: null, source: 'ذاتى',
      workDescription: f.details.trim(), note: f.note, region: f.region, shift: f.shift,
      overtimeHours: 0, deductionHours: 0, inTime: f.inTime, outTime: f.outTime,
      hours: hoursBetween(f.inTime, f.outTime), nightShift: f.shift === 'night',
      matchStatus: 'بانتظار المطابقة', approved: false,
    }));
    update(d => ({ ...d, sarakEntries: [...d.sarakEntries, ...entries] }));
    setF(p => ({ ...p, details: '', count: '', note: '' }));
  };

  return (
    <div className="space-y-5">
      <div className="card">
        <h2 className="mb-3 text-sm font-bold text-navy">إضافة بيان أعمال سركى</h2>
        <div className="grid gap-3 md:grid-cols-4">
          <Field label="التاريخ"><input type="date" className="input" value={f.date} onChange={e => set('date', e.target.value)} /></Field>
          <Field label="القطاع">
            <select className="input" value={f.sector} onChange={e => { set('sector', e.target.value); set('project', ''); }}>
              <option value="">— كل القطاعات —</option>
              {db!.sectors.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
            </select>
          </Field>
          <Field label="المشروع">
            <select className="input" value={f.project} onChange={e => set('project', e.target.value)}>
              <option value="">— اختر المشروع —</option>
              {projects.map(p => <option key={p.code} value={p.code}>{p.code} — {p.name}</option>)}
            </select>
          </Field>
          <Field label="القسم">
            <select className="input" value={f.department} onChange={e => set('department', e.target.value)}>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </Field>
          <Field label="الوردية">
            <select className="input" value={f.shift} onChange={e => {
              set('shift', e.target.value);
              const map: Record<string, [string, string]> = { '8To17G': ['08:00','17:00'], am: ['07:00','16:00'], pm: ['16:00','00:00'], night: ['00:00','08:00'] };
              const [i, o] = map[e.target.value] || ['08:00','17:00']; set('inTime', i); set('outTime', o);
            }}>
              {SHIFTS.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
            </select>
          </Field>
          <Field label="الحضور"><input type="time" className="input" value={f.inTime} onChange={e => set('inTime', e.target.value)} /></Field>
          <Field label="الانصراف"><input type="time" className="input" value={f.outTime} onChange={e => set('outTime', e.target.value)} /></Field>
          <Field label="عدد العمال"><input type="number" min={1} className="input" dir="ltr" value={f.count} onChange={e => set('count', e.target.value)} placeholder="1" /></Field>
          <div className="md:col-span-3">
            <Field label="تفاصيل الأعمال المنفذة">
              <textarea className="input min-h-[84px]" value={f.details} onChange={e => set('details', e.target.value)}
                placeholder="وصف الأعمال المنفذة في الموقع…" />
            </Field>
          </div>
          <Field label="المنطقة / الموقع"><input className="input" value={f.region} onChange={e => set('region', e.target.value)} /></Field>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <button className="btn-primary" onClick={submit} disabled={!f.project || !f.details.trim()}>حفظ البيان</button>
          <button className="btn-ghost" onClick={() => exportSheet(db!.sarakEntries as unknown as Record<string, unknown>[], 'سراكي')}>تصدير Excel</button>
          <span className="text-xs text-ink/50">إجمالي السجلات: {db!.sarakEntries.length.toLocaleString('en-US')}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input className="input max-w-xs" placeholder="بحث بالاسم أو الكود أو المشروع…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <Table head={['الكود', 'التاريخ', 'العامل', 'المهنة', 'القسم', 'المشروع', 'الوردية', 'الساعات', 'الحالة']}>
        {rows.map(e => (
          <tr key={e.code}>
            <td className="td" dir="ltr">{e.code}</td>
            <td className="td" dir="ltr">{e.workDate}</td>
            <td className="td">{e.workerName}</td>
            <td className="td">{e.profession}</td>
            <td className="td text-xs">{e.department}</td>
            <td className="td text-xs">{e.projectName}</td>
            <td className="td" dir="ltr">{e.inTime}–{e.outTime}</td>
            <td className="td" dir="ltr">{e.hours}</td>
            <td className="td"><span className="tag">{e.matchStatus}</span></td>
          </tr>
        ))}
      </Table>
    </div>
  );
}

function hoursBetween(a: string, b: string) {
  const m = (t: string) => { const [h, mi] = t.split(':').map(Number); return h * 60 + mi; };
  let diff = m(b) - m(a); if (diff <= 0) diff += 24 * 60;
  return Math.round((diff / 60) * 100) / 100;
}
