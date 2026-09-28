export type Role = 'admin' | 'sector_manager' | 'project_manager' | 'hr' | 'accountant' | 'viewer';
export type Grade = 'A' | 'B' | 'C' | 'D' | 'E';
export type Source = 'ذاتى' | 'باطن';

export interface Department { name: string; allowanceEligible: boolean }
export interface Sector { code: string; name: string }
export interface Site { code: string; name: string; sectorCode: string }
export interface Project { code: string; name: string; sectorCode: string | null; active: boolean }
export interface Profession { name: string; grade: Grade; dailyValue: number; department: string; stopped: boolean }
export interface Contractor {
  code: string; name: string; projectCode: string | null; nationalId: string | null;
  active: boolean; housingAllowance: number; transportAllowance: number; documents: string[];
}
export interface Worker {
  code: string; name: string; nationalId: string | null; profession: string; department: string;
  projectCode: string | null; contractorCode: string | null; source: Source; category: Grade | null;
  manager: string | null; startDate: string | null; allowance: number;
  housingAllowance: number; transportAllowance: number; active: boolean; fingerprintId?: string | null;
  // حقول أُضيفت مع تصميم EADRS (اختيارية — السجلات القديمة لا تحملها)
  rate?: number | null;          // قيمة الدرجة اليومية إن اختلفت عن جدول الوظيفة
  hours?: number | null;         // ساعات العمل اليومية (افتراضى 8)
  leaveDate?: string | null;     // تاريخ المغادرة عند التحويل إلى غير نشط
  regDate?: string | null;       // تاريخ أمر الشغل
  endDate?: string | null;       // نهاية أمر الشغل
  birthDate?: string | null; birthPlace?: string | null;  // تُشتق من الرقم القومى إن لم تُسجَّل
  cardImage?: string | null;     // صورة البطاقة (data URL)
  workOrderFile?: string | null; // اسم ملف أمر الشغل
}
export interface Transfer {
  id: string; workerCode: string; oldCode: string; newCode: string;
  fromProject: string | null; toProject: string; toSector: string | null;
  transferDate: string; reason: string;
}
export interface SarakEntry {
  code: string; workDate: string | null; workerCode: string; workerName: string; profession: string;
  department: string; category: Grade | null; nationalId: string; projectCode: string; projectName: string;
  contractorCode: string | null; source: string; workDescription: string; note: string; region: string;
  shift: string; overtimeHours: number; deductionHours: number; inTime: string | null; outTime: string | null;
  hours: number; nightShift: boolean; matchStatus: string; approved: boolean;
}
export interface AppUser { id: string; fullName: string; role: Role; active: boolean }
export type Permissions = Record<string, Record<string, boolean>>;

export interface Db {
  departments: Department[]; sectors: Sector[]; sites: Site[]; projects: Project[];
  professions: Profession[]; contractors: Contractor[]; workers: Worker[];
  sarakEntries: SarakEntry[]; transfers: Transfer[]; users: AppUser[];
  permissions: Permissions; meta: { version: number; source: string };
}

export const PERMISSIONS = [
  { key: 'addWorker',  label: 'إضافة عامل جديد' },
  { key: 'fp',         label: 'تعريف البصمة للعامل' },
  { key: 'editWorker', label: 'تعديل بيانات العامل' },
  { key: 'sarakWork',  label: 'اضافة بيانات عمل سركي' },
  { key: 'approve',    label: 'اعتماد المطابقة' },
  { key: 'reports',    label: 'عرض التقارير والتكلفة' },
] as const;

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'مدير النظام', sector_manager: 'مدير قطاع', project_manager: 'مدير مشروع',
  hr: 'شئون العاملين', accountant: 'الحسابات', viewer: 'مشاهدة فقط',
};
