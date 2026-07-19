-- 0002_auth_audit.sql — officer auth audit trail + 90-day retention cleanup,
-- mirroring the pattern used across Laetoli's gov apps (see SCFMIS).

create table public.auth_audit (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  email text,
  event text not null check (event in ('login', 'logout', 'failed', 'role_change')),
  ip_hint text,
  created_at timestamptz not null default now()
);

create index auth_audit_user_idx on public.auth_audit(user_id);
create index auth_audit_created_idx on public.auth_audit(created_at desc);

alter table public.auth_audit enable row level security;

create policy "auth_audit: officer/admin read" on public.auth_audit
  for select using (public.user_role() in ('officer', 'admin'));
create policy "auth_audit: authenticated insert own" on public.auth_audit
  for insert to authenticated with check (user_id = auth.uid() or user_id is null);

create or replace function public.cleanup_auth_audit()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.auth_audit where created_at < now() - interval '90 days';
$$;
