import { useEffect, useMemo, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useData } from '../lib/DataContext';
import { useAuth } from '../lib/auth';
import { usePrefs } from '../lib/prefs';
import { SCREENS, HERO_IMGS, HERO_POS, SHEET_SCREENS, screenForPath } from '../lib/screens';
import { exportVisibleTables } from '../lib/excel';

// جزيئات الغبار فى الرأس: [left%, delay s, duration s]
const DUST: [number, number, number][] = [[6, 0, 9], [14, 3.5, 10.5], [22, 7, 12], [31, 1.8, 13.5], [39, 5.2, 9], [47, 9, 10.5], [55, 2.6, 12], [63, 6.4, 13.5], [71, 0.9, 9], [79, 4.4, 10.5], [87, 8.1, 12], [93, 2.2, 13.5], [27, 10, 9], [59, 10.6, 10.5]];

export default function Shell({ children }: { children: React.ReactNode }) {
  const { db } = useData();
  const { user, logout } = useAuth();
  const { t, lang, dir, theme, setLang, toggleTheme } = usePrefs();
  const loc = useLocation();
  const heroRef = useRef<HTMLElement>(null);
  const mainRef = useRef<HTMLElement>(null);

  const screen = screenForPath(loc.pathname) ?? SCREENS[0];
  const pos = SCREENS.indexOf(screen);
  const isDashboard = screen.key === 'dashboard';

  const scopeLabel = useMemo(() => {
    if (!db) return '';
    if (user && user.projectCode && user.projectCode !== 'all' && user.role !== 'إدارة عليا') {
      const p = db.projects.find(x => x.code === user.projectCode);
      return p ? `مشروع ${p.code} — ${p.name} فقط` : `مشروع ${user.projectCode}`;
    }
    const active = new Set(db.workers.map(w => w.projectCode).filter(Boolean)).size;
    return active ? `كل المشاريع — ${active} مشروع نشط` : 'لا توجد مشاريع مسجَّلة';
  }, [db, user]);

  // حركة الرأس مع المؤشر (parallax) — تتوقف مع تفضيل تقليل الحركة
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    const move = (e: MouseEvent) => {
      const el = heroRef.current; if (!el || raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const r = el.getBoundingClientRect(); if (e.clientY > r.bottom + 200) return;
        el.style.setProperty('--mx', ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
        el.style.setProperty('--my', ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
      });
    };
    window.addEventListener('mousemove', move, { passive: true });
    return () => { window.removeEventListener('mousemove', move); cancelAnimationFrame(raf); };
  }, []);

  useEffect(() => { mainRef.current?.scrollTo({ top: 0 }); }, [loc.pathname]);

  const exportXlsx = () => {
    if (!mainRef.current) return;
    if (!exportVisibleTables(mainRef.current, screen.title)) alert(t('لا توجد جداول قابلة للتصدير فى هذه الشاشة'));
  };

  const heroSub = (isDashboard ? 'نظرة يومية على الحضور والمطابقة والاستحقاقات — ' : 'الشروق للمقاولات العمومية والتوريدات · ') + scopeLabel;
  const langBtn = (on: boolean) => ({ background: on ? '#2E3192' : 'rgba(20,20,24,.55)', color: on ? '#fff' : 'rgba(255,255,255,.85)' });

  return (
    <div className="app" data-theme={theme} dir={dir} lang={lang}>
      <div className="no-print lang-pick" role="group" aria-label="Language / اللغة">
        <button onClick={() => setLang('ar')} aria-pressed={lang === 'ar'} style={langBtn(lang === 'ar')}>العربية</button>
        <button onClick={() => setLang('en')} aria-pressed={lang === 'en'} style={langBtn(lang === 'en')}>English</button>
      </div>

      <nav className="side" aria-label={t('القائمة الرئيسية')}>
        <div className="brand">
          <img src="/brand-logo.png" alt="الشروق للمقاولات العمومية والتوريدات" />
        </div>
        {SCREENS.map(s => (
          <NavLink key={s.key} to={s.path} end={s.path === '/'} className={({ isActive }) => 'navitem' + (isActive ? ' active' : '')}>
            {t(`${s.icon} ${s.nav}`)}
          </NavLink>
        ))}
        <div style={{ marginTop: 'auto', fontSize: 12, color: 'var(--side-ink)', padding: 12, borderTop: '1px solid rgba(255,255,255,.08)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div>{t(scopeLabel)}</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <span>👤︀ {user?.name} · {user?.code}</span>
            <button className="btn btn-ghost" style={{ fontSize: 12, padding: '4px 10px', minHeight: 0 }} onClick={logout}>{t('خروج', 'Sign out')}</button>
          </div>
        </div>
      </nav>

      <main ref={mainRef} className={'main' + (SHEET_SCREENS.has(screen.key) ? '' : ' main-screen')}>
        <header ref={heroRef} className={'hero no-print' + (isDashboard ? ' lifted' : '')}>
          <div className="hero-media">
            {HERO_IMGS.map((src, i) => (
              <img key={src} className="hero-img hero-tab" src={src} alt="" aria-hidden="true" decoding="async"
                style={{ opacity: i === screen.hero ? 1 : 0, objectPosition: HERO_POS[i] }} />
            ))}
            <div className="hero-shine"><span /></div>
          </div>
          <div className="hero-overlay" />
          <div className="hero-ground"><span /></div>
          <div className="hero-dust">
            {DUST.map(([l, d, du], i) => <i key={i} style={{ left: l + '%', animationDelay: -d + 's', animationDuration: du + 's' }} />)}
          </div>
          <div className="hero-actions">
            <button className="hero-btn" onClick={exportXlsx}>⬇ Excel</button>
            <button className="hero-btn" onClick={() => window.print()}>⬇ PDF</button>
            <button className="theme-switch" role="switch" aria-checked={theme === 'dark'} title={t('تبديل الوضع الداكن / الفاتح')} onClick={toggleTheme}>
              <span className="ts-track"><span className="ts-knob" /></span>
              <span>{t('الوضع الداكن')}</span>
            </button>
          </div>
          <div className="hero-body">
            <div className="hero-kicker">DAR GROUP · ALSHOROUK CONSTRUCTION — FIELD WORKFORCE MANAGEMENT</div>
            <h2 className="hero-title">{t(screen.title)}</h2>
            <div className="hero-sub">{t(heroSub)}</div>
          </div>
          <div className="hero-index" dir="ltr">
            <b>{String(pos + 1).padStart(2, '0')}</b><span>/ {String(SCREENS.length).padStart(2, '0')}</span>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
