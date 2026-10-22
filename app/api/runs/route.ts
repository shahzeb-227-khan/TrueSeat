import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { isUuid } from "@/lib/cases/upload";
import { runPipeline, type PipelineDocument } from "@/lib/runs/pipeline";
import type { DestinationCountry } from "@/lib/schemas";

// POST /api/runs: start a verification run for a case the signed-in user owns.
// Body: { caseId }. Runs synchronously and returns the finished run id.
export async function POST(request: Request) {
  const supabase = createServerSupabase();
  if (!supabase) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const caseId = body?.caseId;
  if (typeof caseId !== "string" || !isUuid(caseId)) {
    return NextResponse.json({ error: "invalid_input", message: "A valid caseId is required." }, { status: 400 });
  }

  const { data: caseRow, error: caseError } = await supabase
    .from("cases")
    .select("id, destination_country")
    .eq("id", caseId)
    .maybeSingle();
  if (caseError) return NextResponse.json({ error: "db_error" }, { status: 500 });
  if (!caseRow) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const { data: docs, error: docsError } = await supabase
    .from("documents")
    .select("id, mime_type, storage_path")
    .eq("case_id", caseId);
  if (docsError) return NextResponse.json({ error: "db_error" }, { status: 500 });
  if (!docs || docs.length === 0) {
    return NextResponse.json({ error: "no_documents", message: "Upload at least one document first." }, { status: 400 });
  }

  const { data: run, error: runError } = await supabase
    .from("case_runs")
    .insert({ case_id: caseId, status: "running", stage: "extract_document" })
    .select("id")
    .single();
  if (runError || !run) return NextResponse.json({ error: "db_error" }, { status: 500 });

  const pipelineDocs: PipelineDocument[] = (docs as Array<{ id: string; mime_type: string; storage_path: string }>).map(
    (d) => ({ id: d.id, mimeType: d.mime_type, storagePath: d.storage_path })
  );

  try {
    await runPipeline(supabase, run.id, caseId, caseRow.destination_country as DestinationCountry, pipelineDocs);
  } catch {
    await supabase
      .from("case_runs")
      .update({ status: "failed", error_code: "pipeline_exception", finished_at: new Date().toISOString() })
      .eq("id", run.id);
  }

  return NextResponse.json({ runId: run.id }, { status: 201 });
}
