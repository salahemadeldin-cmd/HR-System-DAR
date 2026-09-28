import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useData } from '../lib/DataContext';
import { usePrefs } from '../lib/prefs';
import { sectorList, sectorOfProject, projectOptions, projectLabel } from '../lib/geo';
import { workEndOf } from '../lib/barcode';
import { dmy } from '../lib/nid';
import { exportBook, exportSheet } from '../lib/excel';
import { printDoc } from '../lib/print';
import WorkerDetail from '../components/WorkerDetail';
import type { Contractor, Worker } from '../lib/types';

const SELF = 'SELF';
type CType = 'عمالة ذاتى' | 'عمالة باطن';

/** تطبيع الأسماء العربية للمقارنة والدمج (الهمزات، الياء، التاء المربوطة، التشكيل، المسافات). */
const normName = (s?: string | null) => String(s || '')
  .replace(/[ً-ْٰـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه')
  .replace(/\s+/g, ' ').trim().toLowerCase();
const codeOf = (t: string) => String(t || '').split('—')[0].trim();

/** كود المقاول: ذاتى = المشروع + 10000؛ باطن = المشروع + تسلسل من رقمين + 000 (مثال 18416000). */
function nextContractorCode(list: Contractor[], project: string, type: CType) {
  const pc = project.trim(); if (!pc) return '';
  if (type === 'عمالة ذاتى') return pc + '10000';
  let last = 0;
  for (const c of list) {
    if (c.code.length !== 8 || (c.code.slice(0, 3) !== pc && c.projectCode !== pc)) continue;
    const seq = parseInt(c.code.slice(3, 5), 10);
    if (!isNaN(seq) && seq > last) last = seq;
  }
  return pc + String(last + 1).padStart(2, '0') + '000';
}

export default function Contractors() {
  const { db, update } = useData();
  const { t, lang, dir, theme } = usePrefs();

  // فلتر الشاشة العام (نص مع اقتراحات)
  const [ctSector, setCtSector] = useState('');
  const [ctProject, setCtProject] = useState('');
  const [ctType, setCtType] = useState('');
  const [ctStatus, setCtStatus] = useState('');
  const [ctQ, setCtQ] = useState('');
  const [pick, setPick] = useState<string>(SELF);
  // صندوق الأسماء
  const [cnOpen, setCnOpen] = useState(false);
  const [cnQ, setCnQ] = useState('');
  const [cnSector, setCnSector] = useState('all');
  const [cnProject, setCnProject] = useState('all');
  // عمال المقاول
  const [ctwQ, setCtwQ] = useState('');
  const [ctwStatus, setCtwStatus] = useState('all');
  const [ctwModal, setCtwModal] = useState(false);
  const [ncOpen, setNcOpen] = useState(false);
  const [wdCode, setWdCode] = useState<string | null>(null);

  const workers = db?.workers ?? [];
  const contractors = db?.contractors ?? [];

  const byContractor = useMemo(() => {
    const m = new Map<string, Worker[]>();
    for (const w of workers) { const k = w.contractorCode || SELF; const a = m.get(k); if (a) a.push(w); else m.set(k, [w]); }
    return m;
  }, [workers]);

  // قائمة المقاولين + بند العمالة الذاتية أولًا
  const selfEntry: Contractor = { code: SELF, name: 'عمالة ذاتية — الشروق', projectCode: null, nationalId: null, active: true, housingAllowance: 0, transportAllowance: 0, documents: [], type: 'عمالة ذاتى' };
  const all = useMemo(() => [selfEntry, ...contractors], [contractors]); // eslint-disable-line react-hooks/exhaustive-deps
  const typeOf = (c: Contractor): CType => c.type || (c.code === SELF ? 'عمالة ذاتى' : 'عمالة باطن');

  const sec = codeOf(ctSector), prj = codeOf(ctProject);
  const secOk = sectorList().some(s => s.code === sec), prjOk = !!db?.projects.some(p => p.code === prj);
  const filtered = useMemo(() => all.filter(c => {
    const pc = c.projectCode || c.code.slice(0, 3);
    const q = ctQ.trim();
    return (!prjOk || c.code === SELF || pc === prj)
      && (!secOk || c.code === SELF || sectorOfProject(pc).sectorCode === sec)
      && (!q || (q.includes('—') ? c.code === codeOf(q) : c.code.includes(q) || c.name.includes(q)))
      && (!ctType || typeOf(c) === ctType)
      && (!ctStatus || (ctStatus === 'on') === (c.active !== false));
  }), [all, prj, prjOk, sec, secOk, ctQ, ctType, ctStatus]);

  const ac = filtered.find(c => c.code === pick) || filtered[0] || all[0];
  const acWorkers = byContractor.get(ac.code) || [];
  const idx = filtered.indexOf(ac);
  const anyCt = !!(ctSector || ctProject || ctQ || ctType || ctStatus);
  const clearCt = () => { setCtSector(''); setCtProject(''); setCtQ(''); setCtType(''); setCtStatus(''); setCnSector('all'); setCnProject('all'); setCnQ(''); };
  // اختيار قطاع/مشروع صحيح فى الفلتر العام يفتح صندوق الأسماء على نفس النطاق
  const onCtSector = (v: string) => { setCtSector(v); const c = codeOf(v); setCnSector(sectorList().some(s => s.code === c) ? c : 'all'); };
  const onCtProject = (v: string) => { setCtProject(v); const c = codeOf(v); setCnProject(db?.projects.some(p => p.code === c) ? c : 'all'); };

  // صندوق "أسماء بدون أكواد": دمج الاسم المتكرر (بأكواد أو صيغ مختلفة) فى نفس المشروع
  const cnRows = useMemo(() => {
    const nq = normName(cnQ);
    const projByName = new Map<string, Set<string>>();
    for (const c of contractors) {
      if (!c.name || c.active === false || !c.projectCode) continue;
      const k = normName(c.name); const s = projByName.get(k) || new Set(); s.add(c.projectCode); projByName.set(k, s);
    }
    const groups = new Map<string, { names: string[]; codes: string[]; project: string; sectorName: string; workers: number; active: boolean; nk: string }>();
    for (const c of contractors) {
      if (!c.name || (nq && !normName(c.name).includes(nq))) continue;
      const pc = c.projectCode || '';
      const geo = sectorOfProject(pc);
      if (cnSector !== 'all' && geo.sectorCode !== cnSector) continue;
      if (cnProject !== 'all' && pc !== cnProject) continue;
      const nk = normName(c.name), key = nk + '|' + pc;
      const g = groups.get(key) || { names: [], codes: [], project: pc, sectorName: geo.sectorName, workers: 0, active: false, nk };
      if (c.active !== false) g.active = true;
      if (!g.names.includes(c.name)) g.names.push(c.name);
      if (!g.codes.includes(c.code)) g.codes.push(c.code);
      g.workers += (byContractor.get(c.code) || []).length;
      groups.set(key, g);
    }
    return [...groups.values()].sort((a, b) => a.names[0].localeCompare(b.names[0], 'ar')).map(g => {
      const projs = [...(projByName.get(g.nk) || [])];
      return { ...g, merged: g.names.length > 1 || g.codes.length > 1, projCount: projs.length, projTitle: projs.map(p => projectLabel(db, p)).join(' · ') };
    });
  }, [contractors, cnQ, cnSector, cnProject, byContractor, db]);
  const cnShow = cnOpen || !!cnQ || cnSector !== 'all' || cnProject !== 'all';

  // عمال المقاول — غير المكوَّدين فى نهاية الجدول
  const uncoded = (w: Worker) => !/\d/.test(String(w.code || ''));
  const ctwList = useMemo(() => {
    const q = ctwQ.trim();
    return acWorkers
      .filter(w => (ctwStatus === 'all' || (ctwStatus === 'نشط') === w.active) && (!q || w.code.includes(q) || w.name.includes(q) || (w.nationalId || '').includes(q) || (w.profession || '').includes(q)))
      .map((w, k) => ({ w, k, u: uncoded(w) ? 1 : 0 })).sort((a, b) => a.u - b.u || a.k - b.k).map(x => x.w);
  }, [acWorkers, ctwQ, ctwStatus]);
  const nU = acWorkers.filter(uncoded).length;
  const activeProjects = [...new Set(acWorkers.filter(w => w.active).map(w => w.projectCode).filter(Boolean) as string[])];

  const patchAc = (p: Partial<Contractor>) => {
    if (ac.code === SELF) return;
    update(d => ({ ...d, contractors: d.contractors.map(c => (c.code === ac.code ? { ...c, ...p } : c)) }));
  };
  const deleteAc = () => {
    if (ac.code === SELF || !window.confirm(t('حذف المقاول') + ` ${ac.name} (${ac.code})؟`)) return;
    update(d => ({ ...d, contractors: d.contractors.filter(c => c.code !== ac.code) }));
    setPick(SELF);
  };
  const go = (delta: number) => { if (!filtered.length) return; const i = (idx + delta + filtered.length) % filtered.length; setPick(filtered[i].code); };

  const exportContractors = () => exportSheet(contractors.map(c => ({
    'كود المقاول': c.code, 'اسم المقاول': c.name, 'نوع الأعمال': typeOf(c), 'المشروع': projectLabel(db, c.projectCode),
    'القطاع': sectorOfProject(c.projectCode).sectorName, 'الحالة': c.active === false ? 'غير نشط' : 'نشط',
    'رقم البطاقة': c.nationalId || '', 'كود الحساب': c.account || '', 'SAP ID': c.sapId || '', 'الموقف الضريبى': c.tax14 ? 'يخضع 14%' : 'لا يخضع',
    'عدد العمال': (byContractor.get(c.code) || []).length,
  })), 'المقاولون');

  if (!db) return null;
  const acName = ac.code === SELF ? t('عمالة ذاتية') : ac.name;
  const kpis = [
    { label: 'إجمالى العمالة التابعة', val: acWorkers.length, color: '#2E3192' },
    { label: 'عمالة مكوَّدة', val: acWorkers.length - nU, color: '#5F68D2' },
    { label: 'عمالة بدون كود', val: nU, color: nU ? '#B3261E' : '#8A8C94' },
    { label: 'مشروعات نشط بها', val: activeProjects.length, color: '#F2A900', hint: activeProjects.map(p => projectLabel(db, p)).join(' · ') },
  ];

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap', marginBottom: 'var(--space-3)' }}>
        <h1 style={{ fontSize: 26, margin: 0 }}>{t('إضافة/عرض عمال المقاول')}</h1>
        <button className="btn btn-primary" style={{ marginInlineStart: 'auto' }} onClick={() => setNcOpen(true)}>{t('+ إضافة مقاول')}</button>
        <button className="btn btn-secondary" onClick={exportContractors}>{t('⬇ تصدير المقاولين إلى Excel')}</button>
      </div>

      {/* بحث وفلترة المقاولين */}
      <div className="card" style={{ marginBottom: 'var(--space-4)', borderTop: '3px solid var(--color-accent)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginBottom: 'var(--space-3)' }}>
          <div className="card-title">{t('بحث وفلترة المقاولين')}</div>
          <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>{t('اكتب الاسم أو الكود واختر من الاقتراحات — الفلتر يُطبَّق على كل جداول الشاشة وعمالة المقاول')}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 'var(--space-3)', alignItems: 'end' }}>
          <div className="field" style={{ margin: 0 }}><label>{t('القطاع (اسم أو كود)')}</label><input className="input" list="ct-sectors" placeholder={t('كل القطاعات')} value={ctSector} onChange={e => onCtSector(e.target.value)} /></div>
          <div className="field" style={{ margin: 0 }}><label>{t('المشروع (اسم أو كود)')}</label><input className="input" list="ct-projects" placeholder={t('كل المشروعات')} value={ctProject} onChange={e => onCtProject(e.target.value)} /></div>
          <div className="field" style={{ margin: 0 }}><label>{t('نوع الأعمال')}</label>
            <select className="input" value={ctType} onChange={e => setCtType(e.target.value)}><option value="">{t('الكل')}</option><option value="عمالة ذاتى">{t('عمالة ذاتى')}</option><option value="عمالة باطن">{t('عمالة باطن')}</option></select>
          </div>
          <div className="field" style={{ margin: 0 }}><label>{t('الحالة')}</label>
            <select className="input" value={ctStatus} onChange={e => setCtStatus(e.target.value)}><option value="">{t('الكل')}</option><option value="on">{t('نشط')}</option><option value="off">{t('غير نشط')}</option></select>
          </div>
          <div className="field" style={{ margin: 0 }}><label>{t('المقاول (اسم أو كود)')}</label><input className="input" list="ct-contractors" placeholder={t('كل المقاولين')} value={ctQ} onChange={e => setCtQ(e.target.value)} /></div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', paddingBottom: 4 }}>
            <span className="tag tag-accent">{filtered.length} {t('من')} {all.length} {t('مقاول')}</span>
            {anyCt && <button className="btn btn-ghost" style={{ color: 'var(--color-accent-2-700)' }} onClick={clearCt}>{t('✕ مسح الفلاتر')}</button>}
          </div>
        </div>
        <datalist id="ct-sectors">{sectorList().map(s => <option key={s.code} value={`${s.code} — ${s.name}`} />)}</datalist>
        <datalist id="ct-projects">{projectOptions(db, secOk ? sec : 'all').map(p => <option key={p.code} value={p.name} />)}</datalist>
        <datalist id="ct-contractors">{filtered.slice(0, 300).map(c => <option key={c.code} value={`${c.code} — ${c.name}`} />)}</datalist>
      </div>

      {/* أسماء بدون أكواد — مطوية حتى الضغط أو اختيار قطاع/مشروع */}
      <div className="card elev-sm" style={{ marginBottom: 'var(--space-4)', borderTop: '3px solid var(--color-accent)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ minWidth: 0, flex: '1 1 220px' }}>
            <div className="card-kicker">{t('أسماء بدون أكواد')}</div>
            <div className="card-title" style={{ margin: 0 }}>{t('قائمة المقاولين · المشروع · القطاع')}</div>
          </div>
          <div className="field" style={{ margin: 0, minWidth: 220 }}><label>{t('اسم المقاول')}</label><input className="input" type="search" placeholder={t('ابحث باسم المقاول…')} value={cnQ} onChange={e => setCnQ(e.target.value)} /></div>
          <div className="field" style={{ margin: 0, minWidth: 240 }}><label>{t('القطاع الجغرافى')}</label>
            <select className="input" value={cnSector} onChange={e => { setCnSector(e.target.value); setCnProject('all'); }}>
              <option value="all">{t('كل القطاعات')}</option>{sectorList().map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
            </select>
          </div>
          <div className="field" style={{ margin: 0, minWidth: 260 }}><label>{t('المشروع')}</label>
            <select className="input" value={cnProject} onChange={e => setCnProject(e.target.value)}>
              <option value="all">{t('كل المشروعات')}</option>{projectOptions(db, cnSector).map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', paddingBottom: 4 }}>
            <span className="tag tag-neutral">{cnRows.length} {t('اسم مقاول')}</span>
            <span className="tag tag-accent-2">{cnRows.filter(r => r.merged).length} {t('مدمج')}</span>
            <button className="btn btn-secondary" style={{ padding: '6px 14px', whiteSpace: 'nowrap' }} aria-expanded={cnShow}
              onClick={() => { if (cnShow) { setCnOpen(false); setCnSector('all'); setCnProject('all'); setCnQ(''); } else setCnOpen(true); }}>
              {t(cnShow ? '▲ طىّ القائمة' : '▼ إظهار جميع المقاولين')}
            </button>
          </div>
        </div>
        {cnShow && <>
          <div className="card-meta" style={{ margin: 'var(--space-3) 0 var(--space-2)' }}>{t('الاسم المتكرر بأكواد أو صيغ مختلفة يظهر مدمجًا فى سطر واحد وتُفصل صيغ الاسم بفاصلة «،»')}</div>
          <div style={{ maxHeight: 380, overflow: 'auto', border: '1px solid var(--line)', borderRadius: 4 }}>
            <table className="dt" style={{ border: 0, borderRadius: 0, boxShadow: 'none' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}><tr>{['اسم المقاول', 'المشروع', 'القطاع الجغرافى', 'الحالة', 'التواجد فى مشروعات', 'العمال'].map(h => <th key={h}>{t(h)}</th>)}</tr></thead>
              <tbody>
                {cnRows.map(r => (
                  <tr key={r.nk + '|' + r.project}>
                    <td style={{ fontWeight: 600 }}>{r.names.join('، ')}</td>
                    <td>{projectLabel(db, r.project)}</td>
                    <td>{t(r.sectorName)}</td>
                    <td><span className={'tag ' + (r.active ? 'tag-accent' : 'tag-outline')}>{t(r.active ? 'نشط' : 'غير نشط')}</span></td>
                    <td><span className="tag tag-accent" title={r.projTitle}>{r.projCount} {t('مشروع')}</span></td>
                    <td>{r.workers.toLocaleString('en-US')}</td>
                  </tr>
                ))}
                {!cnRows.length && <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--ink-3)' }}>{t('لا توجد نتائج')}</td></tr>}
              </tbody>
            </table>
          </div>
        </>}
      </div>

      {/* بطاقة المقاول المختار */}
      <div className="card elev-sm" style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flex: 1, minWidth: 260 }}>
            <span style={{ fontSize: 13, color: 'var(--color-neutral-600)', whiteSpace: 'nowrap' }}>{t('سجل')} {idx + 1} / {filtered.length}</span>
            <select className="input" style={{ maxWidth: 420 }} value={ac.code} onChange={e => setPick(e.target.value)}>
              {filtered.map(c => <option key={c.code} value={c.code}>{(c.code === SELF ? '📌 ' + t('عمالة ذاتي') : `${c.code} — ${c.name}`) + ` (${(byContractor.get(c.code) || []).length})`}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-ghost btn-icon" aria-label={t('السابق')} onClick={() => go(-1)}>◄</button>
            <button className="btn btn-ghost btn-icon" aria-label={t('التالي')} onClick={() => go(1)}>►</button>
            <button className="btn btn-primary" onClick={() => setCtwModal(true)}>{t('📋 ملف المقاول')}</button>
            <button className="btn btn-secondary" disabled={ac.code === SELF} onClick={deleteAc}>{t('🗑 حذف المقاول')}</button>
          </div>
        </div>
        <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 'var(--space-4)' }}>
          <div className="field"><label>{t('كود المقاول')}</label><input className="input" value={ac.code === SELF ? t('ذاتى') : ac.code} readOnly /></div>
          <div className="field"><label>{t('اسم المقاول')}</label><input className="input" value={acName} readOnly /></div>
          <div className="field"><label>{t('نوع الأعمال')}</label><input className="input" value={t(typeOf(ac))} readOnly /></div>
          <div className="field"><label>{t('تاريخ التسجيل')}</label><input className="input" value={dmy(ac.regDate) || '—'} readOnly /></div>
        </div>
        {ac.code !== SELF && <>
          <div style={{ marginTop: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span className={'tag ' + (ac.active !== false ? 'tag-accent' : 'tag-accent-2')}>{t(ac.active !== false ? 'نشط' : 'غير نشط')}</span>
            <button className="btn btn-secondary" style={{ padding: '3px 12px', fontSize: 12 }} onClick={() => patchAc({ active: ac.active === false })}>{t(ac.active !== false ? 'إيقاف المقاول' : 'تنشيط المقاول')}</button>
            <span className="tag tag-outline">{t('رقم البطاقة:')} {ac.nationalId || '—'}</span>
            <span className="tag tag-outline">{t('كود الحساب:')} {ac.account || '—'}</span>
            <input className="input" dir="ltr" placeholder={t('تعديل كود الحساب')} defaultValue={ac.account || ''} key={'acc' + ac.code} onBlur={e => patchAc({ account: e.target.value.trim() || null })} style={{ maxWidth: 160, padding: '3px 8px', fontSize: 12 }} />
            <span className={'tag ' + (ac.tax14 ? 'tag-accent-2' : 'tag-neutral')}>{t(ac.tax14 ? 'يخضع 14%' : 'لا يخضع')}</span>
            <button className="btn btn-ghost" style={{ padding: '3px 10px', fontSize: 12 }} onClick={() => patchAc({ tax14: !ac.tax14 })}>{t('تغيير الموقف الضريبى')}</button>
            <span className="tag tag-accent">SAP ID: {ac.sapId || t('— لم يُسجَّل —')}</span>
            <input className="input" dir="ltr" placeholder={t('إضافة / تعديل SAP ID')} defaultValue={ac.sapId || ''} key={'sap' + ac.code}
              onBlur={e => { const v = e.target.value.replace(/\s/g, ''); if (v && contractors.some(c => c.code !== ac.code && c.sapId === v)) { alert(t('⛔ SAP ID مسجل لمقاول آخر')); return; } patchAc({ sapId: v || null }); }}
              style={{ maxWidth: 170, padding: '3px 8px', fontSize: 12 }} />
            <span className="tag tag-neutral" style={{ marginInlineStart: 8 }}>{t('عدد العمال:')} {acWorkers.length.toLocaleString('en-US')}</span>
            <span className="tag tag-neutral" style={{ marginInlineStart: 8 }}>{t('المشروع:')} {projectLabel(db, ac.projectCode)}</span>
          </div>
          <div style={{ marginTop: 'var(--space-2)', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', fontSize: 12 }}>
            <span style={{ color: 'var(--color-neutral-600)' }}>{t('المرفقات:')}</span>
            <span className="tag tag-neutral">{t('بطاقة:')} {ac.docs?.card || '—'}</span>
            <span className="tag tag-neutral">{t('سجل تجارى:')} {ac.docs?.cr || '—'}</span>
            {(ac.docs?.boqs || []).map((b, i) => <span key={i} className="tag tag-accent">{t('مقايسة')} {i + 1}: {b}</span>)}
          </div>
          {ac.notes && <div style={{ marginTop: 'var(--space-2)', fontSize: 13, color: 'var(--color-neutral-700)', lineHeight: 1.8 }}><b>{t('ملاحظات:')}</b> {ac.notes}</div>}
        </>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
        {kpis.map(k => (
          <div key={k.label} title={k.hint} style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderInlineStart: `4px solid ${k.color}`, borderRadius: 4, padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 600 }}>{t(k.label)}</span>
            <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--ink)', fontVariantNumeric: 'tabular-nums', lineHeight: 1.2 }}>{k.val.toLocaleString('en-US')}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--space-3)', flexWrap: 'wrap', marginBottom: 'var(--space-2)' }}>
        <div className="card-title" style={{ margin: 0 }}>{t('بيانات عمال هذا المقاول')}</div>
        <span className="tag tag-neutral">{ctwList.length.toLocaleString('en-US')} {t('عامل')}{ctwList.length > 100 ? ' — ' + t('يُعرض أول 100') : ''}</span>
        <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>{t('كل عمال المقاول أيًّا كان موقعهم — غير المكوَّدين فى نهاية الجدول')}</span>
        <button className="btn btn-secondary" style={{ padding: '6px 14px', marginInlineStart: 'auto' }} onClick={() => setCtwModal(true)}>{t('📋 كشف كل العمال')}</button>
        <div className="field" style={{ margin: 0, minWidth: 240 }}><label>{t('بحث فى عمال المقاول')}</label><input className="input" placeholder={t('كود، اسم، رقم قومى، وظيفة…')} value={ctwQ} onChange={e => setCtwQ(e.target.value)} /></div>
        <div className="field" style={{ margin: 0, minWidth: 150 }}><label>{t('الحالة')}</label>
          <select className="input" value={ctwStatus} onChange={e => setCtwStatus(e.target.value)}><option value="all">{t('الكل')}</option><option value="نشط">{t('نشط')}</option><option value="غير نشط">{t('غير نشط')}</option></select>
        </div>
      </div>
      <table className="dt">
        <thead><tr>{['كود العامل', 'اسم العامل', 'الرقم القومى', 'الوظيفة', 'الفئة', 'المشروع', 'الحالة', 'البداية', 'النهاية', ''].map((h, i) => <th key={i}>{h && t(h)}</th>)}</tr></thead>
        <tbody>
          {ctwList.slice(0, 100).map(w => {
            const u = uncoded(w);
            return (
              <tr key={w.code + w.name} className="ctw-row" onClick={() => setWdCode(w.code)} title={t('اضغط لعرض تفاصيل العامل')} style={{ background: u ? 'var(--surface-2)' : undefined, cursor: 'pointer' }}>
                <td dir="ltr" style={{ fontWeight: 700, color: u ? '#B3261E' : 'var(--accent-fg)' }}>{u ? t('بدون كود') : w.code}</td>
                <td style={{ fontWeight: 600, color: 'var(--ink)' }}>{w.name}</td>
                <td dir="ltr">{w.nationalId || '—'}</td>
                <td>{w.profession || '—'}</td>
                <td style={{ textAlign: 'center' }}><span className="tag tag-neutral">{w.category || '—'}</span></td>
                <td style={{ fontSize: 12 }}>{projectLabel(db, w.projectCode)}</td>
                <td><span className={'tag ' + (w.active ? 'tag-accent' : 'tag-accent-2')}>{t(w.active ? 'نشط' : 'غير نشط')}</span></td>
                <td dir="ltr">{dmy(w.startDate) || '—'}</td>
                <td dir="ltr">{dmy(workEndOf(w.startDate, w.endDate)) || '—'}</td>
                <td><button className="btn btn-primary" style={{ padding: '4px 12px', fontSize: 12, whiteSpace: 'nowrap' }} onClick={e => { e.stopPropagation(); setWdCode(w.code); }}>{t('عرض التفاصيل')}</button></td>
              </tr>
            );
          })}
          {!ctwList.length && <tr><td colSpan={10} style={{ padding: 20, textAlign: 'center', color: 'var(--ink-3)' }}>{t('لا يوجد عمال مطابقون للفلاتر')}</td></tr>}
        </tbody>
      </table>

      {ncOpen && <AddContractor onClose={() => setNcOpen(false)} onAdded={code => { setNcOpen(false); clearCt(); setPick(code); }} />}
      {ctwModal && (
        <ContractorSheet c={ac} name={acName} type={t(typeOf(ac))} list={ctwList} onClose={() => setCtwModal(false)} onOpen={code => setWdCode(code)} lang={lang} dir={dir} theme={theme} />
      )}
      {wdCode && (() => { const w = workers.find(x => x.code === wdCode); return w ? <WorkerDetail w={w} onClose={() => setWdCode(null)} onUpdate={p => update(d => ({ ...d, workers: d.workers.map(x => (x.code === w.code ? { ...x, ...p } : x)) }))} /> : null; })()}
    </>
  );
}

/* ───────────── كشف عمال المقاول (نافذة) — طباعة / PDF / Excel ───────────── */
function ContractorSheet({ c, name, type, list, onClose, onOpen, lang, dir, theme }: {
  c: Contractor; name: string; type: string; list: Worker[]; onClose: () => void; onOpen: (code: string) => void; lang: string; dir: string; theme: string;
}) {
  const { db } = useData();
  const { t } = usePrefs();
  const CAP = 1500;
  const act = list.filter(w => w.active).length;
  const title = t('عمال المقاول') + ' ' + name;
  const today = new Date().toLocaleDateString('en-GB');

  const print = () => {
    const el = document.getElementById('ctw-print'); if (!el) return;
    const en = lang === 'en';
    const html = `<!doctype html><html dir="${dir}" lang="${lang}"><head><meta charset="utf-8"><title>${title.replace(/</g, '')}</title><style>`
      + ':root{--surface:#fff;--surface-2:#E9EBEF;--ink:#2B2B2E;--ink-3:#55565C;--line:#E1E3E8;--accent-fg:#2E3192;--color-accent-700:#1C1F66;--color-accent-100:#ECEEF8}'
      + `@page{size:A4 landscape;margin:8mm}body{margin:0;background:#E9EBEF;font-family:${en ? "'Times New Roman',Times,serif" : "Calibri,'Segoe UI',Tahoma,sans-serif"};-webkit-print-color-adjust:exact;print-color-adjust:exact}tr{break-inside:avoid}</style></head><body>`
      + el.outerHTML.replace(/src="\/brand-logo.png"/g, `src="${new URL('/brand-logo.png', location.href).href}"`)
      + '</body></html>';
    printDoc(html, title);
  };
  const excel = () => exportBook([{ name: 'عمال المقاول', rows: list.map((w, i) => ({
    '#': i + 1, 'كود العامل': w.code, 'اسم العامل': w.name, 'الرقم القومى': w.nationalId || '', 'الوظيفة': w.profession || '', 'الفئة': w.category || '',
    'المشروع': projectLabel(db, w.projectCode), 'البداية': dmy(w.startDate), 'النهاية': dmy(workEndOf(w.startDate, w.endDate)), 'الحالة': w.active ? 'نشط' : 'غير نشط',
  })) }], title.replace(/[\\/:*?"<>|]/g, '-') + '-' + new Date().toISOString().slice(0, 10));

  const info: [string, string, string?][] = [
    ['كود المقاول', c.code === 'SELF' ? t('ذاتى') : c.code, 'ltr'], ['SAP ID', c.sapId || '—', 'ltr'], ['نوع الأعمال', type],
    ['المشروع', projectLabel(db, c.projectCode)], ['الحالة', t(c.active === false ? 'غير نشط' : 'نشط')], ['رقم البطاقة', c.nationalId || '—', 'ltr'],
    ['الموقف الضريبى', t(c.tax14 ? 'يخضع 14%' : 'لا يخضع')], ['تاريخ التسجيل', dmy(c.regDate) || '—', 'ltr'],
  ];
  const th = { background: '#2E3192', color: '#fff', padding: 8, textAlign: 'start' as const, fontWeight: 600 };
  const td = { padding: '7px 8px', borderBottom: '1px solid var(--line)' };

  return createPortal(
    <div className="no-print dlg-ovl" data-theme={theme} lang={lang} dir={dir} onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'var(--modal-ovl)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '32px 16px', overflow: 'auto' }}>
      <div role="dialog" dir={dir} aria-modal="true" aria-label={t('تفاصيل عمال المقاول')} onClick={e => e.stopPropagation()}
        style={{ width: 'min(1180px,100%)', background: 'var(--surface-2)', color: 'var(--ink)', borderRadius: 4, boxShadow: '0 24px 64px rgba(0,0,0,.38)', overflow: 'hidden' }}>
        <div style={{ background: '#2B2B2E', color: '#fff', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', borderBottom: '3px solid #F2A900' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <div style={{ fontSize: 11, letterSpacing: '.08em', color: 'rgba(255,255,255,.72)' }}>{t('ملف المقاول وعماله')}</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{name}</div>
          </div>
          <div style={{ marginInlineStart: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="hero-btn" onClick={print}>{t('🖨 طباعة')}</button>
            <button className="hero-btn" onClick={print}>⬇ PDF</button>
            <button className="hero-btn" onClick={excel}>⬇ Excel</button>
            <button onClick={onClose} title={t('إغلاق')} aria-label={t('إغلاق')} style={{ background: 'none', border: 0, color: 'rgba(255,255,255,.75)', fontSize: 22, cursor: 'pointer', lineHeight: 1, padding: '0 6px' }}>×</button>
          </div>
        </div>
        <div id="ctw-print" dir={dir} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14, fontVariantNumeric: 'tabular-nums' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'var(--surface)', borderRadius: 4, padding: '12px 16px', borderTop: '3px solid #2E3192' }}>
            <img src="/brand-logo.png" alt="الشروق للمقاولات" style={{ height: 40 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ fontWeight: 700, color: 'var(--accent-fg)' }}>{t('الشروق للمقاولات العمومية والتوريدات')}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{t('كشف عمال المقاول · تاريخ الإصدار')} {today}</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 10 }}>
            {info.map(([k, v, d]) => (
              <div key={k} style={{ background: 'var(--surface)', borderRadius: 4, padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{t(k)}</span><b dir={d} style={{ textAlign: d ? 'right' : undefined }}>{v}</b>
              </div>
            ))}
            {([['إجمالى العمال', list.length, '#2E3192', 'var(--color-accent-700)'], ['نشط', act, '#2E3192', 'var(--color-accent-700)'], ['غير نشط', list.length - act, '#B3261E', '#B3261E']] as const).map(([k, v, b, c2]) => (
              <div key={k} style={{ background: 'var(--surface)', borderRadius: 4, padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 2, borderTop: `3px solid ${b}` }}>
                <span style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{t(k)}</span><b style={{ fontSize: 22, color: c2 }}>{v.toLocaleString('en-US')}</b>
              </div>
            ))}
          </div>
          <div style={{ background: 'var(--surface)', borderRadius: 4, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
              <thead><tr>{['#', 'كود العامل', 'اسم العامل', 'الرقم القومى', 'الوظيفة', 'الفئة', 'المشروع', 'البداية', 'النهاية', 'الحالة'].map(h => <th key={h} style={th}>{t(h)}</th>)}</tr></thead>
              <tbody>
                {list.slice(0, CAP).map((w, i) => (
                  <tr key={w.code + i} style={{ background: i % 2 ? 'var(--surface-2)' : 'var(--surface)', cursor: 'pointer' }} onClick={() => onOpen(w.code)} title={t('عرض ملف العامل')}>
                    <td style={td}>{i + 1}</td>
                    <td style={{ ...td, fontWeight: 700, color: 'var(--accent-fg)' }} dir="ltr">{w.code}</td>
                    <td style={{ ...td, fontWeight: 600 }}>{w.name}</td>
                    <td style={td} dir="ltr">{w.nationalId || '—'}</td>
                    <td style={td}>{w.profession || '—'}</td>
                    <td style={td}>{w.category || '—'}</td>
                    <td style={td}>{projectLabel(db, w.projectCode)}</td>
                    <td style={td} dir="ltr">{dmy(w.startDate) || '—'}</td>
                    <td style={td} dir="ltr">{dmy(workEndOf(w.startDate, w.endDate)) || '—'}</td>
                    <td style={{ ...td, fontWeight: 700, color: w.active ? '#2E3192' : '#B3261E' }}>{t(w.active ? 'نشط' : 'غير نشط')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>
            {t(list.length > CAP ? `يُعرض أول ${CAP} عامل — ملف Excel يحتوى على الكل` : 'الكشف يشمل كل العمال المطابقين للفلاتر الحالية')}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* ───────────── إضافة مقاول ───────────── */
function AddContractor({ onClose, onAdded }: { onClose: () => void; onAdded: (code: string) => void }) {
  const { db, update } = useData();
  const { t, lang, dir, theme } = usePrefs();
  const [f, setF] = useState({ project: '', namePick: '', name: '', type: 'عمالة باطن' as CType, regDate: new Date().toISOString().slice(0, 10), account: '', card: '', active: true, tax14: false, sap: '', notes: '' });
  const [docCard, setDocCard] = useState<string | null>(null);
  const [docCr, setDocCr] = useState<string | null>(null);
  const [boqs, setBoqs] = useState<string[]>([]);
  const set = <K extends keyof typeof f>(k: K, v: typeof f[K]) => setF(p => ({ ...p, [k]: v }));
  if (!db) return null;

  const names = [...new Map(db.contractors.map(c => [normName(c.name), c.name])).values()].sort((a, b) => a.localeCompare(b, 'ar'));
  const code = nextContractorCode(db.contractors, f.project, f.type);
  const name = (f.namePick || f.name).trim();
  const card = f.card.trim();
  const dupC = /^\d{14}$/.test(card) ? db.contractors.find(c => c.nationalId === card) : undefined;
  const dupW = /^\d{14}$/.test(card) ? db.workers.find(w => w.nationalId === card) : undefined;
  const dupMsg = dupC ? `${t('رقم البطاقة مسجل لمقاول:')} ${dupC.name} (${dupC.code})` : dupW ? `${t('رقم البطاقة مسجل لعامل:')} ${dupW.name} (${dupW.code})` : '';
  const sapDup = !!f.sap && db.contractors.some(c => c.sapId === f.sap);
  const codeTaken = !!code && db.contractors.some(c => c.code === code);
  const err = !f.project ? 'اختر المشروع أولًا ليتم توليد كود المقاول آليًا' : !name ? 'أدخل اسم المقاول' : card.length !== 14 ? 'رقم البطاقة مطلوب — 14 رقمًا' : dupMsg || (sapDup ? '⛔ SAP ID مسجل لمقاول آخر' : '') || (codeTaken ? 'الكود مستخدم بالفعل' : '');

  const save = () => {
    if (err) return;
    const c: Contractor = {
      code, name, projectCode: f.project, nationalId: card, active: f.active, housingAllowance: 0, transportAllowance: 0,
      documents: [docCard, docCr, ...boqs].filter(Boolean) as string[], type: f.type, regDate: f.regDate || null,
      account: f.account.trim() || null, sapId: f.sap || null, tax14: f.tax14, notes: f.notes.trim() || null,
      docs: { card: docCard, cr: docCr, boqs },
    };
    update(d => ({ ...d, contractors: [...d.contractors, c] }));
    onAdded(code);
  };
  const file = (setter: (v: string | null) => void) => (e: React.ChangeEvent<HTMLInputElement>) => setter(e.target.files?.[0]?.name || null);

  return createPortal(
    <div className="no-print dlg-ovl" data-theme={theme} lang={lang} dir={dir} onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'var(--modal-ovl)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '36px 16px', overflow: 'auto' }}>
      <div role="dialog" dir={dir} aria-modal="true" aria-label={t('إضافة مقاول')} onClick={e => e.stopPropagation()}
        style={{ width: 'min(1080px,100%)', background: 'var(--surface)', color: 'var(--ink)', borderRadius: 4, boxShadow: '0 24px 64px rgba(0,0,0,.38)', overflow: 'hidden' }}>
        <div style={{ background: '#2B2B2E', color: '#fff', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14, borderBottom: '3px solid #F2A900' }}>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{t('إضافة مقاول')}</div>
          <button onClick={onClose} title={t('إغلاق')} aria-label={t('إغلاق')} style={{ marginInlineStart: 'auto', background: 'none', border: 0, color: 'rgba(255,255,255,.75)', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: 20 }}>
          <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 'var(--space-3)', alignItems: 'end' }}>
            <div className="field"><label>{t('المشروع الذى يعمل به')}</label>
              <select className="input" value={f.project} onChange={e => set('project', e.target.value)}>
                <option value="">{t('اختر المشروع')}</option>{projectOptions(db).map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
              </select>
            </div>
            <div className="field"><label>{t('اسم المقاول — من المقاولين المسجلين')}</label>
              <select className="input" value={f.namePick} onChange={e => set('namePick', e.target.value)}>
                <option value="">{t('— مقاول جديد —')}</option>{names.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div className="field"><label>{t('أو اسم مقاول جديد')}</label><input className="input" placeholder={t('الاسم كما فى العقد')} value={f.name} disabled={!!f.namePick} onChange={e => set('name', e.target.value)} /></div>
            <div className="field"><label>{t('كود المقاول (تلقائى من كود المشروع)')}</label><input className="input" value={code || '—'} readOnly dir="ltr" style={{ background: 'var(--color-neutral-100)', fontFamily: 'var(--font-heading)', fontSize: 18 }} /></div>
            <div className="field"><label>{t('نوع الأعمال')}</label>
              <select className="input" value={f.type} onChange={e => set('type', e.target.value as CType)}><option value="عمالة ذاتى">{t('عمالة ذاتى')}</option><option value="عمالة باطن">{t('عمالة باطن')}</option></select>
            </div>
            <div className="field"><label>{t('تاريخ التسجيل')}</label><input className="input date-input" type="date" dir="ltr" value={f.regDate} onChange={e => set('regDate', e.target.value)} /></div>
            <div className="field"><label>{t('كود الحساب (الحسابات العامة / SAP)')}</label><input className="input" dir="ltr" placeholder="2110-0457" value={f.account} onChange={e => set('account', e.target.value)} /></div>
            <div className="field"><label>{t('رقم البطاقة (الرقم القومى) * — مفتاح التتبع')}</label>
              <input className="input" dir="ltr" inputMode="numeric" maxLength={14} placeholder={t('14 رقمًا بالضبط')} value={f.card} onChange={e => set('card', e.target.value.replace(/\D/g, ''))} />
              {dupMsg && <span style={{ fontSize: 12.5, fontWeight: 700, color: '#B3261E' }}>{dupMsg}</span>}
            </div>
            <div className="field"><label>{t('حالة المقاول')}</label>
              <select className="input" value={f.active ? 'نشط' : 'غير نشط'} onChange={e => set('active', e.target.value === 'نشط')}><option value="نشط">{t('نشط')}</option><option value="غير نشط">{t('غير نشط')}</option></select>
            </div>
            <div className="field"><label>{t('الموقف الضريبى')}</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '10px 12px', border: '1px solid var(--color-neutral-300)', borderRadius: 'var(--radius-md)', margin: 0 }}>
                <input type="checkbox" checked={f.tax14} onChange={e => set('tax14', e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--accent-fg)' }} />
                <span style={{ fontWeight: 600 }}>{t(f.tax14 ? 'يخضع لضريبة 14%' : 'لا يخضع لضريبة 14%')}</span>
              </label>
            </div>
            <div className="field"><label>{t('SAP ID (كود المقاول على SAP)')}</label>
              <input className="input" dir="ltr" placeholder="400012345" value={f.sap} onChange={e => set('sap', e.target.value.replace(/\s/g, ''))} />
              {sapDup && <span style={{ fontSize: 12.5, fontWeight: 700, color: '#B3261E' }}>{t('⛔ SAP ID مسجل لمقاول آخر')}</span>}
            </div>
            <div className="field" style={{ gridColumn: '1 / -1' }}><label>{t('ملاحظات')}</label>
              <textarea className="input" rows={3} placeholder={t('تفاصيل إضافية عن التعاقد أو الأعمال المسندة…')} value={f.notes} onChange={e => set('notes', e.target.value)} style={{ resize: 'vertical', minHeight: 76 }} />
            </div>
          </div>
          <div style={{ marginTop: 'var(--space-4)' }}>
            <div style={{ fontWeight: 600, marginBottom: 'var(--space-2)' }}>{t('المستندات الرسمية — كل مرفق يُرفع مستقلًا')}</div>
            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 'var(--space-3)' }}>
              {([['١ · بطاقة المقاول', '📎 رفع بطاقة المقاول', docCard, setDocCard], ['٢ · السجل التجارى', '📎 رفع السجل التجارى', docCr, setDocCr]] as const).map(([k, b, v, s]) => (
                <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 13, color: 'var(--color-neutral-700)' }}>{t(k)}</span>
                  <label className="btn btn-secondary" style={{ cursor: 'pointer', margin: 0, justifyContent: 'center' }}>{t(b)}<input type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={file(s)} /></label>
                  {v && <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}><span className="tag tag-neutral">📄 {v}</span><button className="btn btn-ghost" style={{ padding: '0 6px', color: 'var(--color-accent-2-700)' }} onClick={() => s(null)}>✕</button></div>}
                </div>
              ))}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 13, color: 'var(--color-neutral-700)' }}>{t('٣ · المقايسات (متعددة)')}</span>
                {boqs.map((b, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                    <span className="tag tag-accent">{t('مقايسة')} {i + 1} · {b}</span>
                    <button className="btn btn-ghost" style={{ padding: '0 6px', color: 'var(--color-accent-2-700)' }} onClick={() => setBoqs(boqs.filter((_, j) => j !== i))}>✕</button>
                  </div>
                ))}
                <label className="btn btn-secondary" style={{ cursor: 'pointer', margin: 0, justifyContent: 'center' }}>
                  📎 {t('رفع مقايسة')} {boqs.length + 1}
                  <input type="file" accept="image/*,.pdf,.xlsx,.xls" style={{ display: 'none' }} onChange={e => { const n = e.target.files?.[0]?.name; if (n) setBoqs([...boqs, n]); e.target.value = ''; }} />
                </label>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', marginTop: 'var(--space-3)', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={save} disabled={!!err}>{t('+ إضافة المقاول')}</button>
            {err && <span style={{ fontSize: 13, color: '#B3261E' }}>{t(err)}</span>}
            <span style={{ fontSize: 13, color: 'var(--color-neutral-600)' }}>
              {f.project ? t(f.type === 'عمالة ذاتى'
                ? `عمالة ذاتية — أول ثلاثة أرقام هى كود المشروع ${f.project} ، وأكواد العمال تكمل العمالة الذاتية المسجلة بنفس المشروع`
                : `مشتق من كود المشروع ${f.project} — يكمل تسلسل مقاولى نفس المشروع · المقاول المتكرر فى مشروع آخر يأخذ كودًا مستقلاً`) : ''}
            </span>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
