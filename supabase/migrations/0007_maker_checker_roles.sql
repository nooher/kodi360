-- 0007_maker_checker_roles.sql — real, DB-enforced role-specific access: a
-- maker-checker separation between `officer` (can review/take-up a case) and
-- `admin` (the only role that can finalize: issue TIN, reject, or resolve).
-- This is enforced in WITH CHECK, not just hidden in the UI — an officer
-- account attempting to set a final status is rejected by Postgres itself.

drop policy "registrations: officer/admin update" on public.registrations;

create policy "registrations: officer review-only update" on public.registrations
  for update
  using (public.user_role() = 'officer')
  with check (public.user_role() = 'officer' and status in ('pending', 'reviewed'));

create policy "registrations: admin full update" on public.registrations
  for update
  using (public.user_role() = 'admin')
  with check (public.user_role() = 'admin');

drop policy "disputes: officer/admin update" on public.disputes;

create policy "disputes: officer take-up-only update" on public.disputes
  for update
  using (public.user_role() = 'officer')
  with check (public.user_role() = 'officer' and status in ('filed', 'under_review'));

create policy "disputes: admin full update" on public.disputes
  for update
  using (public.user_role() = 'admin')
  with check (public.user_role() = 'admin');
