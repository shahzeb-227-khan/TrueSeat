import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ResultsView } from "@/components/results/results-view";
import { createServerSupabase } from "@/lib/supabase/server";

export default async function RunResultsPage({ params }: { params: { id: string; runId: string } }) {
  const supabase = createServerSupabase();
  const userEmail = supabase ? (await supabase.auth.getUser()).data.user?.email ?? null : null;

  return (
    <AppShell userEmail={userEmail}>
      <Link
        href={`/cases/${params.id}`}
        className="mb-4 inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-wider text-text-metadata transition-colors hover:text-text-headline"
      >
        <span className="material-symbols-outlined text-[14px]">arrow_back</span>
        Back to case
      </Link>
      <ResultsView runId={params.runId} />
    </AppShell>
  );
}
