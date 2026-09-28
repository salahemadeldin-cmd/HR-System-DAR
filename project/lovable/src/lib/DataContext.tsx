import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Db, Role } from './types';
import { loadDb, saveDb, resetDb } from './storage';
import { useAuth, type PermKey } from './auth';

interface Ctx {
  db: Db | null;
  loading: boolean;
  role: Role;
  setRole: (r: Role) => void;
  can: (perm: string) => boolean;
  update: (fn: (draft: Db) => Db) => void;
  reset: () => void;
}

const DataCtx = createContext<Ctx | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<Db | null>(null);
  const [loading, setLoading] = useState(true);
  const auth = useAuth();
  const [role, setRole] = useState<Role>(() => (localStorage.getItem('sarak-role') as Role) || 'admin');

  useEffect(() => { loadDb().then(d => { setDb(d); setLoading(false); }); }, []);
  useEffect(() => { localStorage.setItem('sarak-role', role); }, [role]);

  const value = useMemo<Ctx>(() => ({
    db, loading, role, setRole,
    // الصلاحيات من دور المستخدم المسجَّل دخوله (lib/auth.tsx)
    can: (perm) => auth.can(perm as PermKey),
    update: (fn) => setDb(prev => { if (!prev) return prev; const next = fn(prev); saveDb(next); return next; }),
    reset: () => { setLoading(true); resetDb().then(d => { setDb(d); setLoading(false); }); },
  }), [db, loading, role, auth]);

  return <DataCtx.Provider value={value}>{children}</DataCtx.Provider>;
}

export function useData() {
  const ctx = useContext(DataCtx);
  if (!ctx) throw new Error('useData must be used inside DataProvider');
  return ctx;
}
