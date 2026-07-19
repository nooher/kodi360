// scripts/seed-officer.mjs — one-off local script to create a demo TRA officer
// account for testing the real Supabase Auth path (not committed credentials;
// run locally with env vars, never in CI).
import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error('Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars first.');
  process.exit(1);
}

const admin = createClient(url, serviceKey);

const email = process.argv[2] || 'afisa@kodi360.demo';
const password = process.argv[3] || 'Kodi360Demo!2026';

const { data, error } = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});
if (error) {
  console.error('createUser failed:', error.message);
  process.exit(1);
}

const { error: profileError } = await admin.from('profiles').insert({
  id: data.user.id,
  name: 'Afisa Mkuu',
  role: 'admin',
  region: 'Dar es Salaam',
});
if (profileError) {
  console.error('profile insert failed:', profileError.message);
  process.exit(1);
}

console.log('Seeded officer:', email, '/', password);
