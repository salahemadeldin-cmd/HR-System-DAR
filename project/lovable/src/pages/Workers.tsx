import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../lib/DataContext';
import { usePrefs } from '../lib/prefs';
import { DEPARTMENTS, normalizeDept } from '../lib/dept';
import { dailyRate } from '../lib/calc';
import { sectorList, sectorOfProject, projectOptions, contractorOptions, projectLabel } from '../lib/geo';
import { isValidNationalId, birthFromNationalId, placeFromNationalId, dmy } from '../lib/nid';
import { workEndOf } from '../lib/barcode';
import { exportSheet } from '../lib/excel';
import WorkerDetail from '../components/WorkerDetail';
import type { Grade, Worker } from '../lib/types';

const PAGE = 60;
const SELF = 'SELF';
const f2 = (n: number) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function ageOf(iso?: string | null) {
  if (!iso) return '—';
  const d = new Date(iso); if (isNaN(+d)) return '—';
  const t = new Date(); let a = t.getFullYear() - d.getFullYear();
  if (t.getMonth() < d.getMonth() || (t.getMonth() === d.getMonth() && t.getDate() < d.getDate())) a--;
  return String(a);
}

/** كود العامل التلقائى: باطن = أول 5 أرقام من كود المقاول + تسلسل؛ ذاتى = كود المشروع + 10 + تسلسل. */
function nextWorkerCode(workers: Worker[], contractor: string, project: string): string {
  if (!contractor) return '';
  const self = contractor === SELF;
  if (self && !project) return '';
  const prefix = self ? project + '10' : contractor.slice(0, 5);
  let last = parseInt(self ? project + '10000' : contractor, 10);
  if (isNaN(last)) return '';
  for (const w of workers) {
    if (!w.code.startsWith(prefix)) continue;
    const n = parseInt(w.code, 10);
    if (!isNaN(n) && n > last) last = n;
  }
  return String(last + 1);
}

