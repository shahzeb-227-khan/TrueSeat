import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

// Keep-alive target for the daily GitHub Action (.github/workflows/keepalive.yml).
// SPEC §12: "Daily scheduled GitHub Action hitting /api/health, which runs one
// database query" — Supabase free-tier projects pause after a week with no
// API activity, which would take the live demo URL down before judging.
//
// This has no signed-in user (it's hit by a cron job, not a browser session),
// so it can't use the cookie-bound server client. It uses the anon key
// directly — even a request that reference-table RLS denies still reaches
// Postgres and counts as project activity, which is all this route needs to
// guarantee; it does not depend on any table being anon-readable.
export async function GET() {
  const env = getSupabaseEnv();
  if (!env) {
    return NextResponse.json({ ok: true, db: "not_configured" });
  }

  try {
    const supabase = createClient(env.url, env.anonKey, {
      auth: { persistSession: false },
    });
    const { error } = await supabase
      .from("registry_snapshots")
      .select("id", { head: true, count: "exact" });

    // A permission-denied/RLS error still means the query reached the
    // database — that's a reachable project either way.
    return NextResponse.json({
      ok: true,
      db: "reachable",
      queryError: error ? error.code ?? "denied" : null,
      checkedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { ok: false, db: "unreachable", checkedAt: new Date().toISOString() },
      { status: 503 }
    );
  }
}
