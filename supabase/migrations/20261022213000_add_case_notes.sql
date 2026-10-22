-- Adds a free-text notes column to cases, per SPEC §6 must-ship #5
-- ("Case history: saved cases with status ... notes, add more evidence").
-- Additive, nullable, no RLS change needed: existing row-level policies on
-- cases already cover every column on the row.
alter table cases
  add column if not exists notes text check (notes is null or char_length(notes) <= 4000);
