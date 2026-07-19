-- 0003_public_intake_policies.sql — broaden citizen-intake INSERT policies to
-- cover both `anon` and `authenticated` roles. The three modules (Rasimisha,
-- EFD-Lite, Utatuzi) are meant to accept submissions from ANY visitor, but a
-- device that also holds a signed-in officer session sends requests as
-- `authenticated`, not `anon` — the original anon-only policies silently
-- rejected those inserts under RLS. Public intake should not depend on which
-- role the caller happens to be.

drop policy "registrations: anon insert" on public.registrations;
create policy "registrations: public insert" on public.registrations
  for insert to anon, authenticated with check (true);

drop policy "receipts: anon insert" on public.receipts;
create policy "receipts: public insert" on public.receipts
  for insert to anon, authenticated with check (true);

drop policy "disputes: anon insert" on public.disputes;
create policy "disputes: public insert" on public.disputes
  for insert to anon, authenticated with check (true);