export default function Workers() {
  const { db, update, can } = useData();
  const { t } = usePrefs();
  const nav = useNavigate();

  // الفلاتر (صف واحد)
  const [sector, setSector] = useState('all');
  const [project, setProject] = useState('all');
  const [contractor, setContractor] = useState('all');
  const [prof, setProf] = useState('');
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(0);

  const [showForm, setShowForm] = useState(false);
  const [editCode, setEditCode] = useState<string | null>(null);
  const [detailCode, setDetailCode] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, boolean>>({}); // code → active (تعديلات الحالة غير المحفوظة)
  const [lastSaved, setLastSaved] = useState('');
  const gridRef = useRef<HTMLDivElement>(null);

  const workers = db?.workers ?? [];
  const byCode = useMemo(() => new Map(workers.map(w => [w.code, w])), [workers]);
  const conName = useMemo(() => new Map((db?.contractors ?? []).map(c => [c.code, c.name])), [db]);

  const profOptions = useMemo(() => [...new Set(workers.map(w => w.profession).filter(Boolean))].sort(), [workers]);
  const projOpts = useMemo(() => (db ? projectOptions(db, sector) : []), [db, sector]);
  const conOpts = useMemo(() => (db ? contractorOptions(db, sector, project) : []), [db, sector, project]);

  const filtered = useMemo(() => {
    const s = q.trim();
    return workers.filter(w =>
      (sector === 'all' || sectorOfProject(w.projectCode).sectorCode === sector) &&
      (project === 'all' || w.projectCode === project) &&
      (contractor === 'all' || (contractor === SELF ? !w.contractorCode : w.contractorCode === contractor)) &&
      (!prof || w.profession === prof) &&
      (!status || (status === 'نشط') === w.active) &&
      (!s || w.name.includes(s) || w.code.includes(s) || (w.nationalId || '').includes(s)));
  }, [workers, sector, project, contractor, prof, status, q]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const pg = Math.min(page, pages - 1);
  const shown = filtered.slice(pg * PAGE, pg * PAGE + PAGE);
  const anyFilter = sector !== 'all' || project !== 'all' || contractor !== 'all' || !!prof || !!status || !!q;
  const resetFilters = () => { setSector('all'); setProject('all'); setContractor('all'); setProf(''); setStatus(''); setQ(''); setPage(0); };
  const onFilter = <T,>(set: (v: T) => void) => (v: T) => { set(v); setPage(0); };

  const patchWorker = (code: string, patch: Partial<Worker>) =>
    update(d => ({ ...d, workers: d.workers.map(w => (w.code === code ? { ...w, ...patch } : w)) }));

  const statusPatch = (active: boolean): Partial<Worker> => ({ active, leaveDate: active ? null : new Date().toISOString().slice(0, 10) });
  const saveOne = (code: string) => {
    if (!(code in drafts)) return;
    patchWorker(code, statusPatch(drafts[code]));
    setDrafts(({ [code]: _, ...rest }) => rest);
    setLastSaved(new Date().toLocaleTimeString('en-GB'));
  };
  const saveAll = () => {
    const d = drafts;
    update(db2 => ({ ...db2, workers: db2.workers.map(w => (w.code in d ? { ...w, ...statusPatch(d[w.code]) } : w)) }));
    setDrafts({});
    setLastSaved(new Date().toLocaleTimeString('en-GB'));
  };
  const remove = (w: Worker) => {
    if (!window.confirm(t('حذف العامل') + ` ${w.name} (${w.code})؟`)) return;
    update(d => ({ ...d, workers: d.workers.filter(x => x.code !== w.code) }));
  };

  const exportXlsx = () => exportSheet(filtered.map(w => ({
    'كود العامل': w.code, 'الاسم': w.name, 'المهنة': w.profession, 'الرقم القومي': w.nationalId,
    'الإدارة': w.department, 'الدرجة': w.category, 'الحالة': w.active ? 'نشط' : 'غير نشط',
    'المشروع': projectLabel(db, w.projectCode), 'القطاع': sectorOfProject(w.projectCode).sectorName,
    'كود المقاول': w.contractorCode || 'ذاتى', 'اسم المقاول': w.contractorCode ? conName.get(w.contractorCode) || '' : 'عمالة ذاتية',
  })), 'العمال');

  // تمرير أفقى بالسحب أو بالأسهم — الكود والاسم ثابتان
  // dx موجب = يمين الشاشة، سالب = يسارها (scrollLeft يعمل بالاتجاه المرئى فى RTL و LTR)
  const scrollGrid = (dx: number) => gridRef.current?.scrollBy({ left: dx, behavior: 'smooth' });
  const onGridDown = (e: React.PointerEvent) => {
    const el = gridRef.current, tgt = e.target as HTMLElement;
    if (!el || e.button !== 0 || tgt.closest('button,select,input,a') || tgt.closest('td:nth-child(1),td:nth-child(2)')) return;
    const x0 = e.clientX, s0 = el.scrollLeft; let moved = false;
    const mv = (ev: PointerEvent) => { const d = ev.clientX - x0; if (!moved && Math.abs(d) < 4) return; moved = true; el.classList.add('drag'); el.scrollLeft = s0 - d; };
    const up = () => { el.classList.remove('drag'); window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
  };

  if (!db) return null;
  const selfCount = workers.filter(w => !w.contractorCode).length;
  const dirtyCount = Object.keys(drafts).length;
  const savedLabel = lastSaved ? t('آخر حفظ:') + ' ' + lastSaved : t('لا توجد تعديلات محفوظة فى هذه الجلسة');
  const detail = detailCode ? byCode.get(detailCode) : null;
  const editing = editCode ? byCode.get(editCode) : null;

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap', marginBottom: 'var(--space-2)' }}>
        <h1 style={{ fontSize: 26, margin: 0 }}>{t('إدارة العمال والمقاولين')}</h1>
        <div style={{ marginInlineStart: 'auto', display: 'flex', gap: 'var(--space-2)' }}>
          <button className="btn btn-secondary" onClick={exportXlsx}>{t('⬇ تصدير إلى Excel')}</button>
          <button className="btn btn-ghost" onClick={() => nav('/barcodes')}>{t('▦ مولّد الباركود')}</button>
        </div>
      </div>

      <div className="toolbar" style={{ flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <span className="tag tag-neutral">{filtered.length.toLocaleString('en-US')} {t('عامل')}</span>
        <div className="field" style={{ margin: 0, marginInlineStart: 'auto', minWidth: 180 }}>
          <label>{t('القطاع')}</label>
          <select className="input" value={sector} onChange={e => { onFilter(setSector)(e.target.value); setProject('all'); setContractor('all'); }}>
            <option value="all">{t('كل القطاعات')}</option>
            {sectorList().map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
          </select>
        </div>
        <div className="field" style={{ margin: 0, minWidth: 220 }}>
          <label>{t('المشروع')}</label>
          <select className="input" value={project} onChange={e => { onFilter(setProject)(e.target.value); setContractor('all'); }}>
            <option value="all">{t('كل المشروعات')}</option>
            {projOpts.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
          </select>
        </div>
        <div className="field" style={{ margin: 0, minWidth: 220 }}>
          <label>{t('المقاول')}</label>
          <select className="input" value={contractor} onChange={e => onFilter(setContractor)(e.target.value)}>
            <option value="all">{t('كل المقاولين')}</option>
            <option value={SELF}>{t('عمالة ذاتية — الشروق')}</option>
            {conOpts.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
          </select>
        </div>
        <div className="field" style={{ margin: 0, minWidth: 180 }}>
          <label>{t('المهنة')}</label>
          <select className="input" value={prof} onChange={e => onFilter(setProf)(e.target.value)}>
            <option value="">{t('كل المهن')}</option>
            {profOptions.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div className="field" style={{ margin: 0, minWidth: 130 }}>
          <label>{t('الحالة')}</label>
          <select className="input" value={status} onChange={e => onFilter(setStatus)(e.target.value)}>
            <option value="">{t('الكل')}</option><option value="نشط">{t('نشط')}</option><option value="غير نشط">{t('غير نشط')}</option>
          </select>
        </div>
        <div className="field" style={{ margin: 0, minWidth: 220 }}>
          <label>{t('بحث')}</label>
          <input className="input" placeholder={t('بحث بالاسم أو الكود أو الرقم القومى…')} value={q} onChange={e => onFilter(setQ)(e.target.value)} />
        </div>
        {anyFilter && <button className="btn btn-ghost" style={{ color: '#B3261E', alignSelf: 'flex-end' }} onClick={resetFilters}>{t('✕ مسح الفلاتر')}</button>}
        {can('addWorker') && (
          <button className="btn btn-primary" onClick={() => setShowForm(v => !v)}>{t(showForm ? 'إخفاء النموذج' : '+ إضافة عامل')}</button>
        )}
      </div>

      {showForm && <AddWorkerForm onDone={code => { setShowForm(false); setDetailCode(code); }} />}
      {editing && <EditPersonal w={editing} onClose={() => setEditCode(null)} onSave={p => { patchWorker(editing.code, p); setEditCode(null); }} />}

      {dirtyCount > 0 && (
        <div className="card elev-md" style={{ position: 'sticky', top: 0, zIndex: 5, marginBottom: 'var(--space-3)', borderTop: '3px solid var(--color-accent-2-700)', display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'center' }}>
          <div>
            <div className="card-kicker">{t('تعديلات غير محفوظة')}</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18 }}>{dirtyCount} {t('عامل بانتظار الحفظ')}</div>
          </div>
          <div style={{ marginInlineStart: 'auto', display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--color-neutral-600)' }}>{savedLabel}</span>
            <button className="btn btn-ghost" onClick={() => setDrafts({})}>{t('تراجع عن الكل')}</button>
            <button className="btn btn-primary" onClick={saveAll}>{t('حفظ كل التعديلات')}</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'center', justifyContent: 'space-between', margin: 'var(--space-3) 0', fontSize: 13, color: 'var(--color-neutral-600)' }}>
        <span>{t('عرض')} {shown.length} {t('من')} {filtered.length.toLocaleString('en-US')} · {savedLabel}</span>
        <span>{t('القاعدة الفعلية:')} {selfCount.toLocaleString('en-US')} {t('عامل ذاتى')} · {(workers.length - selfCount).toLocaleString('en-US')} {t('عامل مقاولين')} · {db.contractors.length} {t('مقاول')} · {db.projects.length} {t('مشروع')}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{t('اسحب الجدول أو استخدم الأسهم للتمرير أفقيًا — الكود والاسم ثابتان')}</span>
        <div style={{ marginInlineStart: 'auto', display: 'flex', gap: 4 }}>
          <button className="btn btn-ghost btn-icon" title={t('تمرير لليمين')} onClick={() => scrollGrid(320)}>▶</button>
          <button className="btn btn-ghost btn-icon" title={t('تمرير لليسار')} onClick={() => scrollGrid(-320)}>◀</button>
        </div>
      </div>

      <div className="wgrid" ref={gridRef} onPointerDown={onGridDown}>
        <table className="dt">
          <thead><tr>{['كود العامل', 'الاسم', 'المهنة', 'الرقم القومي', 'تاريخ الميلاد', 'السن', 'محل الميلاد', 'بدل المنطقة', 'الدرجة', 'قيمة الدرجة', 'ساعات العمل', 'أجر الساعة', 'الحالة', 'تاريخ المغادرة', 'المشروع / الموقع', 'القطاع الجغرافى', 'أمر الشغل', 'أول يوم عمل', 'نهاية أمر الشغل', 'كود المقاول', 'اسم المقاول', ''].map((h, i) => <th key={i}>{h && t(h)}</th>)}</tr></thead>
          <tbody>
            {shown.map(w => {
              const dirty = w.code in drafts;
              const active = dirty ? drafts[w.code] : w.active;
              const birth = w.birthDate || birthFromNationalId(w.nationalId);
              const rate = Number(w.rate) || dailyRate(db, w.profession, w.category);
              const hours = w.hours || 8;
              const open = () => setDetailCode(w.code);
              return (
                <tr key={w.code} className={dirty ? 'wg-dirty' : ''}>
                  <td style={{ cursor: 'pointer', fontWeight: 700, color: 'var(--accent-fg)' }} onClick={open} title={t('عرض ملف العامل')}>{w.code}</td>
                  <td style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--ink)', textDecoration: 'underline', textDecorationColor: 'var(--color-accent-300)', textUnderlineOffset: 3 }} onClick={open} title={t('عرض ملف العامل')}>{w.name}</td>
                  <td>{w.profession}</td>
                  <td dir="ltr" style={{ textAlign: 'right' }}>{w.nationalId}</td>
                  <td dir="ltr" style={{ textAlign: 'right', fontSize: 12 }}>{dmy(birth) || '—'}</td>
                  <td style={{ textAlign: 'center' }}>{ageOf(birth)}</td>
                  <td style={{ fontSize: 12 }}>{w.birthPlace || placeFromNationalId(w.nationalId) || '—'}</td>
                  <td dir="ltr" style={{ textAlign: 'right' }}>{f2(w.allowance)}</td>
                  <td style={{ textAlign: 'center' }}><span className="tag tag-neutral">{w.category || '—'}</span></td>
                  <td dir="ltr" style={{ textAlign: 'right' }}>{rate ? f2(rate) : '—'}</td>
                  <td style={{ textAlign: 'center' }}>{hours}</td>
                  <td style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-accent-700)' }}>{rate ? f2(rate / hours) : '—'}</td>
                  <td>
                    <select className="input" style={{ padding: '2px 6px', fontSize: 13, minWidth: 96 }} value={active ? 'نشط' : 'غير نشط'}
                      disabled={!can('editWorker')}
                      onChange={e => {
                        const v = e.target.value === 'نشط';
                        setDrafts(d => { const { [w.code]: _, ...rest } = d; return v === w.active ? rest : { ...rest, [w.code]: v }; });
                      }}>
                      <option value="نشط">{t('نشط')}</option><option value="غير نشط">{t('غير نشط')}</option>
                    </select>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--color-neutral-600)' }}>{dmy(w.leaveDate)}</td>
                  <td style={{ fontSize: 12 }}>{projectLabel(db, w.projectCode)}</td>
                  <td style={{ fontSize: 12 }}>{t(sectorOfProject(w.projectCode).sectorName)}</td>
                  <td>{dmy(w.regDate) || '—'}{w.workOrderFile ? ' 📎' : ''}</td>
                  <td>{dmy(w.startDate) || '—'}</td>
                  <td>{dmy(workEndOf(w.startDate, w.endDate)) || '—'}</td>
                  <td>{w.contractorCode || t('ذاتى')}</td>
                  <td>{w.contractorCode ? conName.get(w.contractorCode) || '—' : t('عمالة ذاتية')}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      {dirty && <>
                        <button className="btn btn-primary" style={{ padding: '3px 10px', fontSize: 12 }} title={t('حفظ تعديلات هذا العامل')} onClick={() => saveOne(w.code)}>{t('حفظ')}</button>
                        <button className="btn btn-ghost" style={{ padding: '3px 8px', fontSize: 12 }} title={t('تراجع')} onClick={() => setDrafts(({ [w.code]: _, ...rest }) => rest)}>↺</button>
                      </>}
                      {can('editWorker') && <button className="btn btn-ghost" title={t('تعديل البيانات الشخصية فقط')} style={{ padding: '3px 8px', fontSize: 12 }} onClick={() => setEditCode(w.code)}>{t('✎ بيانات شخصية')}</button>}
                      {can('editWorker') && <button className="btn btn-ghost" title={t('حذف العامل')} aria-label={t('حذف العامل')} style={{ padding: '2px 8px', color: 'var(--color-accent-2-700)' }} onClick={() => remove(w)}>✕</button>}
                    </div>
                  </td>
                </tr>
              );
            })}
            {!shown.length && <tr><td colSpan={22} style={{ textAlign: 'center', color: 'var(--ink-3)' }}>{t('لا توجد نتائج')}</td></tr>}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
        <button className="btn btn-ghost btn-icon" title={t('الصفحة الأولى')} onClick={() => setPage(0)}>⏮</button>
        <button className="btn btn-ghost btn-icon" aria-label={t('السابق')} onClick={() => setPage(Math.max(0, pg - 1))}>◄</button>
        <span style={{ fontSize: 13, color: 'var(--color-neutral-600)' }}>{t('صفحة')} {pg + 1} / {pages}</span>
        <button className="btn btn-ghost btn-icon" aria-label={t('التالي')} onClick={() => setPage(Math.min(pages - 1, pg + 1))}>►</button>
        <button className="btn btn-ghost btn-icon" title={t('الصفحة الأخيرة')} onClick={() => setPage(pages - 1)}>⏭</button>
      </div>

      {detail && <WorkerDetail w={detail} onClose={() => setDetailCode(null)} onUpdate={can('editWorker') ? p => patchWorker(detail.code, p) : undefined} />}
    </>
  );
}

/* ───────────── إضافة عامل — ترتيب إلزامى: الإدارة ← المهنة ← المشروع ← المقاول ← كود تلقائى ───────────── */
function AddWorkerForm({ onDone }: { onDone: (code: string) => void }) {
  const { db, update, can } = useData();
  const { t } = usePrefs();
  const [nw, setNw] = useState({ dept: '', profession: '', sector: 'all', project: '', contractor: '', name: '', card: '', birthDate: '', birthPlace: '', category: 'B' as Grade, rate: '', hours: '8', active: true, regDate: '', startDate: '', endDate: '' });
  const [woFile, setWoFile] = useState<string | null>(null);
  const [fp, setFp] = useState(false);
  const set = (k: keyof typeof nw, v: string | boolean) => setNw(p => ({ ...p, [k]: v }));

  const profs = useMemo(() => [...new Set((db?.professions ?? []).filter(p => normalizeDept(p.department) === nw.dept).map(p => p.name))].sort(), [db, nw.dept]);
  const projOpts = useMemo(() => (db ? projectOptions(db, nw.sector) : []), [db, nw.sector]);
  const conOpts = useMemo(() => (db && nw.project ? contractorOptions(db, 'all', nw.project) : []), [db, nw.project]);
  if (!db) return null;

  const card = nw.card.trim();
  const dup = /^\d{14}$/.test(card) ? db.workers.find(w => w.nationalId === card) : undefined;
  const birth = nw.birthDate || birthFromNationalId(card) || '';
  const place = nw.birthPlace.trim() || placeFromNationalId(card) || '';
  const autoRate = nw.profession ? dailyRate(db, nw.profession, nw.category) : 0;
  const rate = Number(nw.rate) || autoRate;
  const code = nextWorkerCode(db.workers, nw.contractor, nw.project);
  const conName = nw.contractor === SELF ? t('عمالة ذاتية — الشروق') : db.contractors.find(c => c.code === nw.contractor)?.name || '—';

  const missing: string[] = [];
  if (!nw.dept) missing.push('الإدارة');
  if (!nw.profession) missing.push('المهنة');
  if (!nw.project) missing.push('المشروع');
  if (!nw.contractor) missing.push('المقاول');
  if (!nw.name.trim()) missing.push('اسم العامل');
  if (!/^\d{14}$/.test(card)) missing.push('الرقم القومى (14 رقمًا بالضبط)');
  else if (dup) missing.push('الرقم القومى مكرر');
  if (!birth) missing.push('تاريخ الميلاد');
  if (!place) missing.push('محل الميلاد');
  if (!(rate > 0)) missing.push('قيمة الدرجة');
  if (!nw.regDate) missing.push('تاريخ أمر الشغل');
  if (!nw.startDate) missing.push('تاريخ أول يوم عمل');
  if (nw.endDate && nw.startDate && nw.endDate < nw.startDate) missing.push('تاريخ النهاية قبل البداية');
  if (!woFile) missing.push('ملف أمر الشغل');

  const save = () => {
    if (missing.length || !code) return;
    const rec: Worker = {
      code, name: nw.name.trim(), nationalId: card, profession: nw.profession, department: nw.dept,
      projectCode: nw.project, contractorCode: nw.contractor === SELF ? null : nw.contractor,
      source: nw.contractor === SELF ? 'ذاتى' : 'باطن', category: nw.category, manager: null,
      startDate: nw.startDate, allowance: 0, housingAllowance: 0, transportAllowance: 0, active: nw.active,
      rate, hours: Number(nw.hours) || 8, regDate: nw.regDate, endDate: nw.endDate || null,
      leaveDate: nw.active ? null : new Date().toISOString().slice(0, 10),
      birthDate: birth, birthPlace: place, workOrderFile: woFile, fingerprintId: fp ? 'FP-' + code : null,
    };
    update(d => ({ ...d, workers: [rec, ...d.workers] }));
    onDone(code);
  };

  const ro = { background: 'var(--color-neutral-100)', fontFamily: 'var(--font-heading)', fontSize: 18 } as const;
  const grid3 = { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 'var(--space-3)' } as const;

  return (
    <div className="card elev-sm" style={{ marginBottom: 'var(--space-4)' }}>
      <div className="card-kicker">{t('الخطوة الأولى — ترتيب إلزامى')}</div>
      <div className="card-title" style={{ marginBottom: 'var(--space-3)' }}>{t('الإدارة ← المهنة ← المشروع ← بدل المنطقة')}</div>
      <div className="form-grid" style={grid3}>
        <div className="field"><label>{t('١ · الإدارة *')}</label>
          <select className="input" value={nw.dept} onChange={e => { set('dept', e.target.value); set('profession', ''); }}>
            <option value="">{t('اختر الإدارة')}</option>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div className="field"><label>{t('٢ · المهنة التابعة للإدارة *')}</label>
          <select className="input" value={nw.profession} disabled={!nw.dept} onChange={e => { set('profession', e.target.value); set('rate', ''); }}>
            <option value="">{t(nw.dept ? 'اختر المهنة' : 'اختر الإدارة أولًا')}</option>
            {profs.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="field"><label>{t('القطاع الجغرافى (تصفية المشروعات)')}</label>
          <select className="input" value={nw.sector} onChange={e => { set('sector', e.target.value); set('project', ''); set('contractor', ''); }}>
            <option value="all">{t('كل القطاعات')}</option>
            {sectorList().map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
          </select>
        </div>
        <div className="field"><label>{t('٣ · المشروع / الموقع *')}</label>
          <select className="input" value={nw.project} disabled={!nw.profession} onChange={e => { set('project', e.target.value); set('contractor', ''); }}>
            <option value="">{t(nw.profession ? 'اختر المشروع' : 'اختر المهنة أولًا')}</option>
            {projOpts.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
          </select>
        </div>
        <div className="field"><label>{t('٤ · بدل المنطقة (تلقائى من المشروع)')}</label><input className="input" value={f2(0)} readOnly style={{ background: 'var(--color-accent-100)', color: 'var(--color-accent-700)', fontWeight: 600 }} /></div>
        <div className="field"><label>{t('كود المشروع')}</label><input className="input" value={nw.project} readOnly dir="ltr" style={ro} /></div>
        <div className="field"><label>{t('المقاول التابع له')}</label>
          <select className="input" value={nw.contractor} disabled={!nw.project} onChange={e => set('contractor', e.target.value)}>
            <option value="">{t(nw.project ? 'اختر المقاول' : 'اختر المشروع أولًا')}</option>
            <option value={SELF}>{t('عمالة ذاتية — الشروق')}</option>
            {conOpts.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
          </select>
        </div>
        <div className="field"><label>{t('كود المقاول فى هذا المشروع')}</label><input className="input" value={nw.contractor === SELF ? t('ذاتى') : nw.contractor} readOnly dir="ltr" style={ro} /></div>
        <div className="field"><label>{t('كود العامل (تلقائى)')}</label><input className="input" value={code} readOnly dir="ltr" style={{ ...ro, fontWeight: 600 }} /></div>
        <div className="field" style={{ gridColumn: '1 / -1' }}>
          <span style={{ fontSize: 13, color: 'var(--color-neutral-600)' }}>
            {t(nw.contractor === SELF ? 'العمالة الذاتية: الكود = كود المشروع + 10 + تسلسل.' : 'عمالة الباطن: الكود = أول 5 أرقام من كود المقاول + تسلسل بعد آخر عامل مسجَّل.')}
          </span>
        </div>
      </div>

      <div className="card-kicker" style={{ marginTop: 'var(--space-4)' }}>{t('الخطوة الثانية')}</div>
      <div className="card-title" style={{ marginBottom: 'var(--space-3)' }}>{t('البيانات الشخصية والدرجة')}</div>
      <div className="form-grid" style={grid3}>
        <div className="field"><label>{t('اسم العامل (رباعي) *')}</label><input className="input" placeholder={t('الاسم رباعي')} value={nw.name} onChange={e => set('name', e.target.value)} /></div>
        <div className="field"><label>{t('الرقم القومي / رقم البطاقة *')}</label>
          <input className="input" dir="ltr" inputMode="numeric" maxLength={14} placeholder={t('14 رقماً بالضبط')} value={nw.card}
            onChange={e => set('card', e.target.value.replace(/\D/g, ''))}
            style={{ borderColor: card && (!isValidNationalId(card) || dup) ? '#B3261E' : undefined, fontVariantNumeric: 'tabular-nums' }} />
          {dup && <span style={{ fontSize: 12.5, fontWeight: 700, color: '#B3261E' }}>{t('مسجّل مسبقاً:')} {dup.name} — {dup.code}</span>}
          <span style={{ fontSize: 12, color: 'var(--color-neutral-600)' }}>{card.length}/14 · {t(card.length === 14 ? (isValidNationalId(card) ? 'رقم صحيح' : 'رقم غير صحيح') : 'أدخل 14 رقمًا')}</span>
        </div>
        <div className="field"><label>{t('تاريخ الميلاد (تلقائي من الرقم القومي)')}</label><input className="input date-input" type="date" dir="ltr" value={birth} onChange={e => set('birthDate', e.target.value)} /></div>
        <div className="field"><label>{t('السن (تلقائي)')}</label><input className="input" value={ageOf(birth)} readOnly style={{ background: 'var(--color-neutral-100)' }} /></div>
        <div className="field"><label>{t('محل الميلاد (تلقائي من الرقم القومي)')}</label><input className="input" placeholder={t('المحافظة')} value={place} onChange={e => set('birthPlace', e.target.value)} /></div>
        <div className="field"><label>{t('درجة التقييم داخل الوظيفة')}</label>
          <select className="input" value={nw.category} onChange={e => { set('category', e.target.value); set('rate', ''); }}>
            <option value="A">{t('A — الأعلى')}</option><option value="B">B</option><option value="C">C</option><option value="D">D</option><option value="E">{t('E — الأقل')}</option>
          </select>
        </div>
        <div className="field"><label>{t('قيمة الدرجة (يومية — من جدول الوظيفة)')}</label><input className="input" dir="ltr" placeholder={t('تُملأ تلقائيًا')} value={nw.rate || (autoRate ? String(autoRate) : '')} onChange={e => set('rate', e.target.value.replace(/[^0-9.]/g, ''))} /></div>
        <div className="field"><label>{t('ساعات العمل اليومية')}</label>
          <select className="input" value={nw.hours} onChange={e => set('hours', e.target.value)}>
            {['6', '7', '8', '9', '10', '11', '12'].map(h => <option key={h} value={h}>{h} {t('ساعات')}</option>)}
          </select>
        </div>
        <div className="field"><label>{t('أجر الساعة المحتسب')}</label><input className="input" value={rate ? f2(rate / (Number(nw.hours) || 8)) : '—'} readOnly style={{ background: 'var(--color-neutral-100)' }} /></div>
        <div className="field"><label>{t('حالة العامل')}</label>
          <select className="input" value={nw.active ? 'نشط' : 'غير نشط'} onChange={e => set('active', e.target.value === 'نشط')}>
            <option value="نشط">{t('نشط')}</option><option value="غير نشط">{t('غير نشط (مغادرة)')}</option>
          </select>
        </div>
        <div className="field"><label>{t('تاريخ أمر الشغل *')}</label><input className="input date-input" type="date" dir="ltr" value={nw.regDate} onChange={e => set('regDate', e.target.value)} /></div>
        <div className="field"><label>{t('تاريخ أول يوم عمل *')}</label><input className="input date-input" type="date" dir="ltr" value={nw.startDate} onChange={e => set('startDate', e.target.value)} /></div>
        <div className="field"><label>{t('تاريخ نهاية أمر الشغل *')}</label><input className="input date-input" type="date" dir="ltr" value={nw.endDate} onChange={e => set('endDate', e.target.value)} />
          <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{t('إن تُرك فارغًا: 3 أشهر من أول يوم عمل')} {nw.startDate && !nw.endDate ? '(' + dmy(workEndOf(nw.startDate)) + ')' : ''}</span>
        </div>
        <div className="field" style={{ gridColumn: '1 / -1' }}><label>{t('ملف أمر الشغل * (مرفق إلزامي — صورة أو PDF)')}</label>
          <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
            <label className="btn btn-secondary" style={{ cursor: 'pointer', margin: 0 }}>{t('📎 رفع ملف أمر الشغل')}<input type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={e => setWoFile(e.target.files?.[0]?.name || null)} /></label>
            <span style={{ fontSize: 13, color: 'var(--color-neutral-700)' }}>{woFile || t('لم يُرفع ملف')}</span>
            {woFile && <button className="btn btn-ghost" style={{ padding: '2px 8px', color: 'var(--color-accent-2-700)' }} onClick={() => setWoFile(null)}>{t('✕ إزالة')}</button>}
          </div>
        </div>
      </div>

      <div className="card-kicker" style={{ marginTop: 'var(--space-4)' }}>{t('الخطوة الثالثة')}</div>
      <div className="card-title" style={{ marginBottom: 'var(--space-2)' }}>{t('تعريف البصمة — لأخذ الحضور بعد ذلك بالبصمة')}</div>
      <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
        <button className="btn btn-secondary" disabled={!can('fp') || fp} onClick={() => setFp(true)}>{t(fp ? 'تم تعريف البصمة' : 'تعريف البصمة')}</button>
        <span className={'tag ' + (fp ? 'tag-accent' : 'tag-neutral')}>{t(fp ? 'مُعرَّفة' : 'غير مُعرَّفة')}</span>
        {!can('fp') && <span style={{ fontSize: 13, color: 'var(--color-neutral-600)' }}>{t('لا تملك صلاحية تعريف البصمة')}</span>}
      </div>
      <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', marginTop: 'var(--space-3)', flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={save} disabled={missing.length > 0 || !code}>{t('حفظ العامل')}</button>
        {missing.length > 0 && <span style={{ fontSize: 13, fontWeight: 600, color: '#B3261E' }}>{t('ناقص:')} {missing.map(m => t(m)).join('، ')}</span>}
        <span style={{ fontSize: 13, color: 'var(--color-neutral-600)' }}>{t('اسم المقاول:')} {conName} · {t('القطاع:')} {t(nw.project ? sectorOfProject(nw.project).sectorName : '—')}</span>
      </div>
    </div>
  );
}

/* ───────────── تعديل البيانات الشخصية فقط — الكود ثابت، والبيانات الوظيفية للعرض ───────────── */
function EditPersonal({ w, onClose, onSave }: { w: Worker; onClose: () => void; onSave: (p: Partial<Worker>) => void }) {
  const { db } = useData();
  const { t } = usePrefs();
  const [e, setE] = useState({ name: w.name, card: w.nationalId || '', birthDate: w.birthDate || '', birthPlace: w.birthPlace || '', active: w.active });
  const card = e.card.trim();
  const bad = card.length > 0 && !/^\d{14}$/.test(card);
  const dup = /^\d{14}$/.test(card) ? db?.workers.find(x => x.nationalId === card && x.code !== w.code) : undefined;
  const birth = e.birthDate || birthFromNationalId(card) || '';
  const rate = Number(w.rate) || (db ? dailyRate(db, w.profession, w.category) : 0);

  return (
    <div className="card elev-md" style={{ marginBottom: 'var(--space-4)', borderTop: '3px solid var(--color-accent)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
        <div><div className="card-kicker">{t('تعديل بيانات موظف')}</div><div className="card-title">{w.name}</div></div>
        <button className="btn btn-ghost" onClick={onClose}>{t('إغلاق ✕')}</button>
      </div>
      <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 'var(--space-3)' }}>
        <div className="field"><label>{t('كود الموظف (غير قابل للتعديل)')}</label>
          <input className="input" value={w.code} readOnly dir="ltr" style={{ background: 'var(--color-neutral-200)', fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 600, cursor: 'not-allowed' }} />
          <span style={{ fontSize: 12, color: 'var(--color-neutral-600)' }}>{t('🔒 الكود ثابت مدى الحياة الوظيفية ولا يُعاد استخدامه')}</span>
        </div>
        <div className="field"><label>{t('اسم الموظف')}</label><input className="input" value={e.name} onChange={ev => setE({ ...e, name: ev.target.value })} /></div>
        <div className="field"><label>{t('الرقم القومي (14 رقمًا)')}</label>
          <input className="input" dir="ltr" inputMode="numeric" maxLength={14} value={e.card} onChange={ev => setE({ ...e, card: ev.target.value.replace(/\D/g, '') })} />
          {dup && <span style={{ fontSize: 12.5, fontWeight: 700, color: '#B3261E' }}>{t('مسجّل مسبقاً:')} {dup.name} — {dup.code}</span>}
          {bad && <span style={{ fontSize: 12, color: '#B3261E' }}>{t('يجب أن يكون 14 رقمًا بالضبط')}</span>}
        </div>
        <div className="field"><label>{t('تاريخ الميلاد (تلقائي من الرقم القومي)')}</label><input className="input date-input" type="date" dir="ltr" value={birth} onChange={ev => setE({ ...e, birthDate: ev.target.value })} /></div>
        <div className="field"><label>{t('السن (تلقائي)')}</label><input className="input" value={ageOf(birth)} readOnly style={{ background: 'var(--color-neutral-100)' }} /></div>
        <div className="field"><label>{t('محل الميلاد (تلقائي)')}</label><input className="input" value={e.birthPlace || placeFromNationalId(card) || ''} onChange={ev => setE({ ...e, birthPlace: ev.target.value })} /></div>
        <div className="field"><label>{t('الحالة')}</label>
          <select className="input" value={e.active ? 'نشط' : 'غير نشط'} onChange={ev => setE({ ...e, active: ev.target.value === 'نشط' })}>
            <option value="نشط">{t('نشط')}</option><option value="غير نشط">{t('غير نشط')}</option>
          </select>
        </div>
      </div>
      <div style={{ marginTop: 'var(--space-3)', padding: '10px 12px', background: 'var(--color-neutral-100)', borderRadius: 'var(--radius-md)', fontSize: 13, lineHeight: 2, color: 'var(--color-neutral-700)' }}>
        <b>{t('🔒 بيانات وظيفية — للعرض فقط:')}</b>{' '}
        {t('المهنة:')} {w.profession} · {t('الإدارة:')} {w.department} · {t('الدرجة:')} {w.category || '—'} · {t('قيمة الدرجة:')} {f2(rate)} · {t('بدل المنطقة:')} {f2(w.allowance)} · {t('أمر الشغل:')} {dmy(w.regDate) || '—'}
        <br />{t('تغيير الوظيفة أو الدرجة أو المشروع يتم من شاشة «نقل الموظفين» بتاريخ سريان — حتى لا تُمحى البيانات السابقة')}
      </div>
      <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', marginTop: 'var(--space-4)' }}>
        <button className="btn btn-primary" disabled={!e.name.trim() || bad || !!dup}
          onClick={() => onSave({ name: e.name.trim(), nationalId: card || null, birthDate: e.birthDate || null, birthPlace: e.birthPlace || null, active: e.active, leaveDate: e.active ? null : (w.leaveDate || new Date().toISOString().slice(0, 10)) })}>
          {t('حفظ التعديلات')}
        </button>
        <button className="btn btn-ghost" onClick={onClose}>{t('إلغاء')}</button>
      </div>
    </div>
  );
}
