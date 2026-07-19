-- 0001_init.sql — KODI360 core schema: officer profiles + the three offline-first
-- modules (registrations, receipts, disputes). Citizens submit anonymously (RLS
-- allows anon insert, no read of others' rows); TRA officers/admins read+manage
-- everything via a profiles.role check, mirroring THOSNgozi's
-- "anon intake, RLS-routed" pattern.

create extension if not exists pgcrypto;

-- ── profiles (TRA officer / admin accounts) ─────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  role text not null default 'officer' check (role in ('officer', 'admin')),
  region text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_role_idx on public.profiles(role);

-- SECURITY DEFINER so RLS policies can check the caller's role without
-- recursively re-triggering RLS on profiles itself.
create or replace function public.user_role()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ── registrations (Rasimisha) ────────────────────────────────────────────────
create table public.registrations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  location text not null,
  activity text not null,
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'tin_issued', 'rejected')),
  reviewed_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index registrations_phone_idx on public.registrations(phone);
create index registrations_status_idx on public.registrations(status);
create index registrations_created_idx on public.registrations(created_at desc);

-- ── receipts (EFD-Lite) ──────────────────────────────────────────────────────
create table public.receipts (
  id uuid primary key default gen_random_uuid(),
  receipt_no text not null unique,
  item text not null,
  amount numeric(14,2) not null check (amount > 0),
  buyer_phone text,
  issuer_phone text,
  created_at timestamptz not null default now()
);

create index receipts_created_idx on public.receipts(created_at desc);
create index receipts_receipt_no_idx on public.receipts(receipt_no);

-- ── disputes (Utatuzi) ───────────────────────────────────────────────────────
create table public.disputes (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  assessed_amount numeric(14,2) not null check (assessed_amount >= 0),
  undisputed_amount numeric(14,2) not null default 0 check (undisputed_amount >= 0),
  decision_date date not null,
  status text not null default 'filed' check (status in ('filed', 'under_review', 'resolved')),
  assigned_to uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index disputes_decision_date_idx on public.disputes(decision_date);
create index disputes_status_idx on public.disputes(status);
create index disputes_reference_idx on public.disputes(reference);

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.registrations enable row level security;
alter table public.receipts enable row level security;
alter table public.disputes enable row level security;

create policy "profiles: self read" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles: officer/admin read all" on public.profiles
  for select using (public.user_role() in ('officer', 'admin'));
create policy "profiles: admin manage" on public.profiles
  for all using (public.user_role() = 'admin');

create policy "registrations: anon insert" on public.registrations
  for insert to anon with check (true);
create policy "registrations: officer/admin read" on public.registrations
  for select using (public.user_role() in ('officer', 'admin'));
create policy "registrations: officer/admin update" on public.registrations
  for update using (public.user_role() in ('officer', 'admin'));

create policy "receipts: anon insert" on public.receipts
  for insert to anon with check (true);
create policy "receipts: officer/admin read" on public.receipts
  for select using (public.user_role() in ('officer', 'admin'));

create policy "disputes: anon insert" on public.disputes
  for insert to anon with check (true);
create policy "disputes: officer/admin read" on public.disputes
  for select using (public.user_role() in ('officer', 'admin'));
create policy "disputes: officer/admin update" on public.disputes
  for update using (public.user_role() in ('officer', 'admin'));
