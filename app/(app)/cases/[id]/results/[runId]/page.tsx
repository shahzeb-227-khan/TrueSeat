import Link from "next/link";
import { ResultsView } from "@/components/results/results-view";

export default function RunResultsPage({ params }: { params: { id: string; runId: string } }) {
  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <Link href={`/cases/${params.id}`} className="text-sm text-muted-foreground underline">
        ← Back to case
      </Link>
      <ResultsView runId={params.runId} />
    </main>
  );
}
