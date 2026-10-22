-- Reference data (official registers, seeded separately) and the tables the
-- 8-stage verification pipeline writes to. All user-owned tables carry the
-- same ownership + AAL2 RLS pattern as the existing cases/documents tables.

create extension if not exists pg_trgm;

-- ---------- Reference tables (read-only to users, seed-only writes) ----------

create table if not exists registry_snapshots (
  id uuid primary key default gen_random_uuid(),
  country text not null check (country in ('GB', 'CA', 'US')),
  source text not null,
  snapshot_date date not null,
  created_at timestamptz not null default now()
);

create table if not exists institutions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country text not null check (country in ('GB', 'CA', 'US')),
  registry_id text,
  registry_status text,
  snapshot_id uuid references registry_snapshots(id),
  created_at timestamptz not null default now()
);

create index if not exists institutions_name_trgm_idx on institutions using gin (name gin_trgm_ops);
create index if not exists institutions_country_idx on institutions (country);

create table if not exists institution_domains (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references institutions(id) on delete cascade,
  domain text not null
);

create index if not exists institution_domains_institution_idx on institution_domains (institution_id);

create table if not exists red_flag_catalogue (
  code text primary key,
  severity text not null check (severity in ('high', 'medium')),
  title_en text not null,
  title_ur text not null,
  explanation_en text not null,
  explanation_ur text not null
);

alter table registry_snapshots enable row level security;
alter table institutions enable row level security;
alter table institution_domains enable row level security;
alter table red_flag_catalogue enable row level security;

create policy "registry_snapshots_read" on registry_snapshots for select using (true);
create policy "institutions_read" on institutions for select using (true);
create policy "institution_domains_read" on institution_domains for select using (true);
create policy "red_flag_catalogue_read" on red_flag_catalogue for select using (true);

-- search_institutions: trigram similarity lookup used by lib/checks/registryLookup.ts.
create or replace function search_institutions(query_name text, query_country text)
returns table (
  id uuid,
  name text,
  country text,
  registry_id text,
  registry_status text,
  similarity real
)
language sql
stable
as $$
  select i.id, i.name, i.country, i.registry_id, i.registry_status,
         similarity(i.name, query_name) as similarity
  from institutions i
  where i.country = query_country
  order by similarity(i.name, query_name) desc
  limit 5;
$$;

-- ---------- Run tables (user-owned via the parent case_run/case) ----------

create table if not exists case_runs (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  status text not null default 'running' check (status in ('running', 'completed', 'partial', 'failed')),
  stage text not null default 'extract_document',
  verdict text check (verdict in ('high_risk', 'suspicious', 'checks_passed', 'could_not_verify')),
  error_code text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create index if not exists case_runs_case_id_idx on case_runs (case_id);

create table if not exists extractions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  fields jsonb not null,
  raw_text text not null,
  model text,
  prompt_version text,
  created_at timestamptz not null default now()
);

create table if not exists findings (
  id uuid primary key default gen_random_uuid(),
  case_run_id uuid not null references case_runs(id) on delete cascade,
  source text not null check (source in ('code', 'model')),
  code text not null,
  severity text not null check (severity in ('high', 'medium', 'info')),
  document_id uuid references documents(id) on delete set null,
  quote text,
  title_en text not null,
  title_ur text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists findings_case_run_idx on findings (case_run_id);

create table if not exists drafts (
  id uuid primary key default gen_random_uuid(),
  case_run_id uuid not null references case_runs(id) on delete cascade,
  kind text not null check (kind in ('summary_en', 'summary_ur', 'verification_email', 'complaint')),
  content text not null,
  edited boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists drafts_case_run_idx on drafts (case_run_id);

create table if not exists ai_runs (
  id uuid primary key default gen_random_uuid(),
  case_run_id uuid not null references case_runs(id) on delete cascade,
  stage text not null,
  provider text not null check (provider in ('anthropic', 'google', 'none')),
  model text,
  latency_ms integer not null,
  input_tokens integer,
  output_tokens integer,
  ok boolean not null,
  error_code text,
  created_at timestamptz not null default now()
);

create index if not exists ai_runs_case_run_idx on ai_runs (case_run_id);

alter table case_runs enable row level security;
alter table extractions enable row level security;
alter table findings enable row level security;
alter table drafts enable row level security;
alter table ai_runs enable row level security;

-- Ownership: a row is visible/writable only if its parent case belongs to
-- the signed-in user AND the session completed 2FA (aal2) -- same pattern
-- as the existing cases/documents policies.
create policy "case_runs_owner_aal2" on case_runs
  for all using (
    auth.jwt() ->> 'aal' = 'aal2'
    and exists (select 1 from cases c where c.id = case_runs.case_id and c.user_id = auth.uid())
  );

create policy "extractions_owner_aal2" on extractions
  for all using (
    auth.jwt() ->> 'aal' = 'aal2'
    and exists (
      select 1 from documents d join cases c on c.id = d.case_id
      where d.id = extractions.document_id and c.user_id = auth.uid()
    )
  );

create policy "findings_owner_aal2" on findings
  for all using (
    auth.jwt() ->> 'aal' = 'aal2'
    and exists (
      select 1 from case_runs r join cases c on c.id = r.case_id
      where r.id = findings.case_run_id and c.user_id = auth.uid()
    )
  );

create policy "drafts_owner_aal2" on drafts
  for all using (
    auth.jwt() ->> 'aal' = 'aal2'
    and exists (
      select 1 from case_runs r join cases c on c.id = r.case_id
      where r.id = drafts.case_run_id and c.user_id = auth.uid()
    )
  );

create policy "ai_runs_owner_aal2" on ai_runs
  for all using (
    auth.jwt() ->> 'aal' = 'aal2'
    and exists (
      select 1 from case_runs r join cases c on c.id = r.case_id
      where r.id = ai_runs.case_run_id and c.user_id = auth.uid()
    )
  );
