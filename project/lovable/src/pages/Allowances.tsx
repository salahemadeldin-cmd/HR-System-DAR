import { useMemo, useState } from 'react';
import { useData } from '../lib/DataContext';
import { Field, Table } from '../components/ui';
import { ALLOWANCE_DEPARTMENTS, DEPARTMENTS } from '../lib/dept';
import { money } from '../lib/calc';
import { exportBook } from '../lib/excel';

export default function Allowances() {
  const { db, update } = useData();
  const [tab, setTab] = useState<'workers' | 'contractors'>('workers');
  const [dept, setDept] = useState(ALLOWANCE_DEPARTMENTS[0]);
  const [q, setQ] = useState('');

  const workers = useMemo(() => {
    const t = q.trim();
    return (db?.workers ?? [])
      .filter(w => w.department === dept && (!t || w.name.includes(t) || w.code.includes(t)))
      .slice(0, 200);
  }, [db, dept, q]);

  const contractors = useMemo(() => {
    const t = q.trim();
    return (db?.contractors ?? []).filter(c => !t || c.name.includes(t) || c.code.includes(t)).slice(0, 200);
  }, [db, q]);

  const setW = (code: string, field: 'housingAllowance' | 'transportAllowance', v: string) =>
    update(d => ({ ...d, workers: d.workers.map(w => w.code === code ? { ...w, [field]: Number(v) || 0 } : w) }));

  const setC = (code: string, field: 'housingAllowance' | 'transportAllowance', v: string) =>
    update(d => ({ ...d, contractors: d.contractors.map(c => c.code === code ? { ...c, [field]: Number(v) || 0 } : c) }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex gap-1 rounded-lg bg-navy-pale p-1">
          {([['workers', 'بدلات العمال'], ['contractors', 'بدلات مقاولي الباطن']] as const).map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)}
              className={'rounded-md px-3 py-1.5 text-sm font-semibold ' + (tab === k ? 'bg-white text-navy shadow-sm' : 'text-navy/60')}>{l}</button>
          ))}
        </div>
        {tab === 'workers' && (
          <Field label="القسم (أقسام مستحقة للبدل فقط)">
            <select className="input" value={dept} onChange={e => setDept(e.target.value)}>
              {DEPARTMENTS.filter(d => ALLOWANCE_DEPARTMENTS.includes(d)).map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </Field>
        )}
        <Field label="بحث"><input className="input" value={q} onChange={e => setQ(e.target.value)} /></Field>
        <button className="btn-ghost" onClick={() => exportBook([
          { name: 'Workers', rows: db!.workers.filter(w => w.housingAllowance || w.transportAllowance) as unknown as Record<string, unknown>[] },
          { name: 'Contractors', rows: db!.contractors as unknown as Record<string, unknown>[] },
        ], 'البدلات')}>تصدير Excel</button>
      </div>

      {tab === 'workers' ? (
        <Table head={['الكود', 'الاسم', 'المهنة', 'المشروع', 'بدل سكن/يوم', 'بدل مواصلات/يوم', 'إجمالي يومي']}>
          {workers.map(w => (
            <tr key={w.code}>
              <td className="td" dir="ltr">{w.code}</td>
              <td className="td font-semibold">{w.name}</td>
              <td className="td text-xs">{w.profession}</td>
              <td className="td" dir="ltr">{w.projectCode}</td>
              <td className="td"><input className="input max-w-[110px]" dir="ltr" value={w.housingAllowance || ''} onChange={e => setW(w.code, 'housingAllowance', e.target.value)} /></td>
              <td className="td"><input className="input max-w-[110px]" dir="ltr" value={w.transportAllowance || ''} onChange={e => setW(w.code, 'transportAllowance', e.target.value)} /></td>
              <td className="td font-bold text-navy" dir="ltr">{money(w.housingAllowance + w.transportAllowance)}</td>
            </tr>
          ))}
        </Table>
      ) : (
        <Table head={['الكود', 'المقاول', 'المشروع', 'الحالة', 'بدل سكن/يوم', 'بدل مواصلات/يوم', 'إجمالي يومي']}>
          {contractors.map(c => (
            <tr key={c.code}>
              <td className="td" dir="ltr">{c.code}</td>
              <td className="td font-semibold">{c.name}</td>
              <td className="td" dir="ltr">{c.projectCode}</td>
              <td className="td">
                <button className="tag" onClick={() => update(d => ({ ...d, contractors: d.contractors.map(x => x.code === c.code ? { ...x, active: !x.active } : x) }))}>
                  {c.active ? 'نشط' : 'موقوف'}
                </button>
              </td>
              <td className="td"><input className="input max-w-[110px]" dir="ltr" value={c.housingAllowance || ''} onChange={e => setC(c.code, 'housingAllowance', e.target.value)} /></td>
              <td className="td"><input className="input max-w-[110px]" dir="ltr" value={c.transportAllowance || ''} onChange={e => setC(c.code, 'transportAllowance', e.target.value)} /></td>
              <td className="td font-bold text-navy" dir="ltr">{money(c.housingAllowance + c.transportAllowance)}</td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
