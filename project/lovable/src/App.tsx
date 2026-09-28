import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Shell from './components/Shell';
import Gate, { type GateStage } from './components/Gate';
import Pending from './components/Pending';
import { useData } from './lib/DataContext';
import { useAuth } from './lib/auth';
import { usePrefs } from './lib/prefs';
import { SCREENS } from './lib/screens';
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
import Barcodes from './pages/Barcodes';

// الشاشات المنفَّذة حتى الآن؛ الباقى يعرض <Pending/> إلى أن يُبنى فى مرحلته.
const BUILT: Record<string, React.ReactNode> = {
  dashboard: <Dashboard />,
  workers: <Workers />,
  barcodes: <Barcodes />,
  professions: <Professions />,
  allowances: <><Allowances /><Projects /></>,
  transfers: <Transfers />,
  sarakWork: <Sarak />,
  reports: <><Reports /><Settlements /></>,
  users: <Users />,
};

export default function App() {
  const { loading, db } = useData();
  const { user } = useAuth();
  const { t } = usePrefs();
  const [stage, setStage] = useState<GateStage>('splash');

  // بعد تسجيل الخروج نعود لشاشة الدخول مباشرة (بدون المقدمة)
  const gateStage: GateStage = !user && (stage === 'app' || stage === 'loading') ? 'login' : stage;

  return (
    <>
      <Gate stage={gateStage} setStage={setStage} />
      {gateStage === 'app' && user && (
        loading || !db ? (
          <div className="flex min-h-screen items-center justify-center">
            <div className="text-center">
              <img src="/brand-logo.png" className="mx-auto mb-3 h-16 w-auto object-contain" alt="" />
              <div className="text-sm text-ink/60">{t('جارٍ تحميل قاعدة البيانات…')}</div>
            </div>
          </div>
        ) : (
          <Shell>
            <Routes>
              {SCREENS.map(s => (
                <Route key={s.key} path={s.path} element={BUILT[s.key] ?? <Pending screen={s} />} />
              ))}
              <Route path="/projects" element={<Navigate to="/allowances" replace />} />
              <Route path="/settlements" element={<Navigate to="/reports" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Shell>
        )
      )}
    </>
  );
}
