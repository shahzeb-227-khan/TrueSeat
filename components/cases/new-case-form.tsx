"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DESTINATION_LABELS } from "@/lib/cases/labels";
import { readJson } from "@/lib/cases/api";
import { DESTINATION_COUNTRIES, type Case } from "@/lib/schemas";

export function NewCaseForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState<string>("GB");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const res = await fetch("/api/cases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, destinationCountry: destination }),
    });
    const result = await readJson<{ case: Case }>(res);
    setSaving(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.push(`/cases/${result.data.case.id}`);
    router.refresh();
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">New case</CardTitle>
        <CardDescription>Name the offer and choose where the student plans to study.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="case-title" className="text-sm font-medium">
              Case title
            </label>
            <Input
              id="case-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. MSc Data Science offer via consultant"
              maxLength={120}
              required
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="case-destination" className="text-sm font-medium">
              Destination country
            </label>
            <select
              id="case-destination"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {DESTINATION_COUNTRIES.map((code) => (
                <option key={code} value={code}>
                  {DESTINATION_LABELS[code]}
                </option>
              ))}
            </select>
          </div>
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
          <Button type="submit" disabled={saving || title.trim().length === 0}>
            {saving ? "Creating…" : "Create case"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
