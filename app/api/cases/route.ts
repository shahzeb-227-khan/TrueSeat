import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { toCase, type CaseRow } from "@/lib/cases/map";
import { CaseCreateSchema } from "@/lib/schemas";

// GET /api/cases: list the signed-in user's cases (RLS limits rows to own cases).
export async function GET() {
  const supabase = createServerSupabase();
  if (!supabase) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("cases")
    .select("id, title, destination_country, status, created_at, updated_at")
    .order("updated_at", { ascending: false });
  if (error) return NextResponse.json({ error: "db_error" }, { status: 500 });

  return NextResponse.json({ cases: (data as CaseRow[]).map(toCase) });
}

// POST /api/cases: create a case owned by the signed-in user.
export async function POST(request: Request) {
  const supabase = createServerSupabase();
  if (!supabase) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = CaseCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", message: parsed.error.issues[0]?.message },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("cases")
    .insert({
      user_id: auth.user.id,
      title: parsed.data.title,
      destination_country: parsed.data.destinationCountry,
    })
    .select("id, title, destination_country, status, created_at, updated_at")
    .single();
  if (error || !data) return NextResponse.json({ error: "db_error" }, { status: 500 });

  return NextResponse.json({ case: toCase(data as CaseRow) }, { status: 201 });
}
