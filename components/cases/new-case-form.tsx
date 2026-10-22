"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
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
    <div className="mb-8 rounded-[10px] border border-border-subtle bg-surface-card p-5 sm:p-6">
      <div className="mb-5 flex items-center gap-2.5 border-b border-border-subtle pb-4">
        <span className="material-symbols-outlined text-[18px] text-primary">add_circle</span>
        <div>
          <h2 className="font-headline text-lg text-text-headline">Verify a new offer</h2>
          <p className="text-xs text-text-metadata">Name the offer and choose where the student plans to study.</p>
        </div>
      </div>
      <form onSubmit={onSubmit} className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1.5">
          <label
            htmlFor="case-title"
            className="font-mono text-[11px] uppercase tracking-wider text-text-metadata"
          >
            Case title
          </label>
          <input
            id="case-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. MSc Data Science offer via consultant"
            maxLength={120}
            required
            className="h-11 w-full rounded border border-border-subtle bg-surface-canvas px-3 text-sm text-text-headline placeholder:text-text-metadata/60 transition-colors hover:border-border-prominent focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="space-y-1.5 sm:w-56">
          <label
            htmlFor="case-destination"
            className="font-mono text-[11px] uppercase tracking-wider text-text-metadata"
          >
            Destination
          </label>
          <select
            id="case-destination"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="h-11 w-full rounded border border-border-subtle bg-surface-canvas px-3 text-sm text-text-headline transition-colors hover:border-border-prominent focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {DESTINATION_COUNTRIES.map((code) => (
              <option key={code} value={code}>
                {DESTINATION_LABELS[code]}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={saving || title.trim().length === 0}
          className="h-11 shrink-0 rounded-full bg-primary px-5 text-xs font-semibold text-surface-canvas shadow-sm transition-colors hover:bg-verdict-pass disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Creating…" : "Create case"}
        </button>
      </form>
      {error ? (
        <p role="alert" className="mt-3 text-sm text-verdict-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
