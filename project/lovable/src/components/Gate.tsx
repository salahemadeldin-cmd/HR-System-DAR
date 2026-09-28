import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { usePrefs } from '../lib/prefs';

export type GateStage = 'splash' | 'login' | 'loading' | 'app';

/**
 * بوابة الدخول — ثلاث شاشات كما فى النموذج:
 * splash (مقدمة متحركة 5 ث) ← login (كود الموظف + كلمة المرور) ← loading (ترحيب 5 ث) ← app.
 * الضغط على المقدمة أو الترحيب يتخطاهما.
 */
export default function Gate({ stage, setStage }: { stage: GateStage; setStage: (s: GateStage) => void }) {
  const { user, login } = useAuth();
  const { t, dir } = usePrefs();
  const [code, setCode] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    if (stage === 'splash') {
      const id = setTimeout(() => setStage(user ? 'app' : 'login'), 5000);
      return () => clearTimeout(id);
    }
    if (stage === 'loading') {
      const id = setTimeout(() => setStage('app'), 5000);
      return () => clearTimeout(id);
    }
  }, [stage, user, setStage]);

  if (stage === 'app') return null;

  const skip = () => {
    if (stage === 'splash') setStage(user ? 'app' : 'login');
    else if (stage === 'loading') setStage('app');
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const m = login(code, pass);
    if (m) { setErr(m); return; }
    setErr(''); setPass(''); setStage('loading');
  };

  return (
    <div className="gate no-print" dir={dir}>
      {stage === 'splash' && (
        <div className="gi" onClick={skip}>
          <div className="gi-stars" />
          <img className="gi-img" src="/assets/intro-3.jpg" alt="مجموعة دار — الشروق للمقاولات" />
          <div className="gi-vign" />
          <div className="gi-orbit"><i /></div>
          <div className="gi-sweep" />
          <div className="gi-flare" />
          <div className="gi-skip">{t('اضغط للتخطي')}</div>
          <div className="gi-foot">
            <div className="gate-logo"><img src="/brand-logo.png" alt="الشروق للمقاولات العمومية والتوريدات" /></div>
            <div className="gate-kicker">DAR GROUP · ALSHOROUK CONSTRUCTION — FIELD WORKFORCE MANAGEMENT</div>
            <div className="gi-title">{t('نظام العمالة')} <span>{t('غير المنتظمة')}</span></div>
            <div style={{ fontSize: 15, color: 'rgba(255,255,255,.9)' }}>{t('من السماء إلى الأرض… وكل ما بينهما')}</div>
            <div className="gi-bar"><span /></div>
          </div>
          <div className="gi-tape" />
        </div>
      )}

      {stage === 'loading' && (
        <div className="gw" onClick={skip}>
          <img className="gw-img" src="/assets/welcome.jpeg" alt="مقر مجموعة دار — الشروق للمقاولات" />
          <div className="gw-sky" />
          <div className="gw-glint" />
          <div className="gw-shade" />
          <div className="gi-skip">{t('اضغط للتخطى')}</div>
          <div className="gw-foot">
            <div className="gw-line" />
            <div className="gw-title" dir="ltr"><span>Welcome</span> <span>to</span> <b>DAR</b> <span>Group</span></div>
            <div className="gw-sub">{t('أهلًا')} {user?.name} — {t('جارِ تجهيز النظام')}</div>
            <div className="gi-bar"><span /></div>
          </div>
        </div>
      )}

      {stage === 'login' && (
        <div className="gate-scene">
          <img className="gate-bg gl-bg" src="/assets/login-bg.png" alt="مهندس موقع يراجع نموذج المشروع" style={{ objectPosition: '50% 38%' }} />
          <div className="gate-shade" style={{ background: 'linear-gradient(180deg,rgba(12,14,40,.55) 0%,rgba(28,31,102,.45) 40%,rgba(12,14,40,.85) 100%),radial-gradient(ellipse at 50% 55%,rgba(28,31,102,.25) 0%,rgba(8,8,14,.6) 100%)' }} />
          <div className="gl-scan" />
          <div className="gate-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 22 }}>
            <img className="gl-dar" src="/assets/dar-logo-white.png" alt="مجموعة دار — DAR GROUP" />
            <form className="gate-card gl-card" onSubmit={submit}>
              <img src="/brand-logo.png" alt="الشروق للمقاولات" style={{ height: 46, alignSelf: 'center' }} />
              <h1 style={{ textAlign: 'center' }}>{t('تسجيل الدخول')}</h1>
              <div style={{ fontSize: 13, color: '#55565C', marginTop: -6, textAlign: 'center' }}>{t('ادخل كود الموظف وكلمة المرور')}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label htmlFor="gate-code">{t('كود الموظف')}</label>
                <input id="gate-code" className="gate-in" autoFocus autoComplete="username" inputMode="numeric"
                  value={code} onChange={e => { setCode(e.target.value); setErr(''); }} placeholder={t('كود الموظف — مثال: 0001')} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label htmlFor="gate-pass">{t('كلمة المرور')}</label>
                <input id="gate-pass" className="gate-in" type="password" autoComplete="current-password"
                  value={pass} onChange={e => { setPass(e.target.value); setErr(''); }} placeholder="•••••" />
              </div>
              {err && <div role="alert" style={{ fontSize: 13, fontWeight: 600, color: '#B3261E' }}>{t(err)}</div>}
              <button className="gate-btn" type="submit" style={{ width: '100%' }}>{t('دخول', 'Sign in')}</button>
              <div style={{ fontSize: 12, color: '#55565C', textAlign: 'center' }}>
                {t('كلمة المرور المؤقتة لجميع المستخدمين:')} <b style={{ fontVariantNumeric: 'tabular-nums' }}>00000</b> {t('— تُغيَّر لاحقًا.')}
              </div>
            </form>
          </div>
          <div className="gate-tape" />
        </div>
      )}
    </div>
  );
}
