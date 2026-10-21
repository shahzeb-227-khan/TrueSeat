create table if not exists public.cases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  destination_country text not null check (destination_country in ('GB', 'CA', 'US', 'OTHER')),
  status text not null default 'open' check (status in ('open', 'waiting_university', 'verified_by_university', 'reported', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cases_user_updated_idx on public.cases (user_id, updated_at desc);

alter table public.cases enable row level security;

create policy "cases: select own" on public.cases
  for select to authenticated using (user_id = auth.uid());

create policy "cases: insert own" on public.cases
  for insert to authenticated with check (user_id = auth.uid());

create policy "cases: update own" on public.cases
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "cases: delete own" on public.cases
  for delete to authenticated using (user_id = auth.uid());

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  storage_path text not null unique check (storage_path like user_id::text || '/' || case_id::text || '/%'),
  mime_type text not null check (mime_type in ('application/pdf', 'image/jpeg', 'image/png')),
  doc_type text not null check (doc_type in ('offer_letter', 'scholarship_letter')),
  original_name text not null check (char_length(original_name) between 1 and 255),
  size_bytes integer not null check (size_bytes > 0 and size_bytes <= 10485760),
  uploaded_at timestamptz not null default now()
);

create index if not exists documents_case_id_idx on public.documents (case_id);

alter table public.documents enable row level security;

create policy "documents: select own" on public.documents
  for select to authenticated using (user_id = auth.uid());

create policy "documents: insert own into own case" on public.documents
  for insert to authenticated with check (
    user_id = auth.uid()
    and exists (select 1 from public.cases c where c.id = case_id and c.user_id = auth.uid())
  );

create policy "documents: delete own" on public.documents
  for delete to authenticated using (user_id = auth.uid());
