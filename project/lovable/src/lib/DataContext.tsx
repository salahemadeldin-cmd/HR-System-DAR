import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Db, Role } from './types';
import { loadDb, saveDb, resetDb } from './storage';

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
  const [role, setRole] = useState<Role>(() => (localStorage.getItem('sarak-role') as Role) || 'admin');

  useEffect(() => { loadDb().then(d => { setDb(d); setLoading(false); }); }, []);
  useEffect(() => { localStorage.setItem('sarak-role', role); }, [role]);

  const value = useMemo<Ctx>(() => ({
    db, loading, role, setRole,
    can: (perm) => !!db?.permissions?.[role]?.[perm],
    update: (fn) => setDb(prev => { if (!prev) return prev; const next = fn(prev); saveDb(next); return next; }),
    reset: () => { setLoading(true); resetDb().then(d => { setDb(d); setLoading(false); }); },
  }), [db, loading, role]);

  return <DataCtx.Provider value={value}>{children}</DataCtx.Provider>;
}

export function useData() {
  const ctx = useContext(DataCtx);
  if (!ctx) throw new Error('useData must be used inside DataProvider');
  return ctx;
}
