import { useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useData } from '../lib/DataContext';
import { useAuth } from '../lib/auth';
import { usePrefs } from '../lib/prefs';
import { projectLabel, sectorOfProject } from '../lib/geo';
import { dailyRate } from '../lib/calc';
import { workEndOf } from '../lib/barcode';
import { birthFromNationalId, placeFromNationalId, dmy } from '../lib/nid';
import { esc, printDoc } from '../lib/print';
import WorkerCard from './WorkerCard';
import type { Worker } from '../lib/types';

const f = (n: number) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const h1 = (n: number) => (Math.round(n * 10) / 10).toFixed(1);

/**
 * نافذة ملف العامل — خلفية مصمتة (أبيض فاتح / #0f172a داكن) ورأس داكن وزر طباعة.
 * ملخص الحضور والمالى محسوب من سجلات السراكى (دخول/خروج/ساعات) بعد خصم ساعة راحة،
 * ويوم العمل 8 ساعات، والراتب الشهرى = اليومية × 26 — نفس معادلات النموذج.
 */
export default function WorkerDetail({ w, onClose, onUpdate }: { w: Worker; onClose: () => void; onUpdate?: (patch: Partial<Worker>) => void }) {
  const { db } = useData();
  const { user } = useAuth();
  const { t, lang, dir, theme } = usePrefs();
  const dlgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);

  const d = useMemo(() => {
    const rate = Number(w.rate) || (db ? dailyRate(db, w.profession, w.category) : 0);
    const rows = (db?.sarakEntries || []).filter(s => s.workerCode === w.code && s.workDate).sort((a, b) => a.workDate!.localeCompare(b.workDate!));
    let pairs = 0, sum = 0, ot = 0, short = 0, sahar = 0, khasm = 0;
    for (const r of rows) {
      sahar += r.overtimeHours || 0;
      khasm += r.deductionHours || 0;
      if (!r.hours) continue;
      const net = Math.max(0, r.hours - 1);
      pairs++; sum += net; ot += Math.max(0, net - 8); short += Math.max(0, 8 - net);
    }
    const days = rows.length;
    const otH = ot + sahar, otV = otH * rate / 8, dedV = (short + khasm) * rate / 8, baseV = days * rate;
    const extract = baseV + otV - dedV;
    const today = new Date().toISOString().slice(0, 10);
    const present = rows.some(r => r.workDate === today);
    return { rate, days, pairs, sum, ot, short, sahar, khasm, otH, otV, dedV, baseV, extract, present, last: rows.length ? rows[rows.length - 1].workDate! : '' };
  }, [db, w]);

  const con = db?.contractors.find(c => c.code === w.contractorCode);
  const contractorName = !w.contractorCode ? t('عمالة ذاتية') : (con?.name || w.contractorCode);
  const inactive = !w.active;

  const info: [string, string][] = [
    ['الاسم رباعى', w.name || '—'], ['الرقم القومى', w.nationalId || '—'],
    ['تاريخ الميلاد', dmy(w.birthDate || birthFromNationalId(w.nationalId)) || '—'], ['محل الميلاد', w.birthPlace || placeFromNationalId(w.nationalId) || '—'],
    ['الإدارة', w.department || '—'], ['الوظيفة', w.profession || '—'],
    ['الفئة / الدرجة', `${w.category || '—'} · ${f(d.rate)} ${t('ج.م/يوم')}`], ['ساعات العمل', `${w.hours || 8} ${t('ساعات')}`],
    ['المشروع', projectLabel(db, w.projectCode)], ['القطاع', t(sectorOfProject(w.projectCode).sectorName)],
    ['المقاول', !w.contractorCode ? t('عمالة ذاتية') : `${w.contractorCode} — ${con?.name || '—'}`], ['بدل المنطقة', `${f(w.allowance)} ${t('ج.م')}`],
    ['تاريخ أمر الشغل', dmy(w.regDate) || '—'], ['أمر الشغل', w.workOrderFile ? '📎 ' + w.workOrderFile : t('غير مرفق')],
    ['تاريخ البداية', dmy(w.startDate) || '—'], ['تاريخ النهاية', dmy(workEndOf(w.startDate, w.endDate)) || '—'],
  ];

  const stat = (k: string, v: string, color: string) => (
    <div style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', borderTop: `3px solid ${color}`, borderRadius: 4, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
      <span style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{t(k)}</span>
      <span dir="ltr" style={{ fontSize: 19, fontWeight: 700, color: 'var(--ink)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{v}</span>
    </div>
  );

  const onCardImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || !onUpdate) return;
    const rd = new FileReader();
    rd.onload = () => onUpdate({ cardImage: String(rd.result) });
    rd.readAsDataURL(file);
  };

  const print = () => {
    const dlg = dlgRef.current; if (!dlg) return;
    const en = lang === 'en';
    const c = dlg.cloneNode(true) as HTMLElement;
    c.querySelectorAll('button, label.btn, input[type=file]').forEach(x => x.remove());
    c.removeAttribute('role'); c.className = 'pf'; c.style.cssText = '';
    const head = c.children[0] as HTMLElement | undefined; if (head) head.style.cssText = 'display:none';
    const body = c.children[1] as HTMLElement | undefined; if (body) body.style.cssText = 'padding:14px 0;display:flex;flex-direction:column;gap:14px';
    c.querySelectorAll('img[src^="/"]').forEach(im => im.setAttribute('src', new URL(im.getAttribute('src')!, location.href).href));
    const ttl = (en ? 'Worker profile — ' : 'ملف العامل — ') + w.name + ' (' + w.code + ')';
    const now = new Date(), stamp = now.toLocaleDateString('en-GB') + ' ' + now.toTimeString().slice(0, 5);
    const logo = new URL('/brand-logo.png', location.href).href;
    const side = en ? 'left' : 'right';
    const html = `<!doctype html><html dir="${dir}" lang="${lang}"><head><meta charset="utf-8"><title>${esc(ttl)}</title><style>`
      + ':root{--surface:#fff;--surface-2:#F1F3F7;--ink:#1E1E21;--ink-2:#2B2B2E;--ink-3:#55565C;--line:#D5D9E2;--line-2:#C3C8D4;--accent-fg:#2E3192;--color-accent:#2E3192;--color-accent-700:#1C1F66;--color-accent-100:#ECEEF8}'
      + `@page{size:A4 portrait;margin:10mm}*{box-sizing:border-box}html,body{direction:${dir};text-align:${side}}body{margin:0;background:#fff;color:#1E1E21;font-family:${en ? "'Times New Roman',Times,serif" : "Calibri,'Segoe UI',Tahoma,sans-serif"};font-size:12px;-webkit-print-color-adjust:exact;print-color-adjust:exact;font-variant-numeric:tabular-nums}`
      + '.hd{display:flex;align-items:center;gap:14px;border-bottom:3px solid #2E3192;padding-bottom:10px}.hd img{height:46px}.hd .t{flex:1}.hd h1{margin:0;font-size:19px;color:#1C1F66}.hd .s{font-size:11px;color:#55565C;margin-top:2px}'
      + '.id{display:flex;gap:10px;align-items:center;margin-top:10px;background:#2B2B2E;color:#fff;padding:10px 14px;border-radius:4px}.id b{font-size:17px}.id span{font-family:monospace;background:rgba(255,255,255,.14);padding:2px 8px;border-radius:3px}'
      + `table{width:100%;border-collapse:collapse;font-size:11.5px}th{background:#2E3192;color:#fff;padding:6px 8px;text-align:${side}}td{text-align:${side};padding:6px 8px;border-bottom:1px solid #D5D9E2}`
      + '.pf [style*="grid-template-columns: repeat(auto-fit"]{grid-template-columns:repeat(3,1fr)!important}.pf > div > div{break-inside:avoid}'
      + '.ft{margin-top:18px;display:grid;grid-template-columns:repeat(3,1fr);gap:24px;font-size:11px;color:#55565C}.ft div{border-top:1px solid #8A8C94;padding-top:6px;text-align:center}'
      + '</style></head><body>'
      + `<div class="hd"><img src="${logo}" alt=""><div class="t"><h1>${en ? 'Worker Profile' : 'ملف العامل'}</h1><div class="s">${en ? 'Al Sherouk General Contracting & Public Sector Supplies' : 'الشروق للمقاولات العمومية والتوريدات للقطاع العام'}</div></div>`
      + `<div class="s" style="text-align:end">${en ? 'Printed: ' : 'تاريخ الطباعة: '}${stamp}${user ? '<br>' + (en ? 'By: ' : 'بواسطة: ') + esc(user.name) : ''}</div></div>`
      + `<div class="id"><b>${esc(w.name)}</b><span dir="ltr">${esc(w.code)}</span><span>${esc(t(inactive ? 'غير نشط' : 'نشط'))}</span></div>`
      + c.outerHTML
      + `<div class="ft"><div>${en ? 'Prepared by' : 'إعداد'}</div><div>${en ? 'Reviewed by' : 'مراجعة'}</div><div>${en ? 'Approved by' : 'اعتماد'}</div></div>`
      + '</body></html>';
    printDoc(html, ttl);
  };

  const breakdown: [string, string, string][] = [
    ['أيام الحضور', `${d.days} ${t('يوم')} × ${f(d.rate)}`, f(d.baseV)],
    ['الإضافى (بصمة + سهر السراكى)', `${h1(d.ot)} + ${h1(d.sahar)} ${t('س')} × ${f(d.rate / 8)}`, f(d.otV)],
    ['الخصومات', `${h1(d.short)} ${t('س نقص')} + ${h1(d.khasm)} ${t('س خصم')} × ${f(d.rate / 8)}`, '− ' + f(d.dedV)],
    ['إجمالى المستخلص', '', f(d.extract)],
  ];

  return createPortal(
    <div className="no-print dlg-ovl" data-theme={theme} lang={lang} dir={dir} onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'var(--modal-ovl)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
      <div ref={dlgRef} role="dialog" dir={dir} aria-modal="true" aria-label={t('تفاصيل العامل')} className="wd-dlg" onClick={e => e.stopPropagation()}
        style={{ width: 'min(1080px,100%)', maxHeight: 'calc(100vh - 48px)', display: 'flex', flexDirection: 'column', background: '#ffffff', color: 'var(--ink)', borderRadius: 6, boxShadow: '0 24px 64px rgba(0,0,0,.38)', overflow: 'hidden' }}>
        <div style={{ background: '#2B2B2E', color: '#fff', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14, borderBottom: '3px solid #2E3192', flex: 'none', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <div style={{ fontSize: 11, letterSpacing: '.08em', color: 'rgba(255,255,255,.7)' }}>{t('ملف العامل')} · {contractorName}</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{w.name}</div>
          </div>
          <span dir="ltr" style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 14, background: 'rgba(255,255,255,.12)', padding: '3px 10px', borderRadius: 3 }}>{w.code}</span>
          <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 3, background: inactive ? '#B3261E' : '#2E3192', color: '#fff' }}>{t(inactive ? 'غير نشط' : 'نشط')}</span>
          <button className="wd-print" onClick={print} title={t('طباعة ملف العامل')}
            style={{ marginInlineStart: 'auto', border: '1px solid rgba(255,255,255,.6)', background: '#2E3192', color: '#fff', height: 34, padding: '0 14px', borderRadius: 4, font: 'inherit', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {t('🖨 طباعة ملف العامل')}
          </button>
          <button className="wd-close" onClick={onClose} title={t('إغلاق')} aria-label={t('إغلاق')}
            style={{ border: '1px solid rgba(255,255,255,.5)', background: 'transparent', color: '#fff', width: 34, height: 34, borderRadius: 4, fontSize: 18, cursor: 'pointer' }}>×</button>
        </div>

        <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 18, overflow: 'auto', flex: 1, minHeight: 0 }}>
          <div className="wd-top" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 250px', gap: 18 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-fg)', marginBottom: 8 }}>{t('البيانات الشخصية والوظيفية')}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', border: '1px solid var(--line)', borderRadius: 4, overflow: 'hidden' }}>
                {info.map(([k, v]) => (
                  <div key={k} style={{ display: 'grid', gridTemplateColumns: '120px minmax(0,1fr)', borderBottom: '1px solid var(--line)' }}>
                    <span style={{ background: 'var(--surface-2)', padding: '7px 10px', fontSize: 12, color: 'var(--ink-3)', fontWeight: 600 }}>{t(k)}</span>
                    <span style={{ padding: '7px 10px', fontSize: 13, fontWeight: 600, color: 'var(--ink)', overflowWrap: 'anywhere' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
                <span style={{ fontSize: 11.5, color: 'var(--ink-3)', fontWeight: 600, alignSelf: 'flex-start' }}>{t('كارت الباركود')}</span>
                <div style={{ margin: '0 auto' }}><WorkerCard w={w} /></div>
              </div>
              <div style={{ border: '1px solid var(--line)', borderRadius: 4, padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 11.5, color: 'var(--ink-3)', fontWeight: 600 }}>{t('صورة البطاقة الشخصية')}</span>
                {w.cardImage
                  ? <img src={w.cardImage} alt={t('صورة البطاقة')} style={{ width: '100%', aspectRatio: '1.58', objectFit: 'cover', borderRadius: 3, border: '1px solid var(--line)' }} />
                  : <div style={{ aspectRatio: '1.58', border: '1px dashed var(--line-2)', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--ink-3)', textAlign: 'center', padding: 8 }}>{t('لم تُرفع صورة البطاقة')}</div>}
                {onUpdate && (
                  <label className="btn btn-secondary" style={{ cursor: 'pointer', margin: 0, justifyContent: 'center', fontSize: 12.5 }}>
                    {t('📎 رفع / تغيير الصورة')}<input type="file" accept="image/*" style={{ display: 'none' }} onChange={onCardImage} />
                  </label>
                )}
              </div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-fg)', marginBottom: 8 }}>{t('ملخص الحضور والتشغيل')}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 10 }}>
              {stat('حضور اليوم', t(d.present ? 'حاضر' : 'لم يسجَّل'), d.present ? '#2E3192' : '#B3261E')}
              {stat('إجمالى أيام الحضور', String(d.days), '#2E3192')}
              {stat('متوسط ساعات العمل / يوم', d.pairs ? h1(d.sum / d.pairs) + ' ' + t('س') : '—', '#2E3192')}
              {stat('آخر يوم حضور', dmy(d.last) || '—', '#8D9098')}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-fg)', marginBottom: 8 }}>{t('الملخص المالى والرواتب')}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 10, marginBottom: 10 }}>
              {stat('الراتب الشهرى (26 يوم)', f(d.rate * 26), '#2E3192')}
              {stat('إجمالى المستخلص', f(d.extract), '#1C1F66')}
              {stat('إجمالى ساعات الإضافى', h1(d.otH) + ' ' + t('س'), '#F2A900')}
              {stat('قيمة الإضافى', f(d.otV), '#F2A900')}
              {stat('ساعات الخصم', h1(d.short + d.khasm) + ' ' + t('س'), '#B3261E')}
              {stat('قيمة الخصومات', f(d.dedV), '#B3261E')}
            </div>
            <table className="dt">
              <thead><tr><th>{t('البند')}</th><th>{t('الأساس')}</th><th>{t('القيمة (ج.م)')}</th></tr></thead>
              <tbody>
                {breakdown.map(([k, b, v]) => (
                  <tr key={k}><td style={{ fontWeight: 600 }}>{t(k)}</td><td>{b}</td><td dir="ltr" style={{ fontWeight: 700, textAlign: 'right' }}>{v}</td></tr>
                ))}
              </tbody>
            </table>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 6 }}>
              {t('الساعات محسوبة من سجلات السراكى (دخول/خروج) بعد خصم ساعة راحة · يوم العمل 8 ساعات · الراتب الشهرى = اليومية × 26 يوم')}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
