"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
    <section className="space-y-3 rounded-lg border p-4">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor="case-status" className="text-sm font-medium">
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
          className="rounded-md border bg-background px-2 py-1 text-sm"
        >
          {CASE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {CASE_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor="case-notes" className="text-sm font-medium">
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
          className="w-full rounded-md border bg-background p-2 text-sm"
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {notes.length}/{MAX_NOTES_LENGTH}
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={saving}
            onClick={() => save({ notes })}
          >
            {saving ? "Saving…" : "Save notes"}
          </Button>
        </div>
      </div>

      {error ? <p role="alert" className="text-sm text-red-600">{error}</p> : null}
      {saved && !error ? <p className="text-xs text-emerald-600">Saved.</p> : null}
    </section>
  );
}
