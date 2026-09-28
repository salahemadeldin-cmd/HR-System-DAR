import { useMemo } from 'react';
import { useData } from '../lib/DataContext';
import { Kpi, Table } from '../components/ui';
import { settlement, money } from '../lib/calc';

export default function Dashboard() {
  const { db } = useData();
  const s = useMemo(() => {
    if (!db) return null;
    const rows = settlement(db);
    const byDept = new Map<string, number>();
    db.workers.forEach(w => byDept.set(w.department, (byDept.get(w.department) || 0) + 1));
    const byProject = new Map<string, number>();
    db.sarakEntries.forEach(e => byProject.set(e.projectName || e.projectCode, (byProject.get(e.projectName || e.projectCode) || 0) + 1));
    const matched = db.sarakEntries.filter(e => e.matchStatus === 'مطابق').length;
    return {
      workers: db.workers.length,
      self: db.workers.filter(w => w.source === 'ذاتى').length,
      sub: db.workers.filter(w => w.source === 'باطن').length,
      sarak: db.sarakEntries.length,
      matchPct: db.sarakEntries.length ? Math.round((matched / db.sarakEntries.length) * 100) : 0,
      overtime: Math.round(db.sarakEntries.reduce((a, e) => a + (e.overtimeHours || 0), 0)),
      cost: rows.reduce((a, r) => a + r.total, 0),
      byDept: [...byDept].sort((a, b) => b[1] - a[1]),
      byProject: [...byProject].sort((a, b) => b[1] - a[1]).slice(0, 10),
    };
  }, [db]);
  if (!s) return null;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="إجمالي العمال" value={s.workers.toLocaleString('en-US')} meta={`ذاتى ${s.self.toLocaleString('en-US')} · باطن ${s.sub.toLocaleString('en-US')}`} />
        <Kpi label="سجلات سركى" value={s.sarak.toLocaleString('en-US')} meta={`نسبة المطابقة ${s.matchPct}%`} />
        <Kpi label="ساعات إضافية" value={s.overtime.toLocaleString('en-US')} meta="إجمالي الفترة" />
        <Kpi label="قيمة التسويات" value={money(s.cost) + ' ج.م'} meta="أجور + بدلات" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <h2 className="mb-2 text-sm font-bold text-navy">توزيع العمال على الأقسام</h2>
          <Table head={['القسم', 'عدد العمال', 'النسبة']} maxH="42vh">
            {s.byDept.map(([d, n]) => (
              <tr key={d}>
                <td className="td">{d}</td>
                <td className="td" dir="ltr">{n.toLocaleString('en-US')}</td>
                <td className="td">
                  <div className="h-2 w-full rounded bg-navy-pale">
                    <div className="h-2 rounded bg-navy" style={{ width: Math.round((n / s.workers) * 100) + '%' }} />
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        </div>
        <div>
          <h2 className="mb-2 text-sm font-bold text-navy">أكثر المشروعات نشاطًا في السراكي</h2>
          <Table head={['المشروع', 'عدد السجلات']} maxH="42vh">
            {s.byProject.map(([p, n]) => (
              <tr key={p}><td className="td">{p}</td><td className="td" dir="ltr">{n.toLocaleString('en-US')}</td></tr>
            ))}
          </Table>
        </div>
      </div>
    </div>
  );
}
