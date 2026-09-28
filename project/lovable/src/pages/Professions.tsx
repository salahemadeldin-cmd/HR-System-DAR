import { useMemo, useState } from 'react';
import { useData } from '../lib/DataContext';
import { Field, Table, Modal } from '../components/ui';
import { DEPARTMENTS } from '../lib/dept';
import { exportSheet } from '../lib/excel';
import { hourRate, money } from '../lib/calc';
import type { Grade, Profession } from '../lib/types';

const GRADES: Grade[] = ['A', 'B', 'C', 'D', 'E'];
const CAT_DESC: Record<Grade, string> = {
  A: 'إشراف وقيادة موقع — مسؤولية إدارة فريق، وتُصرف لها بدلات كاملة.',
  B: 'فنى أول — خبرة كاملة في التخصص ويعمل دون إشراف مباشر.',
  C: 'فنى — يؤدي الأعمال المعتادة تحت إشراف فنى أول.',
  D: 'مساعد فنى — أعمال مساندة ومناولة.',
  E: 'تحت التدريب — فترة اختبار، لا يستحق بدل منطقة حتى انتهاء التدريب.',
};

export default function Professions() {
  const { db, update, can } = useData();
  const [dept, setDept] = useState('all');
  const [q, setQ] = useState('');
  const [edit, setEdit] = useState<{ p: Profession; value: string; grade: Grade; eff: string } | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const rows = useMemo(() => {
    if (!db) return [];
    const t = q.trim();
    return db.professions.filter(p => (dept === 'all' || p.department === dept) && (!t || p.name.includes(t)));
  }, [db, dept, q]);

  const applyChange = () => {
    if (!edit) return;
    const { p, value, grade } = edit;
    update(d => ({
      ...d,
      professions: d.professions.map(x =>
        x.name === p.name && x.grade === p.grade ? { ...x, dailyValue: Number(value) || x.dailyValue, grade } : x),
    }));
    setEdit(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <Field label="القسم">
          <select className="input" value={dept} onChange={e => setDept(e.target.value)}>
            <option value="all">كل الأقسام</option>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </Field>
        <Field label="بحث"><input className="input" value={q} onChange={e => setQ(e.target.value)} placeholder="اسم المهنة" /></Field>
        <div className="flex gap-2">
          <button className="btn btn-primary" onClick={() => setAddOpen(true)}>إضافة مهنة</button>
          <button className="btn btn-secondary" onClick={() => exportSheet(rows as unknown as Record<string, unknown>[], 'المهن والفئات')}>تصدير Excel</button>
        </div>
        <span className="text-xs text-ink/50">{rows.length} مهنة</span>
      </div>

      <Table head={['المهنة', 'القسم', 'الفئة', 'القيمة اليومية', 'سعر الساعة', 'الساعة الإضافية', 'الحالة', '']}>
        {rows.map(p => (
          <tr key={p.name + p.grade}>
            <td className="td font-semibold">{p.name}</td>
            <td className="td text-xs">{p.department}</td>
            <td className="td" dir="ltr">{p.grade}</td>
            <td className="td font-bold text-navy" dir="ltr">{money(p.dailyValue)}</td>
            <td className="td" dir="ltr">{money(hourRate(p.dailyValue))}</td>
            <td className="td" dir="ltr">{money(hourRate(p.dailyValue))}</td>
            <td className="td"><span className="tag">{p.stopped ? 'موقوفة' : 'سارية'}</span></td>
            <td className="td">
              <button className="btn btn-secondary" style={{ padding: '2px 10px', fontSize: 12 }}
                onClick={() => setEdit({ p, value: String(p.dailyValue), grade: p.grade, eff: new Date().toISOString().slice(0, 10) })}>
                تعديل
              </button>
            </td>
          </tr>
        ))}
      </Table>

      <Modal open={!!edit} title="تعديل فئة / قيمة المهنة" onClose={() => setEdit(null)}>
        {edit && (
          <>
            <p className="mb-3 text-sm">
              <strong>{edit.p.name}</strong> — الفئة الحالية {edit.p.grade} بقيمة {money(edit.p.dailyValue)} ج.م/يوم.
            </p>
            <div className="grid gap-3 md:grid-cols-3">
              <Field label="الفئة الجديدة">
                <select className="input" value={edit.grade} onChange={e => setEdit({ ...edit, grade: e.target.value as Grade })}>
                  {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </Field>
              <Field label="القيمة اليومية"><input className="input" dir="ltr" value={edit.value} onChange={e => setEdit({ ...edit, value: e.target.value })} /></Field>
              <Field label="تاريخ السريان"><input type="date" className="input" value={edit.eff} onChange={e => setEdit({ ...edit, eff: e.target.value })} /></Field>
            </div>
            <p className="mt-3 rounded-lg bg-navy-pale p-3 text-xs text-navy">{CAT_DESC[edit.grade]}</p>
            <p className="mt-2 text-xs text-danger">
              التغيير يسري على كل العمال بهذه المهنة من تاريخ السريان، ولا يمسّ السراكي المعتمدة قبله.
            </p>
            <div className="mt-4 flex gap-2">
              <button className="btn btn-primary" onClick={applyChange}>تأكيد التغيير</button>
              <button className="btn btn-secondary" onClick={() => setEdit(null)}>إلغاء</button>
            </div>
          </>
        )}
      </Modal>

      <AddProfession open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}

function AddProfession({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { update } = useData();
  const [p, setP] = useState({ name: '', grade: 'C' as Grade, value: '', department: DEPARTMENTS[2] as string });
  const save = () => {
    if (!p.name.trim() || !p.value) return;
    update(d => ({ ...d, professions: [{ name: p.name.trim(), grade: p.grade, dailyValue: Number(p.value), department: p.department, stopped: false }, ...d.professions] }));
    setP({ name: '', grade: 'C', value: '', department: DEPARTMENTS[2] });
    onClose();
  };
  return (
    <Modal open={open} title="إضافة مهنة جديدة" onClose={onClose}>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="اسم المهنة"><input className="input" value={p.name} onChange={e => setP({ ...p, name: e.target.value })} /></Field>
        <Field label="القسم">
          <select className="input" value={p.department} onChange={e => setP({ ...p, department: e.target.value })}>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </Field>
        <Field label="الفئة">
          <select className="input" value={p.grade} onChange={e => setP({ ...p, grade: e.target.value as Grade })}>
            {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </Field>
        <Field label="القيمة اليومية"><input className="input" dir="ltr" value={p.value} onChange={e => setP({ ...p, value: e.target.value })} /></Field>
      </div>
      <div className="mt-4 flex gap-2">
        <button className="btn btn-primary" onClick={save} disabled={!p.name.trim() || !p.value}>حفظ</button>
        <button className="btn btn-secondary" onClick={onClose}>إلغاء</button>
      </div>
    </Modal>
  );
}
