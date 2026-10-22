import { createServerSupabase } from "@/lib/supabase/server";
import { toCase, toDocument, type CaseRow, type DocumentRow } from "@/lib/cases/map";
import { isUuid } from "@/lib/cases/upload";
import type { CaseWithDocuments } from "@/lib/schemas";

// Server-side loader for the case detail page. RLS hides other users' cases,
// so a foreign or unknown id returns "not_found" exactly like a missing one.
export async function getCaseWithDocuments(
  id: string
): Promise<CaseWithDocuments | "not_found" | "unavailable"> {
  const supabase = createServerSupabase();
  if (!supabase) return "unavailable";
  if (!isUuid(id)) return "not_found";

  const { data: row } = await supabase
    .from("cases")
    .select("id, title, destination_country, status, latest_verdict, created_at, updated_at")
    .eq("id", id)
    .maybeSingle();
  if (!row) return "not_found";

  const { data: docs } = await supabase
    .from("documents")
    .select("id, case_id, doc_type, mime_type, original_name, size_bytes, uploaded_at")
    .eq("case_id", id)
    .order("uploaded_at", { ascending: true });

  return {
    ...toCase(row as CaseRow),
    documents: ((docs ?? []) as DocumentRow[]).map(toDocument),
  };
}
