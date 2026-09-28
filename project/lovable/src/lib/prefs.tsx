import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import EN from '../i18n/en.json';
import EN_EXTRA from '../i18n/en-extra.json';

/**
 * التفضيلات: اللغة (عربى/إنجليزى) والوضع (فاتح/داكن).
 * تُحفظ فى localStorage بنفس مفاتيح النموذج الأولى: eadrs.lang و eadrs.theme.
 * الترجمة من قاموس النموذج (src/i18n/en.json) — البيانات (الأسماء والمشاريع) تبقى بالعربية.
 */
export type Lang = 'ar' | 'en';
export type Theme = 'light' | 'dark';

// قاموس النموذج + نصوص جديدة أُضيفت فى تطبيق React
const DICT: Record<string, string> = { ...(EN as Record<string, string>), ...(EN_EXTRA as Record<string, string>) };

function read<T extends string>(key: string, allowed: T[], fallback: T): T {
  try { const v = localStorage.getItem(key) as T | null; return v && allowed.includes(v) ? v : fallback; } catch { return fallback; }
}
function write(key: string, v: string) { try { localStorage.setItem(key, v); } catch { /* storage blocked */ } }

let rx: RegExp | null = null;
/** نفس منطق النموذج: مطابقة كاملة أولًا، ثم استبدال المقاطع العربية المعروفة داخل النص (الأطول أولًا). */
function phraseRx() {
  if (rx) return rx;
  const keys = Object.keys(DICT)
    .filter(k => k.length >= 2 && /[؀-ۿ]/.test(k))
    .sort((a, b) => b.length - a.length)
    .map(k => k.replace(/[.*+?^$()|[\]\\{}]/g, '\\$&'));
  rx = new RegExp('(?<![\\u0621-\\u064A])(?:' + keys.join('|') + ')(?![\\u0621-\\u064A])', 'g');
  return rx;
}

export function translate(s: string, lang: Lang): string {
  if (lang === 'ar' || !s) return s;
  const t = s.trim();
  const hit = DICT[t];
  if (hit) return s.replace(t, hit);
  if (!/[؀-ۿ]/.test(t)) return s;
  return s.replace(phraseRx(), m => DICT[m] || m);
}

interface Ctx {
  lang: Lang; dir: 'rtl' | 'ltr'; theme: Theme;
  setLang: (l: Lang) => void; toggleTheme: () => void;
  /** ترجمة نص عربى؛ en اختيارى لفرض ترجمة بعينها حين يكون للكلمة أكثر من معنى (مثل خروج = Sign out لا Out). */
  t: (s: string, en?: string) => string;
}
const PrefsCtx = createContext<Ctx | null>(null);

export function PrefsProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => read('eadrs.lang', ['ar', 'en'], 'ar'));
  const [theme, setTheme] = useState<Theme>(() => read('eadrs.theme', ['light', 'dark'], 'light'));

  const setLang = useCallback((l: Lang) => { write('eadrs.lang', l); setLangState(l); }, []);
  const toggleTheme = useCallback(() => setTheme(p => { const n = p === 'dark' ? 'light' : 'dark'; write('eadrs.theme', n); return n; }), []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'en' ? 'ltr' : 'rtl';
  }, [lang]);

  const value = useMemo<Ctx>(() => ({
    lang, theme, dir: lang === 'en' ? 'ltr' : 'rtl', setLang, toggleTheme,
    t: (s: string, en?: string) => (lang === 'en' && en ? en : translate(s, lang)),
  }), [lang, theme, setLang, toggleTheme]);

  return <PrefsCtx.Provider value={value}>{children}</PrefsCtx.Provider>;
}

export function usePrefs() {
  const c = useContext(PrefsCtx);
  if (!c) throw new Error('usePrefs must be used inside PrefsProvider');
  return c;
}
