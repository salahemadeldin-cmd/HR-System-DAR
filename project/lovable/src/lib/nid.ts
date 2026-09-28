// التحقق من الرقم القومي المصري (14 رقمًا) واستخراج تاريخ الميلاد والنوع
export function isValidNationalId(v?: string | null): boolean {
  const s = String(v ?? '').trim();
  if (!/^[0-9]{14}$/.test(s)) return false;
  const century = Number(s[0]);
  if (century !== 2 && century !== 3) return false;
  const yy = Number(s.slice(1, 3)), mm = Number(s.slice(3, 5)), dd = Number(s.slice(5, 7));
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return false;
  const year = (century === 2 ? 1900 : 2000) + yy;
  const dt = new Date(year, mm - 1, dd);
  return dt.getMonth() === mm - 1 && dt.getDate() === dd;
}

export function birthFromNationalId(v?: string | null): string | null {
  if (!isValidNationalId(v)) return null;
  const s = String(v);
  const year = (Number(s[0]) === 2 ? 1900 : 2000) + Number(s.slice(1, 3));
  return `${year}-${s.slice(3, 5)}-${s.slice(5, 7)}`;
}

export function genderFromNationalId(v?: string | null): 'ذكر' | 'أنثى' | null {
  if (!isValidNationalId(v)) return null;
  return Number(String(v)[12]) % 2 === 1 ? 'ذكر' : 'أنثى';
}

export function ageFromNationalId(v?: string | null): number | null {
  const b = birthFromNationalId(v);
  if (!b) return null;
  const diff = Date.now() - new Date(b).getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
}

// كود محافظة الميلاد = الرقمان 8 و9 من الرقم القومى
const GOV_CODES: Record<string, string> = { '01': 'القاهرة', '02': 'الإسكندرية', '03': 'بورسعيد', '04': 'السويس', '11': 'دمياط', '12': 'الدقهلية', '13': 'الشرقية', '14': 'القليوبية', '15': 'كفر الشيخ', '16': 'الغربية', '17': 'المنوفية', '18': 'البحيرة', '19': 'الإسماعيلية', '21': 'الجيزة', '22': 'بني سويف', '23': 'الفيوم', '24': 'المنيا', '25': 'أسيوط', '26': 'سوهاج', '27': 'قنا', '28': 'أسوان', '29': 'الأقصر', '31': 'البحر الأحمر', '32': 'الوادي الجديد', '33': 'مطروح', '34': 'شمال سيناء', '35': 'جنوب سيناء', '88': 'خارج الجمهورية' };

export function placeFromNationalId(v?: string | null): string | null {
  const s = String(v ?? '').replace(/\D/g, '');
  return s.length === 14 ? GOV_CODES[s.slice(7, 9)] || null : null;
}

/** yyyy-mm-dd → dd/mm/yyyy للعرض */
export const dmy = (iso?: string | null) => (iso && /^\d{4}-\d{2}-\d{2}/.test(iso) ? iso.slice(0, 10).split('-').reverse().join('/') : iso || '');
