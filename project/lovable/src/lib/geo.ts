import SITES from '../data/sites.json';
import type { Db } from './types';

/**
 * الهيكل الجغرافى: قطاع ← موقع ← مشروع — من سجل المواقع فى النموذج الأولى (src/data/sites.json).
 * المشروع غير المسجَّل فى أى موقع يظهر "غير مصنّف".
 */
export interface SectorRef { sectorCode: string; sectorName: string; siteName: string; siteCode: string }

const SECTORS = SITES.sectors as { code: string; name: string }[];
const SEC_NAME: Record<string, string> = Object.fromEntries(SECTORS.map(s => [s.code, s.name]));
const BY_PROJECT: Record<string, SectorRef> = {};
for (const s of SITES.sites as { code: string; name: string; sectorCode: string; projects: string[] }[]) {
  for (const p of s.projects) BY_PROJECT[p] = { sectorCode: s.sectorCode, sectorName: SEC_NAME[s.sectorCode] || '—', siteName: s.name, siteCode: s.code };
}
const NONE: SectorRef = { sectorCode: '', sectorName: 'غير مصنّف', siteName: '—', siteCode: '—' };

export const sectorList = () => SECTORS;
export const sectorOfProject = (code?: string | null): SectorRef => (code && BY_PROJECT[code]) || NONE;

/** "129 — المقر الادارى الجديد" — يفضّل اسم المشروع من القاعدة ثم اسم الموقع. */
export function projectLabel(db: Db | null, code?: string | null): string {
  if (!code) return '—';
  const p = db?.projects.find(x => x.code === code);
  const name = p?.name || sectorOfProject(code).siteName;
  return name && name !== '—' ? `${code} — ${name}` : String(code);
}

/** خيارات المشروعات مرتبة بالكود ومقيدة بالقطاع إن اختير. */
export function projectOptions(db: Db, sector = 'all') {
  return db.projects
    .filter(p => sector === 'all' || sectorOfProject(p.code).sectorCode === sector)
    .sort((a, b) => a.code.localeCompare(b.code))
    .map(p => ({ code: p.code, name: `${p.code} — ${p.name}` }));
}

/** مقاولو المشروع/القطاع — كود المقاول يبدأ بكود المشروع (PPP NN 000). */
export function contractorOptions(db: Db, sector = 'all', project = 'all') {
  return db.contractors
    .filter(c => {
      const pc = c.projectCode || c.code.slice(0, 3);
      if (project !== 'all') return pc === project;
      return sector === 'all' || sectorOfProject(pc).sectorCode === sector;
    })
    .sort((a, b) => a.code.localeCompare(b.code))
    .map(c => ({ code: c.code, name: `${c.code} — ${c.name}` }));
}
