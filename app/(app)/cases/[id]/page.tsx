import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { CaseDocuments } from "@/components/cases/case-documents";
import { UploadLetterForm } from "@/components/cases/upload-letter-form";
import { RunVerificationButton } from "@/components/cases/run-verification-button";
import { CaseStatusNotes } from "@/components/cases/case-status-notes";
import { DESTINATION_LABELS, CASE_STATUS_LABELS } from "@/lib/cases/labels";
import { getCaseWithDocuments } from "@/lib/cases/load";
import { createServerSupabase } from "@/lib/supabase/server";
import { VERDICT_LABELS } from "@/lib/schemas";

export default async function CaseDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabase();
  const userEmail = supabase ? (await supabase.auth.getUser()).data.user?.email ?? null : null;

  const found = await getCaseWithDocuments(params.id);
  if (found === "not_found") notFound();
  if (found === "unavailable") {
    return (
      <AppShell userEmail={userEmail}>
        <p className="text-sm text-verdict-danger">Supabase is not configured yet.</p>
      </AppShell>
    );
  }

  const { documents, ...c } = found;
  const verdictLabel = c.latestVerdict ? VERDICT_LABELS[c.latestVerdict] : null;

  return (
    <AppShell userEmail={userEmail}>
      <Link
        href="/cases"
        className="mb-4 inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-wider text-text-metadata transition-colors hover:text-text-headline"
      >
        <span className="material-symbols-outlined text-[14px]">arrow_back</span>
        All cases
      </Link>

      <div className="mb-6">
        <h1 className="font-headline text-3xl font-normal text-text-headline">{c.title}</h1>
        <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-text-metadata">
          {DESTINATION_LABELS[c.destinationCountry]} · {CASE_STATUS_LABELS[c.status]}
          {verdictLabel ? (
            <>
              {" "}
              · <span className="text-text-body">{verdictLabel.emoji} {verdictLabel.en}</span>
            </>
          ) : null}
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <CaseStatusNotes caseId={c.id} initialStatus={c.status} initialNotes={c.notes} />
        <CaseDocuments documents={documents} />
        <UploadLetterForm caseId={c.id} hasDocument={documents.length > 0} />
        {documents.length > 0 ? <RunVerificationButton caseId={c.id} /> : null}
      </div>
    </AppShell>
  );
}
