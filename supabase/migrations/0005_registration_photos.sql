-- 0005_registration_photos.sql — a private Storage bucket for optional
-- registration photo evidence (stall/shopfront), matching the original
-- Rasimisha vision of frictionless, photo-based informal-trader onboarding.

alter table public.registrations add column photo_path text;

insert into storage.buckets (id, name, public)
values ('registration-photos', 'registration-photos', false)
on conflict (id) do nothing;

create policy "registration-photos: public upload" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'registration-photos');

create policy "registration-photos: officer/admin read" on storage.objects
  for select using (bucket_id = 'registration-photos' and public.user_role() in ('officer', 'admin'));

create policy "registration-photos: admin delete" on storage.objects
  for delete using (bucket_id = 'registration-photos' and public.user_role() = 'admin');
