-- 0004_dispute_evidence_storage.sql — a private Storage bucket for objection
-- supporting documents (per the real TRA procedure: a Notice of Objection
-- "must be accompanied by relevant documents or information"). Citizens
-- upload anonymously; only TRA officers/admins can read the files back.

alter table public.disputes add column evidence_path text;

insert into storage.buckets (id, name, public)
values ('dispute-evidence', 'dispute-evidence', false)
on conflict (id) do nothing;

create policy "dispute-evidence: public upload" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'dispute-evidence');

create policy "dispute-evidence: officer/admin read" on storage.objects
  for select using (bucket_id = 'dispute-evidence' and public.user_role() in ('officer', 'admin'));

create policy "dispute-evidence: admin delete" on storage.objects
  for delete using (bucket_id = 'dispute-evidence' and public.user_role() = 'admin');
