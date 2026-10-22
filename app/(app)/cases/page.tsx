import { SignOutButton } from "@/components/sign-out-button";
import { NewCaseForm } from "@/components/cases/new-case-form";
import { CaseList } from "@/components/cases/case-list";
import { Logo } from "@/components/brand/logo";

export default function CasesPage() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <header className="mb-6 flex items-center justify-between">
        <Logo markClassName="h-7 w-7" />
        <SignOutButton />
      </header>
      <h1 className="mb-4 text-2xl font-semibold">Cases</h1>
      <NewCaseForm />
      <CaseList />
    </main>
  );
}
