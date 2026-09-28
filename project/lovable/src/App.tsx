import { Routes, Route } from 'react-router-dom';
import Shell from './components/Shell';
import { useData } from './lib/DataContext';
import Dashboard from './pages/Dashboard';
import Sarak from './pages/Sarak';
import Workers from './pages/Workers';
import Professions from './pages/Professions';
import Projects from './pages/Projects';
import Allowances from './pages/Allowances';
import Transfers from './pages/Transfers';
import Settlements from './pages/Settlements';
import Reports from './pages/Reports';
import Users from './pages/Users';

export default function App() {
  const { loading, db } = useData();
  if (loading || !db) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <img src="/brand-logo.png" className="mx-auto mb-3 h-16 w-16 object-contain" alt="" />
          <div className="text-sm text-ink/60">جارٍ تحميل قاعدة البيانات…</div>
        </div>
      </div>
    );
  }
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/sarak" element={<Sarak />} />
        <Route path="/workers" element={<Workers />} />
        <Route path="/professions" element={<Professions />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/allowances" element={<Allowances />} />
        <Route path="/transfers" element={<Transfers />} />
        <Route path="/settlements" element={<Settlements />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/users" element={<Users />} />
      </Routes>
    </Shell>
  );
}
