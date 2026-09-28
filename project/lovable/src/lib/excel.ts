import * as XLSX from 'xlsx';

export function exportSheet(rows: Record<string, unknown>[], fileName: string, sheetName = 'Sheet1') {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, fileName.endsWith('.xlsx') ? fileName : fileName + '.xlsx');
}

export function exportBook(sheets: { name: string; rows: Record<string, unknown>[] }[], fileName: string) {
  const wb = XLSX.utils.book_new();
  for (const s of sheets) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(s.rows), s.name.slice(0, 31));
  XLSX.writeFile(wb, fileName.endsWith('.xlsx') ? fileName : fileName + '.xlsx');
}

/**
 * تصدير الشاشة الحالية (زر Excel فى رأس الشاشة): كل الجداول الظاهرة داخل main بصفوفها المرئية،
 * مع قراءة قيم الحقول (input/select) — نفس سلوك exportScreen فى النموذج.
 */
export function exportVisibleTables(root: HTMLElement, title: string): boolean {
  const visible = (el: Element) => (el as HTMLElement).offsetParent !== null;
  const tables = [...root.querySelectorAll('table')].filter(visible);
  const cell = (c: Element) => {
    const f = c.querySelector('input,select,textarea') as HTMLInputElement | HTMLSelectElement | null;
    if (f) return f instanceof HTMLSelectElement ? (f.options[f.selectedIndex]?.text || '') : f.value;
    return ((c as HTMLElement).innerText || '').trim().replace(/\s+/g, ' ');
  };
  const rows: string[][] = [];
  tables.forEach((t, i) => {
    if (i) rows.push([]);
    t.querySelectorAll('tr').forEach(tr => { if (!visible(tr)) return; const cs = [...tr.children]; if (cs.length) rows.push(cs.map(cell)); });
  });
  if (!rows.length) return false;
  const today = new Date().toISOString().slice(0, 10);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), title.replace(/[[\]:*?/\\]/g, ' ').slice(0, 28) || 'Sheet1');
  XLSX.writeFile(wb, title.replace(/[\\/:*?"<>|]/g, '-') + '-' + today + '.xlsx');
  return true;
}

export async function importSheet(file: File): Promise<Record<string, unknown>[]> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws, { defval: '' }) as Record<string, unknown>[];
}
