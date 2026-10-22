import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { isUuid } from "@/lib/cases/upload";
import type { Draft, Finding, RunResult } from "@/lib/schemas";

// GET /api/runs/[id]: the run's status plus its findings and drafts so far.
// Used both for the final results screen and to poll a "running" run's
// live stage for the progress view.
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const supabase = createServerSupabase();
  if (!supabase) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!isUuid(params.id)) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const { data: run, error } = await supabase
    .from("case_runs")
    .select("id, case_id, status, stage, verdict, error_code, started_at, finished_at")
    .eq("id", params.id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: "db_error" }, { status: 500 });
  if (!run) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const { data: findingRows } = await supabase
    .from("findings")
    .select("id, source, code, severity, document_id, quote, title_en, title_ur, details")
    .eq("case_run_id", params.id)
    .order("severity", { ascending: true });

  const { data: draftRows } = await supabase
    .from("drafts")
    .select("id, kind, content, edited")
    .eq("case_run_id", params.id);

  const findings: Finding[] = ((findingRows ?? []) as Array<Record<string, unknown>>).map((f) => ({
    id: f.id as string,
    source: f.source as Finding["source"],
    code: f.code as string,
    severity: f.severity as Finding["severity"],
    documentId: f.document_id as string | null,
    quote: f.quote as string | null,
    titleEn: f.title_en as string,
    titleUr: (f.title_ur as string | undefined) ?? undefined,
    details: (f.details as Record<string, unknown>) ?? {},
  }));

  const drafts: Draft[] = ((draftRows ?? []) as Array<Record<string, unknown>>).map((d) => ({
    id: d.id as string,
    kind: d.kind as Draft["kind"],
    content: d.content as string,
    edited: Boolean(d.edited),
  }));

  const result: RunResult = {
    id: run.id,
    caseId: run.case_id,
    status: run.status,
    stage: run.stage,
    verdict: run.verdict,
    registrySnapshotIds: [],
    errorCode: run.error_code,
    startedAt: run.started_at,
    finishedAt: run.finished_at,
    findings,
    drafts,
  };

  return NextResponse.json({ run: result });
}
