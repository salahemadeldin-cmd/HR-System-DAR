import { get, set } from 'idb-keyval';
import type { Db } from './types';

const KEY = 'shorouk-sarak-db-v1';

/**
 * طبقة التخزين. الافتراضي: IndexedDB محليًا (بدون سيرفر).
 * للتحويل إلى Supabase: بدّل الـ adapter في lib/supabaseRepo.ts وفعّل VITE_USE_SUPABASE=true
 */
export async function loadDb(): Promise<Db> {
  const cached = await get<Db>(KEY);
  if (cached && cached.workers?.length) return cached;
  const res = await fetch('/seed.json');
  const seed = (await res.json()) as Db;
  await set(KEY, seed);
  return seed;
}

export async function saveDb(db: Db): Promise<void> {
  await set(KEY, db);
}

export async function resetDb(): Promise<Db> {
  const res = await fetch('/seed.json');
  const seed = (await res.json()) as Db;
  await set(KEY, seed);
  return seed;
}
