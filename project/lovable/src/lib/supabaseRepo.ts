import { createClient } from '@supabase/supabase-js';
import type { Db } from './types';

/**
 * المسار الثاني: التشغيل على Supabase.
 * ضع المفاتيح في .env ثم شغّل VITE_USE_SUPABASE=true — المخطط في supabase/schema.sql
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
export const supabase = url && key ? createClient(url, key) : null;
export const useSupabase = import.meta.env.VITE_USE_SUPABASE === 'true' && !!supabase;

export async function fetchAll(): Promise<Partial<Db>> {
  if (!supabase) throw new Error('Supabase غير مهيأ');
  const t = async (name: string) => (await supabase.from(name).select('*')).data ?? [];
  const [departments, sectors, sites, projects, professions, contractors, workers, sarakEntries, transfers] =
    await Promise.all([
      t('departments'), t('sectors'), t('sites'), t('projects'), t('professions'),
      t('contractors'), t('workers'), t('sarak_entries'), t('worker_transfers'),
    ]);
  return { departments, sectors, sites, projects, professions, contractors, workers, sarakEntries, transfers } as Partial<Db>;
}
