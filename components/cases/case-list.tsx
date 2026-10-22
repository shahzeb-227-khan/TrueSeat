"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DESTINATION_LABELS, CASE_STATUS_LABELS } from "@/lib/cases/labels";
import { readJson } from "@/lib/cases/api";
import { VERDICT_LABELS, type Case, type Verdict } from "@/lib/schemas";

const VERDICT_BORDER: Record<Verdict, string> = {
  checks_passed: "border-l-verdict-pass",
  suspicious: "border-l-verdict-warning",
  high_risk: "border-l-verdict-danger",
  could_not_verify: "border-l-verdict-indeterminate border-dashed",
};

export function CaseList() {
  const [cases, setCases] = useState<Case[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function deleteCase(id: string) {
    setDeletingId(id);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/cases/${id}`, { method: "DELETE" });
      const body = await res.json().catch(() => null);
      setDeletingId(null);
      if (!res.ok) {
        setDeleteError(body?.message ?? `Could not delete (status ${res.status}).`);
        return;
      }
      setConfirmId(null);
      setCases((prev) => (prev ? prev.filter((c) => c.id !== id) : prev));
    } catch {
      setDeletingId(null);
      setDeleteError("Could not reach the server.");
    }
  }

  useEffect(() => {
    let active = true;
    fetch("/api/cases")
      .then((res) => readJson<{ cases: Case[] }>(res))
      .then((result) => {
        if (!active) return;
        if (result.ok) setCases(result.data.cases);
        else setError(result.message);
      });
    return () => {
      active = false;
    };
  }, []);

  if (error) {
    return (
      <p role="alert" className="text-sm text-verdict-danger">
        {error}
      </p>
    );
  }
  if (cases === null) {
    return <p className="text-sm text-text-metadata">Loading cases…</p>;
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-headline text-lg text-text-headline">My cases</h2>
        <span className="font-mono text-[11px] uppercase tracking-wider text-text-metadata">
          {cases.length} total
        </span>
      </div>

      {deleteError ? (
        <p role="alert" className="mb-3 text-sm text-verdict-danger">
          {deleteError}
        </p>
      ) : null}

      {cases.length === 0 ? (
        <div className="rounded-[10px] border border-dashed border-border-subtle bg-surface-card p-8 text-center">
          <p className="font-headline text-lg text-text-headline">No cases yet</p>
          <p className="mt-1 text-sm text-text-metadata">Your verification cases will appear here.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {cases.map((c) => {
            const verdictLabel = c.latestVerdict ? VERDICT_LABELS[c.latestVerdict] : null;
            const borderClass = c.latestVerdict ? VERDICT_BORDER[c.latestVerdict] : "border-l-border-subtle";
            return (
              <li
                key={c.id}
                className={`relative rounded-[10px] border border-border-subtle border-l-[3px] bg-surface-card transition-colors hover:bg-surface-card-elevated ${borderClass}`}
              >
                <Link href={`/cases/${c.id}`} className="block p-4 pr-24">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-headline text-base text-text-headline">{c.title}</p>
                    {verdictLabel ? (
                      <span className="shrink-0 text-sm text-text-body">
                        {verdictLabel.emoji} {verdictLabel.en}
                      </span>
                    ) : (
                      <span className="shrink-0 rounded bg-surface-card-elevated px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-text-metadata">
                        Not yet checked
                      </span>
                    )}
                  </div>
                  <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-text-metadata">
                    {DESTINATION_LABELS[c.destinationCountry]} · {CASE_STATUS_LABELS[c.status]} ·{" "}
                    {new Date(c.createdAt).toLocaleDateString()}
                  </p>
                </Link>
                <div className="absolute right-3 top-3">
                  {confirmId === c.id ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setConfirmId(null);
                        }}
                        className="font-mono text-[11px] uppercase tracking-wider text-text-metadata hover:text-text-headline"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={deletingId === c.id}
                        onClick={(e) => {
                          e.preventDefault();
                          deleteCase(c.id);
                        }}
                        className="rounded border border-verdict-danger bg-surface-card-elevated px-2 py-1 font-mono text-[11px] uppercase tracking-wider text-verdict-danger transition-colors hover:bg-verdict-danger hover:text-text-headline disabled:opacity-50"
                      >
                        {deletingId === c.id ? "Deleting…" : "Confirm"}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      aria-label={`Delete case ${c.title}`}
                      onClick={(e) => {
                        e.preventDefault();
                        setConfirmId(c.id);
                      }}
                      className="rounded px-2 py-1 font-mono text-[11px] uppercase tracking-wider text-text-metadata transition-colors hover:text-verdict-danger"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
