import { AppShell } from "@/components/app-shell";
import { NewCaseForm } from "@/components/cases/new-case-form";
import { CaseList } from "@/components/cases/case-list";
import { createServerSupabase } from "@/lib/supabase/server";

export default async function CasesPage() {
  const supabase = createServerSupabase();
  const userEmail = supabase ? (await supabase.auth.getUser()).data.user?.email ?? null : null;

  return (
    <AppShell userEmail={userEmail}>
      <div className="mb-8">
        <h1 className="font-headline text-3xl font-normal text-text-headline">My cases</h1>
        <p className="mt-1 text-sm text-text-metadata">
          Create a case for each offer you want to check, then upload its documents.
        </p>
      </div>
      <NewCaseForm />
      <CaseList />
    </AppShell>
  );
}
