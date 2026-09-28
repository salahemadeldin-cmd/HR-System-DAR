import { NavLink, useLocation } from 'react-router-dom';
import { useData } from '../lib/DataContext';
import { ROLE_LABELS, type Role } from '../lib/types';

const NAV = [
  { to: '/', label: 'لوحة المتابعة' },
  { to: '/sarak', label: 'بيان أعمال سركى' },
  { to: '/workers', label: 'العمال' },
  { to: '/professions', label: 'المهن والفئات' },
  { to: '/projects', label: 'المشروعات والقطاعات' },
  { to: '/allowances', label: 'البدلات' },
  { to: '/transfers', label: 'النقل بين المشروعات' },
  { to: '/settlements', label: 'التسويات المالية' },
  { to: '/reports', label: 'التقارير والطباعة' },
  { to: '/users', label: 'المستخدمون والصلاحيات' },
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const { role, setRole, db } = useData();
  const loc = useLocation();
  const title = NAV.find(n => n.to === loc.pathname)?.label ?? '';

  return (
    <div className="flex min-h-screen">
      <aside className="no-print w-64 shrink-0 bg-navy text-white">
        <div className="flex items-center gap-3 px-4 py-5">
          <img src="/brand-logo.png" alt="الشروق للمقاولات" className="h-11 w-11 rounded-lg bg-white p-1 object-contain" />
          <div className="leading-tight">
            <div className="text-sm font-bold">الشروق للمقاولات</div>
            <div className="text-[11px] text-white/70">العمومية والتوريدات</div>
          </div>
        </div>
        <nav className="flex flex-col gap-0.5 px-2 pb-4">
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to} end={n.to === '/'}
              className={({ isActive }) =>
                'rounded-lg px-3 py-2 text-sm transition-colors ' +
                (isActive ? 'bg-white font-bold text-navy' : 'text-white/80 hover:bg-white/10')}>
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="mx-2 rounded-lg bg-white/10 p-3">
          <label className="mb-1 block text-[11px] text-white/70">الدور الحالي</label>
          <select value={role} onChange={e => setRole(e.target.value as Role)}
            className="w-full rounded-md bg-white px-2 py-1.5 text-sm text-navy">
            {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <header className="no-print flex items-center justify-between border-b border-navy-light bg-white px-6 py-4">
          <h1 className="text-lg font-bold text-navy">{title}</h1>
          <div className="flex items-center gap-2 text-xs text-ink/60">
            <span className="tag">{db?.workers.length.toLocaleString('en-US')} عامل</span>
            <span className="tag">{db?.sarakEntries.length.toLocaleString('en-US')} سركى</span>
            <span className="tag">{db?.professions.length} مهنة</span>
          </div>
        </header>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
