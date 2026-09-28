import { useMemo, useState } from 'react';
import { useData } from '../lib/DataContext';
import { Field, Table, Modal, Denied } from '../components/ui';
import { DEPARTMENTS } from '../lib/dept';
import { isValidNationalId, birthFromNationalId, genderFromNationalId, ageFromNationalId } from '../lib/nid';
import { exportSheet } from '../lib/excel';
import type { Grade, Worker } from '../lib/types';

const GRADES: Grade[] = ['A', 'B', 'C', 'D', 'E'];
const PAGE = 60;

export default function Workers() {
  const { db, update, can } = useData();
  const [q, setQ] = useState('');
  const [dept, setDept] = useState('all');
  const [src, setSrc] = useState('all');
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!db) return [];
    const t = q.trim();
    return db.workers.filter(w =>
      (dept === 'all' || w.department === dept) &&
      (src === 'all' || w.source === src) &&
      (!t || w.name.includes(t) || w.code.includes(t) || (w.nationalId || '').includes(t)));
  }, [db, q, dept, src]);

  const shown = filtered.slice(page * PAGE, page * PAGE + PAGE);
  const pages = Math.ceil(filtered.length / PAGE);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <Field label="بحث"><input className="input min-w-[220px]" value={q} onChange={e => { setQ(e.target.value); setPage(0); }} placeholder="الاسم أو الكود أو الرقم القومي" /></Field>
        <Field label="القسم">
          <select className="input" value={dept} onChange={e => { setDept(e.target.value); setPage(0); }}>
            <option value="all">كل الأقسام</option>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </Field>
        <Field label="المصدر">
          <select className="input" value={src} onChange={e => { setSrc(e.target.value); setPage(0); }}>
            <option value="all">الكل</option><option value="ذاتى">ذاتى</option><option value="باطن">باطن</option>
          </select>
        </Field>
        <div className="flex gap-2">
          {can('addWorker') && <button className="btn-primary" onClick={() => setOpen(true)}>إضافة عامل</button>}
          <button className="btn-ghost" onClick={() => exportSheet(filtered as unknown as Record<string, unknown>[], 'العمال')}>تصدير Excel</button>
        </div>
        <span className="text-xs text-ink/50">{filtered.length.toLocaleString('en-US')} نتيجة</span>
      </div>

      <Table head={['الكود', 'الاسم', 'الرقم القومي', 'المهنة', 'الفئة', 'القسم', 'المشروع', 'المصدر', 'المقاول']}>
        {shown.map(w => (
          <tr key={w.code}>
            <td className="td" dir="ltr">{w.code}</td>
            <td className="td font-semibold">{w.name}</td>
            <td className="td" dir="ltr">{w.nationalId}</td>
            <td className="td">{w.profession}</td>
            <td className="td" dir="ltr">{w.category || '—'}</td>
            <td className="td text-xs">{w.department}</td>
            <td className="td" dir="ltr">{w.projectCode}</td>
            <td className="td"><span className="tag">{w.source}</span></td>
            <td className="td" dir="ltr">{w.contractorCode || '—'}</td>
          </tr>
        ))}
      </Table>

      {pages > 1 && (
        <div className="flex items-center gap-2 text-sm">
          <button className="btn-ghost" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>السابق</button>
          <span dir="ltr">{page + 1} / {pages}</span>
          <button className="btn-ghost" onClick={() => setPage(p => Math.min(pages - 1, p + 1))} disabled={page >= pages - 1}>التالي</button>
        </div>
      )}

      <AddWorker open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

