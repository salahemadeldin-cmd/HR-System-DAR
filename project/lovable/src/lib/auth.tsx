import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

/**
 * المستخدمون والدخول — مطابق للنموذج الأولى:
 * - المستخدمون فى localStorage "eadrs.users"، والمالك 0001 مضمون دائمًا ولا يُحذف.
 * - الجلسة فى sessionStorage "eadrs.auth" (كود الموظف).
 * - الدخول بكود الموظف أو البريد + كلمة المرور (المؤقتة 00000).
 * ملاحظة: هذه مصادقة محلية للنموذج فقط — تنتقل إلى Supabase Auth عند الربط بالخادم.
 */
export type RoleKey = 'إدارة عليا' | 'مدير مشروع' | 'إشراف' | 'شؤون عاملين' | 'إدخال بيانات';
export const OWNER_ROLE = 'مالك النظام';

export const ROLES: { v: RoleKey; l: string; color: string }[] = [
  { v: 'إدارة عليا', l: 'إدارة عليا', color: '#2E3192' },
  { v: 'مدير مشروع', l: 'مدير مشروع', color: '#5F68D2' },
  { v: 'إشراف', l: 'مشرف موقع', color: '#F2A900' },
  { v: 'شؤون عاملين', l: 'شؤون عاملين', color: '#55565C' },
  { v: 'إدخال بيانات', l: 'مدخل بيانات', color: '#8A8C94' },
];

export const PERM_KEYS = ['addWorker', 'fp', 'editWorker', 'sarakWork', 'approve', 'reports', 'manageUsers'] as const;
export type PermKey = typeof PERM_KEYS[number];
export type PermMatrix = Record<RoleKey, Record<PermKey, boolean>>;

const DEFAULT_PERMS: PermMatrix = {
  'إدارة عليا':   { addWorker: true, fp: true,  editWorker: true, sarakWork: true,  approve: true,  reports: true,  manageUsers: true },
  'إشراف':        { addWorker: true, fp: true,  editWorker: true, sarakWork: true,  approve: true,  reports: true,  manageUsers: false },
  'إدخال بيانات': { addWorker: true, fp: true,  editWorker: true, sarakWork: true,  approve: false, reports: false, manageUsers: false },
  'مدير مشروع':   { addWorker: true, fp: true,  editWorker: true, sarakWork: true,  approve: true,  reports: true,  manageUsers: false },
  'شؤون عاملين':  { addWorker: true, fp: false, editWorker: true, sarakWork: false, approve: false, reports: true,  manageUsers: false },
};

export interface User {
  code: string; name: string; email?: string; role: RoleKey | typeof OWNER_ROLE;
  projectCode: string; password: string; active: boolean; owner?: boolean;
}

const OWNER: User = { code: '0001', name: 'صاحب النظام', role: OWNER_ROLE, projectCode: 'all', password: '00000', owner: true, active: true };

function loadUsers(): User[] {
  try {
    const u = JSON.parse(localStorage.getItem('eadrs.users') || 'null');
    if (Array.isArray(u) && u.length) return u.some((x: User) => x.owner) ? u : [OWNER, ...u];
  } catch { /* corrupt or blocked */ }
  return [OWNER];
}
function loadPerms(): PermMatrix {
  try {
    const p = JSON.parse(localStorage.getItem('eadrs.perms') || 'null');
    if (p && typeof p === 'object') {
      const out = { ...DEFAULT_PERMS };
      for (const r of ROLES) out[r.v] = { ...DEFAULT_PERMS[r.v], ...(p[r.v] || {}) };
      return out;
    }
  } catch { /* ignore */ }
  return DEFAULT_PERMS;
}

export function roleLabel(r: string) {
  if (r === OWNER_ROLE) return OWNER_ROLE;
  return ROLES.find(x => x.v === r)?.l || r || '—';
}

interface Ctx {
  users: User[]; user: User | null; perms: PermMatrix;
  login: (code: string, pass: string) => string | null;
  logout: () => void;
  saveUsers: (u: User[]) => void;
  setPerms: (p: PermMatrix) => void;
  can: (k: PermKey) => boolean;
}
const AuthCtx = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>(loadUsers);
  const [perms, setPermsState] = useState<PermMatrix>(loadPerms);
  const [authCode, setAuthCode] = useState<string>(() => { try { return sessionStorage.getItem('eadrs.auth') || ''; } catch { return ''; } });

  const saveUsers = useCallback((u: User[]) => {
    try { localStorage.setItem('eadrs.users', JSON.stringify(u)); } catch { /* ignore */ }
    setUsers(u);
  }, []);
  const setPerms = useCallback((p: PermMatrix) => {
    try { localStorage.setItem('eadrs.perms', JSON.stringify(p)); } catch { /* ignore */ }
    setPermsState(p);
  }, []);

  const login = useCallback((rawCode: string, pass: string) => {
    const code = rawCode.trim();
    const u = users.find(x => x.code === code || (!!x.email && x.email.toLowerCase() === code.toLowerCase()));
    if (u && u.active === false) return 'هذا الحساب معطّل — راجع مدير النظام';
    if (!code || !pass) return 'أدخل كود الموظف وكلمة المرور';
    if (!u || (u.password || '00000') !== pass) return 'كود الموظف أو كلمة المرور غير صحيحة';
    try { sessionStorage.setItem('eadrs.auth', u.code); } catch { /* ignore */ }
    setAuthCode(u.code);
    return null;
  }, [users]);

  const logout = useCallback(() => {
    try { sessionStorage.removeItem('eadrs.auth'); } catch { /* ignore */ }
    setAuthCode('');
  }, []);

  const user = users.find(x => x.code === authCode && x.active !== false) || null;

  const value = useMemo<Ctx>(() => ({
    users, user, perms, login, logout, saveUsers, setPerms,
    can: (k) => !!user && (user.owner || user.role === OWNER_ROLE || !!perms[user.role as RoleKey]?.[k]),
  }), [users, user, perms, login, logout, saveUsers, setPerms]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const c = useContext(AuthCtx);
  if (!c) throw new Error('useAuth must be used inside AuthProvider');
  return c;
}
