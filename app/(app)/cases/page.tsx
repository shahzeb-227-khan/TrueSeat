import { SignOutButton } from "@/components/sign-out-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function CasesPage() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Cases</h1>
        <SignOutButton />
      </header>
      <Card>
        <CardHeader>
          <CardTitle>No cases yet</CardTitle>
          <CardDescription>Your verification cases will appear here.</CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    </main>
  );
}
