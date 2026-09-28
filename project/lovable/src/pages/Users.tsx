import { useData } from '../lib/DataContext';
import { Table } from '../components/ui';
import { PERMISSIONS, ROLE_LABELS, type Role } from '../lib/types';

export default function Users() {
  const { db, update, role, reset } = useData();
  const roles = Object.keys(ROLE_LABELS) as Role[];

  const toggle = (r: Role, key: string) =>
    update(d => ({
      ...d,
      permissions: { ...d.permissions, [r]: { ...(d.permissions[r] || {}), [key]: !d.permissions[r]?.[key] } },
    }));

  return (
    <div className="space-y-5">
      <div>
        <h2 className="mb-2 text-sm font-bold text-navy">مصفوفة الصلاحيات</h2>
        <Table head={['الصلاحية', ...roles.map(r => ROLE_LABELS[r])]} maxH="46vh">
          {PERMISSIONS.map(p => (
            <tr key={p.key}>
              <td className="td font-semibold">{p.label}</td>
              {roles.map(r => (
                <td key={r} className="td text-center">
                  <input type="checkbox" className="h-4 w-4 accent-navy"
                    checked={!!db!.permissions[r]?.[p.key]} onChange={() => toggle(r, p.key)} />
                </td>
              ))}
            </tr>
          ))}
        </Table>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-bold text-navy">المستخدمون</h2>
        <Table head={['الاسم', 'الدور', 'الحالة']} maxH="30vh">
          {db!.users.map(u => (
            <tr key={u.id}>
              <td className="td font-semibold">{u.fullName}</td>
              <td className="td">
                <select className="input max-w-[180px]" value={u.role}
                  onChange={e => update(d => ({ ...d, users: d.users.map(x => x.id === u.id ? { ...x, role: e.target.value as Role } : x) }))}>
                  {roles.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                </select>
              </td>
              <td className="td"><span className="tag">{u.active ? 'نشط' : 'موقوف'}</span></td>
            </tr>
          ))}
        </Table>
      </div>

      <div className="card">
        <h3 className="mb-1 text-sm font-bold text-navy">إدارة البيانات</h3>
        <p className="mb-3 text-xs text-ink/60">
          الدور المفعّل حاليًا للمعاينة: <strong>{ROLE_LABELS[role]}</strong>.
          البيانات محفوظة محليًا في المتصفح (IndexedDB). لإعادتها إلى بيانات الاستيراد الأصلية:
        </p>
        <button className="btn-danger" onClick={() => { if (confirm('سيتم مسح كل التعديلات المحلية والعودة لبيانات الاستيراد. متابعة؟')) reset(); }}>
          إعادة تعيين قاعدة البيانات
        </button>
      </div>
    </div>
  );
}
