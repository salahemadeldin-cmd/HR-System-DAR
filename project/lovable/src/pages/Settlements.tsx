import { useMemo, useState } from 'react';
import { useData } from '../lib/DataContext';
import { Field, Table, Denied } from '../components/ui';
import { settlement, money } from '../lib/calc';
import { DEPARTMENTS } from '../lib/dept';
import { exportSheet } from '../lib/excel';

export default function Settlements() {
  const { db, can } = useData();
  const [project, setProject] = useState('all');
  const [period, setPeriod] = useState('all');
  const [dept, setDept] = useState('all');

  const periods = useMemo(() => {
    const s = new Set<string>();
    db?.sarakEntries.forEach(e => e.workDate && s.add(e.workDate.slice(0, 7)));
    return [...s].sort();
  }, [db]);

  const rows = useMemo(() => db ? settlement(db, { projectCode: project, period, department: dept }) : [], [db, project, period, dept]);
  const totals = useMemo(() => rows.reduce((a, r) => ({
    days: a.days + r.days, gross: a.gross + r.gross,
    housing: a.housing + r.housing, transport: a.transport + r.transport, total: a.total + r.total,
  }), { days: 0, gross: 0, housing: 0, transport: 0, total: 0 }), [rows]);

  if (!can('reports')) return <Denied />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <Field label="المشروع">
          <select className="input" value={project} onChange={e => setProject(e.target.value)}>
            <option value="all">كل المشروعات</option>
            {db!.projects.map(p => <option key={p.code} value={p.code}>{p.code} — {p.name}</option>)}
          </select>
        </Field>
        <Field label="الشهر">
          <select className="input" value={period} onChange={e => setPeriod(e.target.value)}>
            <option value="all">كل الفترات</option>
            {periods.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </Field>
        <Field label="القسم">
          <select className="input" value={dept} onChange={e => setDept(e.target.value)}>
            <option value="all">كل الأقسام</option>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </Field>
        <button className="btn btn-secondary" onClick={() => exportSheet(rows as unknown as Record<string, unknown>[], 'التسويات')}>تصدير Excel</button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          ['عدد التسويات', rows.length.toLocaleString('en-US')],
          ['إجمالي الأيام', totals.days.toLocaleString('en-US')],
          ['الأجور', money(totals.gross)],
          ['البدلات', money(totals.housing + totals.transport)],
          ['الإجمالي المستحق', money(totals.total)],
        ].map(([l, v]) => (
          <div key={l} className="card">
            <div className="text-xs font-semibold text-ink/60">{l}</div>
            <div className="mt-1 text-lg font-bold text-navy" dir="ltr">{v}</div>
          </div>
        ))}
      </div>

      <p className="text-xs text-ink/60">
        كل صف = (كود عامل × كود مشروع × شهر) — العامل المنقول يظهر بصفّين مستقلين بكوده القديم والجديد دون خلط مالي.
      </p>

      <Table head={['المشروع', 'كود العامل', 'الاسم', 'القسم', 'الشهر', 'أيام', 'ساعات', 'إضافى', 'خصم', 'اليومية', 'الأجر', 'سكن', 'مواصلات', 'الإجمالي']}>
        {rows.slice(0, 500).map(r => (
          <tr key={r.key}>
            <td className="td" dir="ltr">{r.projectCode}</td>
            <td className="td" dir="ltr">{r.workerCode}</td>
            <td className="td font-semibold">{r.workerName}</td>
            <td className="td text-xs">{r.department}</td>
            <td className="td" dir="ltr">{r.period}</td>
            <td className="td" dir="ltr">{r.days}</td>
            <td className="td" dir="ltr">{r.hours.toFixed(1)}</td>
            <td className="td" dir="ltr">{r.overtime}</td>
            <td className="td" dir="ltr">{r.deduction}</td>
            <td className="td" dir="ltr">{money(r.daily)}</td>
            <td className="td" dir="ltr">{money(r.gross)}</td>
            <td className="td" dir="ltr">{money(r.housing)}</td>
            <td className="td" dir="ltr">{money(r.transport)}</td>
            <td className="td font-bold text-navy" dir="ltr">{money(r.total)}</td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
