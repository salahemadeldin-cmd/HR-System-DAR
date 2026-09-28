import { useMemo, useRef, useState } from 'react';
import { useData } from '../lib/DataContext';
import { usePrefs } from '../lib/prefs';
import { sectorList, sectorOfProject, projectOptions, contractorOptions } from '../lib/geo';
import { printDoc } from '../lib/print';
import WorkerCard from '../components/WorkerCard';

const PER = 24;
const SELF = 'SELF';

/**
 * مولّد الباركود — كروت 54×72 مم، 24 كارت فى الصفحة، مع فلاتر المنطقة/المشروع/المقاول والبحث.
 * الطباعة تنسخ الكروت الظاهرة (عدا غير النشطين) إلى صفحة A4 بفاصل 4 مم.
 */
export default function Barcodes() {
  const { db } = useData();
  const { t, lang, dir } = usePrefs();
  const [code, setCode] = useState('');
  const [region, setRegion] = useState('all');
  const [project, setProject] = useState('all');
  const [contractor, setContractor] = useState('all');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  const projOpts = useMemo(() => (db ? projectOptions(db, region) : []), [db, region]);
  const conOpts = useMemo(() => (db ? contractorOptions(db, region, project) : []), [db, region, project]);

  const list = useMemo(() => {
    if (!db) return [];
    const cq = code.trim(), s = q.trim();
    return db.workers.filter(w =>
      (project === 'all' || w.projectCode === project) &&
      (contractor === 'all' || (contractor === SELF ? !w.contractorCode : w.contractorCode === contractor)) &&
      (region === 'all' || sectorOfProject(w.projectCode).sectorCode === region) &&
      (!cq || w.code.includes(cq)) &&
      (!s || w.name.includes(s) || (w.nationalId || '').includes(s)));
  }, [db, code, region, project, contractor, q]);

  const pages = Math.max(1, Math.ceil(list.length / PER));
  const pg = Math.min(page, pages - 1);
  const cards = list.slice(pg * PER, pg * PER + PER);
  const inactive = cards.filter(w => !w.active).length;
  const reset = <T,>(fn: (v: T) => void) => (v: T) => { fn(v); setPage(0); };

  const print = () => {
    const el = wrapRef.current; if (!el) return;
    const c = el.cloneNode(true) as HTMLElement;
    c.querySelectorAll('.no-print').forEach(x => x.remove());
    c.querySelectorAll('img[src^="/"]').forEach(im => im.setAttribute('src', new URL(im.getAttribute('src')!, location.href).href));
    const html = `<!doctype html><html dir="${dir}" lang="${lang}"><head><meta charset="utf-8"><title>${lang === 'en' ? 'Worker cards' : 'بطاقات العمال'}</title>`
      + '<style>@page{size:A4 portrait;margin:8mm}*{box-sizing:border-box}body{margin:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}'
      + '.wrap{display:flex;flex-wrap:wrap;gap:4mm}.worker-card{box-shadow:none!important}</style></head><body>'
      + `<div class="wrap">${c.innerHTML}</div></body></html>`;
    printDoc(html, 'cards');
  };

  if (!db) return null;

  return (
    <>
      <div className="no-print">
        <h1 style={{ fontSize: 26, marginBottom: 2 }}>{t('مولّد الباركود (EAN-13)')}</h1>
        <p style={{ color: 'var(--color-neutral-600)', marginBottom: 'var(--space-4)' }}>
          {t('باركود تجارى EAN-13 (مثل باركود السلع) ثابت لكل موظف — يُقرأ بأى قارئ باركود يدوى — لا تتغير طالما لم تتغير بياناته أو موقعه؛ أى نقل أو تعديل وظيفى يُصدر رمزًا جديدًا تلقائيًا')}
        </p>
        <div className="toolbar" style={{ flexWrap: 'wrap', alignItems: 'flex-end', gap: 'var(--space-3)' }}>
          <div className="field" style={{ margin: 0, minWidth: 160 }}><label>{t('كود الموظف')}</label><input className="input" dir="ltr" placeholder="14710001" value={code} onChange={e => reset(setCode)(e.target.value)} /></div>
          <div className="field" style={{ margin: 0, minWidth: 180 }}><label>{t('المنطقة')}</label>
            <select className="input" value={region} onChange={e => { reset(setRegion)(e.target.value); setProject('all'); setContractor('all'); }}>
              <option value="all">{t('كل المناطق')}</option>
              {sectorList().map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
            </select>
          </div>
          <div className="field" style={{ margin: 0, minWidth: 220 }}><label>{t('المشروع')}</label>
            <select className="input" value={project} onChange={e => { reset(setProject)(e.target.value); setContractor('all'); }}>
              <option value="all">{t('كل المشروعات')}</option>
              {projOpts.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
            </select>
          </div>
          <div className="field" style={{ margin: 0, minWidth: 220 }}><label>{t('المقاول')}</label>
            <select className="input" value={contractor} onChange={e => reset(setContractor)(e.target.value)}>
              <option value="all">{t('كل المقاولين')}</option>
              <option value={SELF}>{t('عمالة ذاتية — الشروق')}</option>
              {conOpts.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
          </div>
          <div className="field" style={{ margin: 0, minWidth: 200 }}><label>{t('بحث بالاسم أو الرقم القومى')}</label><input className="input" value={q} onChange={e => reset(setQ)(e.target.value)} /></div>
          <span className="tag tag-neutral">{list.length.toLocaleString('en-US')} {t('عامل')}</span>
          <div style={{ marginInlineStart: 'auto', display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
            <button className="btn btn-ghost btn-icon" aria-label={t('السابق')} onClick={() => setPage(Math.max(0, pg - 1))}>◄</button>
            <span style={{ fontSize: 13, color: 'var(--color-neutral-600)' }}>{t('صفحة')} {pg + 1} / {pages}</span>
            <button className="btn btn-ghost btn-icon" aria-label={t('التالي')} onClick={() => setPage(Math.min(pages - 1, pg + 1))}>►</button>
            <button className="btn btn-primary" onClick={print} disabled={!cards.length}>{t('🖨 طباعة البطاقات')}</button>
            {inactive > 0 && <span style={{ fontSize: 12, color: '#B3261E', fontWeight: 600 }}>{inactive} {t('غير نشط — لن يُطبع')}</span>}
          </div>
        </div>
      </div>
      <div ref={wrapRef} style={{ display: 'flex', flexWrap: 'wrap', gap: '4mm', marginTop: 'var(--space-3)' }}>
        {cards.map(w => <WorkerCard key={w.code} w={w} />)}
      </div>
    </>
  );
}
