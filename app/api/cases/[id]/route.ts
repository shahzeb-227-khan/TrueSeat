import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { toCase, toDocument, type CaseRow, type DocumentRow } from "@/lib/cases/map";
import { isUuid } from "@/lib/cases/upload";
import { CaseUpdateSchema } from "@/lib/schemas";

// GET /api/cases/[id]: one case with its documents. Another user's id returns 404.
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const supabase = createServerSupabase();
  if (!supabase) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!isUuid(params.id)) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const { data: row, error } = await supabase
    .from("cases")
    .select("id, title, destination_country, status, notes, latest_verdict, created_at, updated_at")
    .eq("id", params.id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: "db_error" }, { status: 500 });
  if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const { data: docs, error: docsError } = await supabase
    .from("documents")
    .select("id, case_id, doc_type, mime_type, original_name, size_bytes, uploaded_at")
    .eq("case_id", params.id)
    .order("uploaded_at", { ascending: true });
  if (docsError) return NextResponse.json({ error: "db_error" }, { status: 500 });

  return NextResponse.json({
    case: toCase(row as CaseRow),
    documents: (docs as DocumentRow[]).map(toDocument),
  });
}

// DELETE /api/cases/[id]: deletes one case owned by the signed-in user.
// Cascades (FK on delete cascade) remove its documents, case_runs,
// extractions, findings, drafts and ai_runs automatically.
export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const supabase = createServerSupabase();
  if (!supabase) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!isUuid(params.id)) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // Remove stored files first, while the document rows still exist to look up.
  const { data: docs } = await supabase
    .from("documents")
    .select("storage_path")
    .eq("case_id", params.id);
  const paths = (docs ?? []).map((d) => d.storage_path as string);
  if (paths.length > 0) {
    await supabase.storage.from("evidence").remove(paths);
  }

  const { error, count } = await supabase
    .from("cases")
    .delete({ count: "exact" })
    .eq("id", params.id);
  if (error) {
    return NextResponse.json(
      { error: "db_error", message: `Could not delete the case: ${error.message}` },
      { status: 500 }
    );
  }
  if (!count) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return NextResponse.json({ deleted: true });
}

// PATCH /api/cases/[id]: update status and/or notes on a case owned by the
// signed-in user. Spec §6 must-ship #5 ("Case history: status ... notes").
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const supabase = createServerSupabase();
  if (!supabase) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!isUuid(params.id)) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = CaseUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_body", message: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 }
    );
  }

  const patch: Record<string, unknown> = {};
  if (parsed.data.status !== undefined) patch.status = parsed.data.status;
  if (parsed.data.notes !== undefined) patch.notes = parsed.data.notes;

  const { data: row, error, count } = await supabase
    .from("cases")
    .update(patch, { count: "exact" })
    .eq("id", params.id)
    .select("id, title, destination_country, status, notes, latest_verdict, created_at, updated_at")
    .maybeSingle();
  if (error) {
    return NextResponse.json(
      { error: "db_error", message: `Could not update the case: ${error.message}` },
      { status: 500 }
    );
  }
  if (!count || !row) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return NextResponse.json({ case: toCase(row as CaseRow) });
}
