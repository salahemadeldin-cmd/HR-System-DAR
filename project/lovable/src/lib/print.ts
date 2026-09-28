/** تهريب النص قبل إدخاله فى HTML الطباعة */
export const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

/**
 * طباعة مستند HTML عبر iframe مخفى — لا تحتاج السماح بالنوافذ المنبثقة.
 * تنتظر تحميل الصور ثم تفتح نافذة الطباعة؛ وإن رفض المتصفح تُفتح نافذة مستقلة كبديل.
 */
export function printDoc(html: string, title = 'print') {
  document.getElementById('eadrs-print-frame')?.remove();
  const fr = document.createElement('iframe');
  fr.id = 'eadrs-print-frame';
  fr.setAttribute('aria-hidden', 'true');
  fr.title = title;
  fr.style.cssText = 'position:fixed;inset-inline-end:0;bottom:0;width:0;height:0;border:0;opacity:0;pointer-events:none';
  document.body.appendChild(fr);
  const d = fr.contentDocument || fr.contentWindow!.document;
  d.open(); d.write(html); d.close();
  const go = () => {
    try { fr.contentWindow!.focus(); fr.contentWindow!.print(); }
    catch {
      const wn = window.open('', '_blank');
      if (wn) { wn.document.write(html); wn.document.close(); setTimeout(() => wn.print(), 600); }
    }
    setTimeout(() => fr.remove(), 60000);
  };
  const imgs = Array.from(d.images || []);
  Promise.all(imgs.map(im => (im.complete ? 1 : new Promise(r => { im.onload = im.onerror = r; })))).then(() => setTimeout(go, 250));
}