function AddWorker({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { db, update } = useData();
  const [w, setW] = useState({ code: '', name: '', nationalId: '', profession: '', department: DEPARTMENTS[2] as string, category: 'C' as Grade, projectCode: '', source: 'ذاتى', manager: '', startDate: '', housing: '', transport: '' });
  const set = (k: string, v: string) => setW(p => ({ ...p, [k]: v }));

  const nidOk = isValidNationalId(w.nationalId);
  const dup = !!db && !!w.nationalId && db.workers.some(x => x.nationalId === w.nationalId);
  const profs = useMemo(() => {
    if (!db) return [];
    const names = new Set(db.professions.filter(p => p.department === w.department).map(p => p.name));
    return [...names];
  }, [db, w.department]);

  const valid = w.code && w.name && nidOk && !dup && w.projectCode;

  const save = () => {
    if (!valid) return;
    const rec: Worker = {
      code: w.code, name: w.name, nationalId: w.nationalId, profession: w.profession,
      department: w.department, projectCode: w.projectCode, contractorCode: null,
      source: w.source as Worker['source'], category: w.category, manager: w.manager || null,
      startDate: w.startDate || null, allowance: 0,
      housingAllowance: Number(w.housing) || 0, transportAllowance: Number(w.transport) || 0, active: true,
    };
    update(d => ({ ...d, workers: [rec, ...d.workers] }));
    onClose();
  };

  return (
    <Modal open={open} title="إضافة عامل جديد" onClose={onClose}>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="كود العامل"><input className="input" dir="ltr" value={w.code} onChange={e => set('code', e.target.value)} /></Field>
        <Field label="الاسم"><input className="input" value={w.name} onChange={e => set('name', e.target.value)} /></Field>
        <div className="md:col-span-2">
          <Field label="الرقم القومي (14 رقمًا)">
            <input className="input" dir="ltr" maxLength={14} value={w.nationalId} onChange={e => set('nationalId', e.target.value.replace(/\D/g, ''))} />
          </Field>
          {w.nationalId.length === 14 && !nidOk && <p className="mt-1 text-xs text-danger">رقم قومي غير صحيح.</p>}
          {dup && <p className="mt-1 text-xs text-danger">هذا الرقم القومي مسجّل بالفعل لعامل آخر.</p>}
          {nidOk && !dup && (
            <p className="mt-1 text-xs text-navy">
              تاريخ الميلاد {birthFromNationalId(w.nationalId)} · {genderFromNationalId(w.nationalId)} · {ageFromNationalId(w.nationalId)} سنة
            </p>
          )}
        </div>
        <Field label="القسم">
          <select className="input" value={w.department} onChange={e => { set('department', e.target.value); set('profession', ''); }}>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </Field>
        <Field label="المهنة">
          <select className="input" value={w.profession} onChange={e => set('profession', e.target.value)}>
            <option value="">— اختر المهنة —</option>
            {profs.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </Field>
        <Field label="الفئة">
          <select className="input" value={w.category} onChange={e => set('category', e.target.value)}>
            {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </Field>
        <Field label="المشروع">
          <select className="input" value={w.projectCode} onChange={e => set('projectCode', e.target.value)}>
            <option value="">— اختر المشروع —</option>
            {db!.projects.map(p => <option key={p.code} value={p.code}>{p.code} — {p.name}</option>)}
          </select>
        </Field>
        <Field label="بدل سكن (يومي)"><input className="input" dir="ltr" value={w.housing} onChange={e => set('housing', e.target.value)} /></Field>
        <Field label="بدل مواصلات (يومي)"><input className="input" dir="ltr" value={w.transport} onChange={e => set('transport', e.target.value)} /></Field>
        <Field label="تاريخ الالتحاق"><input type="date" className="input" value={w.startDate} onChange={e => set('startDate', e.target.value)} /></Field>
        <Field label="المسؤول المباشر"><input className="input" value={w.manager} onChange={e => set('manager', e.target.value)} /></Field>
      </div>
      <div className="mt-4 flex gap-2">
        <button className="btn-primary" onClick={save} disabled={!valid}>حفظ</button>
        <button className="btn-ghost" onClick={onClose}>إلغاء</button>
      </div>
    </Modal>
  );
}
