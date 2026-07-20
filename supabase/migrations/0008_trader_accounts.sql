-- 0008_trader_accounts.sql — real trader/taxpayer accounts, identified by
-- NIDA (individual) or TIN (business), replacing the fully-anonymous citizen
-- model for the three modules that need continuity across devices/sessions:
-- Rasimisha (now the sign-up flow itself), EFD-Lite, and Utatuzi. Kadirio and
-- Akili wa Kodi remain open, no account needed — they don't hold personal
-- records.
--
-- IMPORTANT CAVEAT (documented here, not just in the app): this platform has
-- no live NIDA/TRA verification API. id_number is a SELF-DECLARED identifier
-- at this stage, not government-verified — the same trust model as the phone
-- number it replaces, but a far more meaningful and durable identity key,
-- and the natural integration point once a real NIDA/TRA connection exists.

create table public.trader_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  id_type text not null check (id_type in ('nida', 'tin')),
  id_number text not null,
  name text not null,
  phone text not null,
  activity text not null,
  created_at timestamptz not null default now(),
  unique (id_type, id_number)
);

create index trader_profiles_id_number_idx on public.trader_profiles(id_number);

alter table public.trader_profiles enable row level security;

create policy "trader_profiles: self read" on public.trader_profiles
  for select using (id = auth.uid());
create policy "trader_profiles: officer/admin read" on public.trader_profiles
  for select using (public.user_role() in ('officer', 'admin'));
create policy "trader_profiles: self insert" on public.trader_profiles
  for insert to authenticated with check (id = auth.uid());
create policy "trader_profiles: self update" on public.trader_profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- ── link registrations/receipts/disputes to the owning trader ──────────────
alter table public.registrations add column trader_id uuid references auth.users(id);
alter table public.receipts add column trader_id uuid references auth.users(id);
alter table public.disputes add column trader_id uuid references auth.users(id);

create index registrations_trader_idx on public.registrations(trader_id);
create index receipts_trader_idx on public.receipts(trader_id);
create index disputes_trader_idx on public.disputes(trader_id);

-- ── replace anon-open intake with trader-owned intake ───────────────────────
drop policy "registrations: public insert" on public.registrations;
drop policy "registrations: officer/admin read" on public.registrations;

create policy "registrations: trader insert own" on public.registrations
  for insert to authenticated with check (trader_id = auth.uid());
create policy "registrations: trader read own" on public.registrations
  for select using (trader_id = auth.uid());
create policy "registrations: officer/admin read all" on public.registrations
  for select using (public.user_role() in ('officer', 'admin'));

drop policy "receipts: public insert" on public.receipts;
drop policy "receipts: officer/admin read" on public.receipts;

create policy "receipts: trader insert own" on public.receipts
  for insert to authenticated with check (trader_id = auth.uid());
create policy "receipts: trader read own" on public.receipts
  for select using (trader_id = auth.uid());
create policy "receipts: officer/admin read all" on public.receipts
  for select using (public.user_role() in ('officer', 'admin'));

drop policy "disputes: public insert" on public.disputes;
drop policy "disputes: officer/admin read" on public.disputes;

create policy "disputes: trader insert own" on public.disputes
  for insert to authenticated with check (trader_id = auth.uid());
create policy "disputes: trader read own" on public.disputes
  for select using (trader_id = auth.uid());
create policy "disputes: officer/admin read all" on public.disputes
  for select using (public.user_role() in ('officer', 'admin'));
