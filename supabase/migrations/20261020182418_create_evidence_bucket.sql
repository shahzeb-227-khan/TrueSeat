insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('evidence', 'evidence', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png'])
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "evidence: upload to own folder" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'evidence' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "evidence: read own folder" on storage.objects
  for select to authenticated using (
    bucket_id = 'evidence' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "evidence: delete own folder" on storage.objects
  for delete to authenticated using (
    bucket_id = 'evidence' and (storage.foldername(name))[1] = auth.uid()::text
  );
