import { SignOutButton } from "@/components/sign-out-button";
import { NewCaseForm } from "@/components/cases/new-case-form";
import { CaseList } from "@/components/cases/case-list";

export default function CasesPage() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Cases</h1>
        <SignOutButton />
      </header>
      <NewCaseForm />
      <CaseList />
    </main>
  );
}
