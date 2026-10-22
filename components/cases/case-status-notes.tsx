"use client";

import { useState } from "react";
import { CASE_STATUS_LABELS } from "@/lib/cases/labels";
import { CASE_STATUSES, MAX_NOTES_LENGTH, type CaseStatus } from "@/lib/schemas";

export function CaseStatusNotes({
  caseId,
  initialStatus,
  initialNotes,
}: {
  caseId: string;
  initialStatus: CaseStatus;
  initialNotes: string | null;
}) {
  const [status, setStatus] = useState<CaseStatus>(initialStatus);
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(patch: { status?: CaseStatus; notes?: string }) {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/cases/${caseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setError(body?.message ?? `Could not save (status ${res.status}).`);
        return;
      }
      setSaved(true);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-[10px] border border-border-subtle bg-surface-card p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <label htmlFor="case-status" className="font-mono text-[11px] uppercase tracking-wider text-text-metadata">
          Status
        </label>
        <select
          id="case-status"
          value={status}
          disabled={saving}
          onChange={(e) => {
            const next = e.target.value as CaseStatus;
            setStatus(next);
            save({ status: next });
          }}
          className="rounded border border-border-subtle bg-surface-canvas px-2.5 py-1.5 text-sm text-text-headline transition-colors hover:border-border-prominent focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {CASE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {CASE_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="case-notes" className="font-mono text-[11px] uppercase tracking-wider text-text-metadata">
          Notes
        </label>
        <textarea
          id="case-notes"
          value={notes}
          maxLength={MAX_NOTES_LENGTH}
          disabled={saving}
          onChange={(e) => {
            setNotes(e.target.value);
            setSaved(false);
          }}
          placeholder="e.g. Emailed the university on 22 Oct to confirm the offer letter."
          rows={3}
          className="w-full rounded border border-border-subtle bg-surface-canvas p-2.5 text-sm text-text-headline placeholder:text-text-metadata/60 transition-colors hover:border-border-prominent focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <div className="flex items-center justify-between">
          <p className="font-mono text-[11px] text-text-metadata">
            {notes.length}/{MAX_NOTES_LENGTH}
          </p>
          <button
            type="button"
            disabled={saving}
            onClick={() => save({ notes })}
            className="rounded border border-border-prominent bg-surface-card-elevated px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-text-headline transition-colors hover:border-primary/50 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save notes"}
          </button>
        </div>
      </div>

      {error ? (
        <p role="alert" className="mt-3 text-sm text-verdict-danger">
          {error}
        </p>
      ) : null}
      {saved && !error ? <p className="mt-3 text-xs text-primary">Saved.</p> : null}
    </section>
  );
}
