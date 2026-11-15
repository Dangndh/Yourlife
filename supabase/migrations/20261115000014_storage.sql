-- =====================================================================
-- 15. STORAGE (Supabase only)
--   Bucket 'attachments' (private). Path: <user_id>/<entity_type>/<file>
-- =====================================================================
insert into storage.buckets (id, name, public) values ('attachments', 'attachments', false);
create policy "own files" on storage.objects for all to authenticated
  using (bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'attachments' and (storage.foldername(name))[1] = auth.uid()::text);
