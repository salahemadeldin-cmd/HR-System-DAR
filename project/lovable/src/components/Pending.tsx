import type { Screen } from '../lib/screens';
import { usePrefs } from '../lib/prefs';

/** شاشة لم تُنقل بعد من النموذج الأولى — تظهر فى مكانها حتى تُبنى فى مرحلتها. */
export default function Pending({ screen }: { screen: Screen }) {
  const { t } = usePrefs();
  return (
    <div className="card" style={{ textAlign: 'center', padding: 32 }}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>{screen.icon}</div>
      <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--accent-fg)' }}>{t(screen.title)}</div>
      <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 6 }}>{t('هذه الشاشة قيد النقل من النموذج الأولى وستُضاف فى المرحلة التالية.')}</div>
    </div>
  );
}
