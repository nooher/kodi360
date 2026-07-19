import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/** True once real Supabase env vars are set — false means offline/demo-only. */
export function isConfigured(): boolean {
  return Boolean(import.meta.env.VITE_SUPABASE_URL) && import.meta.env.VITE_SUPABASE_URL !== '';
}
