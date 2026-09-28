import React from 'react';

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><span className="label">{label}</span>{children}</div>;
}

export function Kpi({ label, value, meta }: { label: string; value: string | number; meta?: string }) {
  return (
    <div className="card">
      <div className="text-xs font-semibold text-ink/60">{label}</div>
      <div className="mt-1 text-2xl font-bold text-navy">{value}</div>
      {meta && <div className="mt-1 text-[11px] text-ink/50">{meta}</div>}
    </div>
  );
}

export function Table({ head, children, maxH = '62vh' }: { head: string[]; children: React.ReactNode; maxH?: string }) {
  return (
    <div className="card overflow-auto p-0" style={{ maxHeight: maxH }}>
      <table className="w-full border-collapse">
        <thead><tr>{head.map(h => <th key={h} className="th">{h}</th>)}</tr></thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Modal({ open, title, children, onClose }: { open: boolean; title: string; children: React.ReactNode; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl2 bg-white p-5 shadow-card" onClick={e => e.stopPropagation()}>
        <h3 className="mb-3 text-base font-bold text-navy">{title}</h3>
        {children}
      </div>
    </div>
  );
}

export function Empty({ text }: { text: string }) {
  return <div className="card text-center text-sm text-ink/50">{text}</div>;
}

export function Denied() {
  return <div className="card border border-danger/30 text-sm text-danger">لا تملك صلاحية على هذه الشاشة. غيّر الدور من الشريط الجانبي.</div>;
}
