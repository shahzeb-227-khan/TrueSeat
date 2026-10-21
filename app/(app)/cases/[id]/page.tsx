import Link from "next/link";
import { notFound } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";
import { CaseDocuments } from "@/components/cases/case-documents";
import { UploadLetterForm } from "@/components/cases/upload-letter-form";
import { DESTINATION_LABELS } from "@/lib/cases/labels";
import { getCaseWithDocuments } from "@/lib/cases/load";

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

  const { case: c, documents } = found;
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
          {DESTINATION_LABELS[c.destinationCountry]} · Status: open
        </p>
      </section>
      <CaseDocuments documents={documents} />
      <UploadLetterForm caseId={c.id} hasDocument={documents.length > 0} />
    </main>
  );
}
