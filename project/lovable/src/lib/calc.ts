import type { Db, SarakEntry, Grade } from './types';

export const stripGrade = (p?: string | null) => String(p ?? '').replace(/\s+[A-E]$/, '').trim();

/** القيمة اليومية للمهنة بالفئة — من كتالوج المهن */
export function dailyRate(db: Db, profession: string, category?: Grade | null): number {
  const name = stripGrade(profession);
  const inherited = String(profession ?? '').match(/\s([A-E])$/)?.[1] as Grade | undefined;
  const grade = category || inherited || 'C';
  const exact = db.professions.find(p => p.name === name && p.grade === grade);
  if (exact) return exact.dailyValue;
  const any = db.professions.find(p => p.name === name);
  return any ? any.dailyValue : 0;
}

export const hourRate = (daily: number) => daily / 8;

export interface SettlementRow {
  key: string; projectCode: string; workerCode: string; workerName: string; department: string;
  period: string; days: number; hours: number; overtime: number; deduction: number;
  daily: number; hour: number; gross: number; housing: number; transport: number; total: number;
}

/**
 * التسوية المالية — كل (كود عامل × كود مشروع × شهر) يُحسب مستقلًا،
 * فينفصل الكود القديم عن الكود الجديد بعد النقل حسابيًا دون تداخل.
 */
export function settlement(db: Db, filter?: { projectCode?: string; period?: string; department?: string }): SettlementRow[] {
  const byWorker = new Map<string, typeof db.workers[number]>();
  db.workers.forEach(w => byWorker.set(w.code, w));
  const groups = new Map<string, SettlementRow>();

  for (const s of db.sarakEntries as SarakEntry[]) {
    if (!s.workDate) continue;
    const period = s.workDate.slice(0, 7);
    if (filter?.projectCode && filter.projectCode !== 'all' && s.projectCode !== filter.projectCode) continue;
    if (filter?.period && filter.period !== 'all' && period !== filter.period) continue;
    if (filter?.department && filter.department !== 'all' && s.department !== filter.department) continue;

    const key = `${s.projectCode}|${s.workerCode}|${period}`;
    const w = byWorker.get(s.workerCode);
    const daily = dailyRate(db, s.profession, s.category);
    let row = groups.get(key);
    if (!row) {
      row = {
        key, projectCode: s.projectCode, workerCode: s.workerCode, workerName: s.workerName,
        department: s.department, period, days: 0, hours: 0, overtime: 0, deduction: 0,
        daily, hour: hourRate(daily), gross: 0, housing: 0, transport: 0, total: 0,
      };
      groups.set(key, row);
    }
    row.days += 1;
    row.hours += s.hours || 0;
    row.overtime += s.overtimeHours || 0;
    row.deduction += s.deductionHours || 0;
    row.housing += w?.housingAllowance || 0;
    row.transport += w?.transportAllowance || 0;
  }

  for (const r of groups.values()) {
    r.gross = round2(r.days * r.daily + r.overtime * r.hour - r.deduction * r.hour);
    r.housing = round2(r.housing);
    r.transport = round2(r.transport);
    r.total = round2(r.gross + r.housing + r.transport);
  }
  return [...groups.values()].sort((a, b) => a.projectCode.localeCompare(b.projectCode) || a.workerCode.localeCompare(b.workerCode));
}

export const round2 = (n: number) => Math.round(n * 100) / 100;
export const money = (n: number) => (Math.round(n * 100) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
