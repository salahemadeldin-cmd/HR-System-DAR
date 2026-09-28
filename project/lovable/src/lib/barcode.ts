/**
 * باركود EAN-13 لكل عامل — نفس النموذج: 622 (مصر) + آخر 9 أرقام من كود العامل + رقم تحقق.
 * يُرسم SVG بلا أرقام أسفله (الكود يُكتب تحت الصورة فى الكارت).
 */
export function eanOf(code: string): string {
  const d = String(code || '').replace(/\D/g, '').slice(-9).padStart(9, '0');
  const b = '622' + d;
  let s = 0;
  for (let i = 0; i < 12; i++) s += Number(b[i]) * (i % 2 ? 3 : 1);
  return b + ((10 - (s % 10)) % 10);
}

const L = ['0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011'];
const G = ['0100111', '0110011', '0011011', '0100001', '0011101', '0111001', '0000101', '0010001', '0001001', '0010111'];
const R = ['1110010', '1100110', '1101100', '1000010', '1011100', '1001110', '1010000', '1000100', '1001000', '1110100'];
const P = ['LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG', 'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL'];

const cache = new Map<string, string>();

/** data URI لصورة SVG لباركود EAN-13 (13 رقمًا). */
export function ean13Svg(code: string): string {
  const hit = cache.get(code);
  if (hit) return hit;
  const par = P[Number(code[0])];
  let bits = '101';
  for (let i = 1; i <= 6; i++) bits += (par[i - 1] === 'L' ? L : G)[Number(code[i])];
  bits += '01010';
  for (let i = 7; i <= 12; i++) bits += R[Number(code[i])];
  bits += '101';
  const m = 2, q = 11 * m, H = 70, W = q * 2 + bits.length * m, TH = 78;
  let rects = '';
  for (let i = 0; i < bits.length; i++) if (bits[i] === '1') rects += `<rect x="${q + i * m}" y="4" width="${m}" height="${H}"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${TH}" width="${W}" height="${TH}"><rect width="${W}" height="${TH}" fill="#fff"/><g fill="#000" shape-rendering="crispEdges">${rects}</g></svg>`;
  const uri = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  cache.set(code, uri);
  return uri;
}

/** نهاية أمر الشغل: المسجَّلة، أو 3 أشهر بعد البداية (نفس workEndOf فى النموذج). */
export function workEndOf(start?: string | null, end?: string | null): string {
  if (end) return end;
  if (!start || !/^\d{4}-\d{2}-\d{2}/.test(start)) return '';
  const d = new Date(start + 'T00:00:00');
  d.setMonth(d.getMonth() + 3);
  return d.toISOString().slice(0, 10);
}

/**
 * سجل إصدار الباركود لكل عامل: يبقى "إصدار أول — ثابت" ما دامت بياناته (الكود، البطاقة، المشروع،
 * المقاول، المهنة، الإدارة) كما هى؛ أى تغيير يرفع رقم الإصدار. محفوظ فى localStorage "eadrs.bcIssued".
 */
export interface Issue { value: string; issued: string; versions: number }
let issued: Record<string, Issue> | null = null;

export function barcodeIssue(key: string, parts: (string | null | undefined)[]): Issue {
  if (!issued) { try { issued = JSON.parse(localStorage.getItem('eadrs.bcIssued') || '{}'); } catch { issued = {}; } }
  let h = 7;
  const sig = parts.map(p => p ?? '').join('|');
  for (let i = 0; i < sig.length; i++) h = (h * 31 + sig.charCodeAt(i)) >>> 0;
  const value = String(h % 10000).padStart(4, '0');
  const today = new Date().toLocaleDateString('en-GB');
  const cur = issued![key];
  let changed = false;
  if (!cur) { issued![key] = { value, issued: today, versions: 1 }; changed = true; }
  else if (cur.value !== value) { issued![key] = { value, issued: today, versions: cur.versions + 1 }; changed = true; }
  if (changed) { try { localStorage.setItem('eadrs.bcIssued', JSON.stringify(issued)); } catch { /* ignore */ } }
  return issued![key];
}
