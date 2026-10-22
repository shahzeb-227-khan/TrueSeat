-- Adds the verdict column to cases, used to show the latest result on the
-- case list and detail pages without joining case_runs every time.
alter table cases
  add column if not exists latest_verdict text
    check (latest_verdict in ('high_risk', 'suspicious', 'checks_passed', 'could_not_verify'));
