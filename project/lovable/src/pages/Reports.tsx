import { useMemo, useState } from 'react';
import { useData } from '../lib/DataContext';
import { Field, Denied } from '../components/ui';
import { settlement, money } from '../lib/calc';
import { exportBook } from '../lib/excel';

export default function Reports() {
  const { db, can } = useData();
  const [project, setProject] = useState('');
  const [period, setPeriod] = useState('');

  const periods = useMemo(() => {
    const s = new Set<string>();
    db?.sarakEntries.forEach(e => e.workDate && s.add(e.workDate.slice(0, 7)));
    return [...s].sort();
  }, [db]);

  const rows = useMemo(() =>
    db && project ? settlement(db, { projectCode: project, period: period || 'all' }) : [],
    [db, project, period]);

  const projectName = db?.projects.find(p => p.code === project)?.name ?? '';
  const totals = rows.reduce((a, r) => ({ days: a.days + r.days, total: a.total + r.total }), { days: 0, total: 0 });

  if (!can('reports')) return <Denied />;

  return (
    <div className="space-y-4">
      <div className="no-print flex flex-wrap items-end gap-3">
        <Field label="المشروع">
          <select className="input" value={project} onChange={e => setProject(e.target.value)}>
            <option value="">— اختر المشروع —</option>
            {db!.projects.map(p => <option key={p.code} value={p.code}>{p.code} — {p.name}</option>)}
          </select>
        </Field>
        <Field label="الشهر">
          <select className="input" value={period} onChange={e => setPeriod(e.target.value)}>
            <option value="">كل الفترات</option>
            {periods.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </Field>
        <button className="btn btn-primary" onClick={() => window.print()} disabled={!project}>طباعة / PDF</button>
        <button className="btn btn-secondary" disabled={!project} onClick={() => exportBook([
          { name: 'Settlement', rows: rows as unknown as Record<string, unknown>[] },
          { name: 'Sarak', rows: db!.sarakEntries.filter(e => e.projectCode === project) as unknown as Record<string, unknown>[] },
        ], `تقرير ${projectName}`)}>تصدير Excel</button>
      </div>

      {!project ? (
        <div className="card text-center text-sm text-ink/50">اختر مشروعًا لعرض التقرير المعدّ للطباعة.</div>
      ) : (
        <div className="card">
          <header className="mb-4 flex items-center justify-between border-b border-navy-light pb-3">
            <div className="flex items-center gap-3">
              <img src="/brand-logo.png" alt="" className="h-14 w-14 object-contain" />
              <div>
                <div className="text-sm font-bold text-navy">الشروق للمقاولات العمومية والتوريدات للقطاع العام</div>
                <div className="text-xs text-ink/60">كشف تسوية أجور العمالة — {projectName}{period && ` — ${period}`}</div>
              </div>
            </div>
            <div className="text-xs text-ink/60">
              <div>تاريخ الطباعة: {new Date().toLocaleDateString('ar-EG')}</div>
              <div>عدد البنود: {rows.length}</div>
            </div>
          </header>

          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>{['م', 'كود العامل', 'الاسم', 'المهنة', 'القسم', 'أيام', 'اليومية', 'الأجر', 'البدلات', 'الإجمالي'].map(h =>
                <th key={h} className="border-b border-navy-light bg-navy-pale px-2 py-1.5 text-right text-xs font-bold text-navy">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.key}>
                  <td className="td" dir="ltr">{i + 1}</td>
                  <td className="td" dir="ltr">{r.workerCode}</td>
                  <td className="td">{r.workerName}</td>
                  <td className="td text-xs">{db!.workers.find(w => w.code === r.workerCode)?.profession ?? '—'}</td>
                  <td className="td text-xs">{r.department}</td>
                  <td className="td" dir="ltr">{r.days}</td>
                  <td className="td" dir="ltr">{money(r.daily)}</td>
                  <td className="td" dir="ltr">{money(r.gross)}</td>
                  <td className="td" dir="ltr">{money(r.housing + r.transport)}</td>
                  <td className="td font-bold" dir="ltr">{money(r.total)}</td>
                </tr>
              ))}
              <tr>
                <td className="td font-bold" colSpan={5}>الإجمالي العام</td>
                <td className="td font-bold" dir="ltr">{totals.days}</td>
                <td className="td" colSpan={3}></td>
                <td className="td font-bold text-navy" dir="ltr">{money(totals.total)} ج.م</td>
              </tr>
            </tbody>
          </table>

          <footer className="mt-8 grid grid-cols-3 gap-6 text-center text-xs text-ink/70">
            {['أعدّه: شئون العاملين', 'راجعه: مدير المشروع', 'اعتماد: الإدارة المالية'].map(s => (
              <div key={s}><div className="mb-8">{s}</div><div className="border-t border-ink/30 pt-1">التوقيع</div></div>
            ))}
          </footer>
        </div>
      )}
    </div>
  );
}
