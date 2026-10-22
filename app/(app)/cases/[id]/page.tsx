import Link from "next/link";
import { notFound } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";
import { CaseDocuments } from "@/components/cases/case-documents";
import { UploadLetterForm } from "@/components/cases/upload-letter-form";
import { RunVerificationButton } from "@/components/cases/run-verification-button";
import { CaseStatusNotes } from "@/components/cases/case-status-notes";
import { DESTINATION_LABELS, CASE_STATUS_LABELS } from "@/lib/cases/labels";
import { getCaseWithDocuments } from "@/lib/cases/load";
import { VERDICT_LABELS } from "@/lib/schemas";

export default async function CaseDetailPage({ params }: { params: { id: string } }) {
  const found = await getCaseWithDocuments(params.id);
  if (found === "not_found") notFound();
  if (found === "unavailable") {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <p className="text-sm text-red-600">Supabase is not configured yet.</p>
      </main>
    );
  }

  const { documents, ...c } = found;
  const verdictLabel = c.latestVerdict ? VERDICT_LABELS[c.latestVerdict] : null;

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <header className="flex items-center justify-between">
        <Link href="/cases" className="text-sm text-muted-foreground underline">
          ← All cases
        </Link>
        <SignOutButton />
      </header>
      <section>
        <h1 className="text-2xl font-semibold">{c.title}</h1>
        <p className="text-sm text-muted-foreground">
          {DESTINATION_LABELS[c.destinationCountry]} · Status: {CASE_STATUS_LABELS[c.status]}
          {verdictLabel ? ` · ${verdictLabel.emoji} ${verdictLabel.en}` : ""}
        </p>
      </section>
      <CaseStatusNotes caseId={c.id} initialStatus={c.status} initialNotes={c.notes} />
      <CaseDocuments documents={documents} />
      <UploadLetterForm caseId={c.id} hasDocument={documents.length > 0} />
      {documents.length > 0 ? <RunVerificationButton caseId={c.id} /> : null}
    </main>
  );
}
