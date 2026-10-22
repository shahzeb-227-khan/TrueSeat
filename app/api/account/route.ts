import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

const BUCKET = "evidence";

// DELETE /api/account: account-deletion request. Removes every case, document
// row and stored file owned by the signed-in user (cascades via the existing
// `cases` FK: documents, case_runs, extractions, findings, drafts, ai_runs
// all delete automatically). Uses the user's own access token, never the
// service-role key, so RLS covers this route like every other.
// The auth.users row itself is not removed here (that needs the service-role
// key, out of scope for app code); the team completes that from the request.
export async function DELETE() {
  const supabase = createServerSupabase();
  if (!supabase) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // Best-effort: remove stored files first, while the document rows (and
  // their storage_path) still exist to look up.
  const { data: docs } = await supabase
    .from("documents")
    .select("storage_path")
    .eq("user_id", auth.user.id);
  const paths = (docs ?? []).map((d) => d.storage_path as string);
  if (paths.length > 0) {
    await supabase.storage.from(BUCKET).remove(paths);
  }

  // Deleting the user's cases cascades to documents, case_runs, extractions,
  // findings, drafts and ai_runs (all FK on delete cascade).
  const { error } = await supabase.from("cases").delete().eq("user_id", auth.user.id);
  if (error) {
    return NextResponse.json(
      { error: "db_error", message: `Could not delete your data: ${error.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ deleted: true }, { status: 200 });
}
