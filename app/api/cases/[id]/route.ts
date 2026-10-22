import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { toCase, toDocument, type CaseRow, type DocumentRow } from "@/lib/cases/map";
import { isUuid } from "@/lib/cases/upload";

// GET /api/cases/[id]: one case with its documents. Another user's id returns 404.
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const supabase = createServerSupabase();
  if (!supabase) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!isUuid(params.id)) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const { data: row, error } = await supabase
    .from("cases")
    .select("id, title, destination_country, status, latest_verdict, created_at, updated_at")
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
