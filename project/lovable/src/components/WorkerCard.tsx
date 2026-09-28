import { useData } from '../lib/DataContext';
import { usePrefs } from '../lib/prefs';
import { projectLabel } from '../lib/geo';
import { eanOf, ean13Svg, workEndOf, barcodeIssue } from '../lib/barcode';
import { dmy } from '../lib/nid';
import type { Worker } from '../lib/types';

/**
 * كارت تعريف العامل — مقاس بطاقة 54 × 72 مم (وحدات طباعة حقيقية)، كما فى مولّد الباركود بالنموذج.
 * العامل غير النشط يظهر له "الباركود موقوف" ولا يُطبع.
 */
export default function WorkerCard({ w }: { w: Worker }) {
  const { db } = useData();
  const { t } = usePrefs();
  const inactive = !w.active;
  const con = db?.contractors.find(c => c.code === w.contractorCode);
  const contractor = !w.contractorCode ? t('عمالة ذاتي') : (con?.name || w.contractorCode);
  const iss = barcodeIssue(w.nationalId || w.code, [w.code, w.nationalId, w.projectCode, w.contractorCode, w.profession, w.department]);
  const ean = eanOf(w.code);

  const cell = (k: string, v: string, ltr = false) => (
    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, padding: '.7mm 2mm', background: '#fff' }}>
      <span style={{ fontSize: '6.5pt', color: '#5A5D66', fontWeight: 600, lineHeight: 1.2 }}>{t(k)}</span>
      <span dir={ltr ? 'ltr' : undefined} style={{ fontSize: '8pt', fontWeight: 700, color: '#1E1E21', lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v}</span>
    </div>
  );
  const date = (k: string, v: string, border: boolean) => (
    <div style={{ padding: '.6mm 2.2mm', display: 'flex', flexDirection: 'column', borderInlineEnd: border ? '.2mm solid #E4E6EC' : undefined }}>
      <span style={{ fontSize: '6.5pt', color: '#5A5D66', fontWeight: 600, lineHeight: 1.2 }}>{t(k)}</span>
      <span dir="ltr" style={{ fontWeight: 700, fontSize: '7.5pt', textAlign: 'right' }}>{v || '—'}</span>
    </div>
  );

  return (
    <div className={'worker-card' + (inactive ? ' no-print' : '')} style={{ position: 'relative', width: '54mm', height: '72mm', boxSizing: 'border-box', border: '.3mm solid #C9CCD6', borderRadius: '2.5mm', background: '#fff', color: '#1E1E21', breakInside: 'avoid', pageBreakInside: 'avoid', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 1px 4px rgba(28,31,102,.12)', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact', fontFamily: "Calibri,'IBM Plex Sans Arabic',sans-serif" }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5mm', padding: '1.3mm 2.2mm', background: '#2E3192', color: '#fff' }}>
        <div style={{ lineHeight: 1.2, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '7.5pt' }}>{t('الشروق للمقاولات العمومية والتوريدات')}</div>
          <div style={{ fontSize: '6pt', color: '#D5D9EF' }}>{t('بطاقة تعريف عامل')}</div>
        </div>
        <div style={{ background: '#fff', borderRadius: '1mm', padding: '.6mm 1.2mm', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <img src="/brand-logo.png" alt="الشروق" style={{ height: '4.6mm', maxWidth: '12mm', objectFit: 'contain' }} />
        </div>
      </div>
      <div style={{ height: '.8mm', background: '#F2A900' }} />
      <div style={{ padding: '1.4mm 2.2mm 1.1mm', display: 'flex', flexDirection: 'column', gap: '.4mm', textAlign: 'center', alignItems: 'center' }}>
        <span style={{ fontWeight: 800, fontSize: '9pt', lineHeight: 1.2, color: '#1E1E21' }}>{w.name}</span>
        <span style={{ fontSize: '7pt', fontWeight: 700, color: '#1C1F66', background: '#ECEEF8', border: '.2mm solid #D5D9EF', borderRadius: '1mm', padding: '.2mm 2mm' }}>{w.profession || '—'}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.2mm', background: '#E4E6EC', borderBlock: '.2mm solid #E4E6EC' }}>
        {cell('كود الموظف', w.code, true)}
        {cell('المقاول', contractor)}
        {cell('الرقم القومى', w.nationalId || '—', true)}
        {cell('المشروع', projectLabel(db, w.projectCode))}
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '.4mm', padding: '1mm 2.2mm' }}>
        {inactive ? (
          <div style={{ width: '100%', height: '11mm', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', border: '.4mm dashed #B3261E', color: '#B3261E', fontWeight: 700, fontSize: '7.5pt', lineHeight: 1.4, padding: '1mm', boxSizing: 'border-box', background: '#F9E6E4', borderRadius: '1mm' }}>
            ⛔ {t('عامل غير نشط — الباركود موقوف')}
          </div>
        ) : (
          <>
            <img src={ean13Svg(ean)} alt={ean} title={ean} style={{ width: '40mm', height: '11mm', objectFit: 'fill', background: '#fff', imageRendering: 'crisp-edges' }} />
            <div dir="ltr" style={{ fontSize: '9pt', fontWeight: 700, letterSpacing: '.8mm', color: '#1E1E21', fontFamily: 'Consolas,monospace', lineHeight: 1 }}>{w.code}</div>
          </>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: '.2mm solid #E4E6EC' }}>
        {date('تاريخ البداية', dmy(w.startDate), true)}
        {date('تاريخ النهاية', dmy(workEndOf(w.startDate, w.endDate)), false)}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '6pt', color: '#fff', padding: '.5mm 2.2mm', background: '#1C1F66' }}>
        <span>{t('إصدار:')} {iss.issued}</span>
        <span>{iss.versions > 1 ? `${t('إصدار')} ${iss.versions} — ${t('تغيّرت البيانات')}` : t('إصدار أول — ثابت')}</span>
      </div>
    </div>
  );
}
