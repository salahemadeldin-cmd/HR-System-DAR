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

export async function importSheet(file: File): Promise<Record<string, unknown>[]> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws, { defval: '' }) as Record<string, unknown>[];
}
