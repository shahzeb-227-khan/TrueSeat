"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DESTINATION_LABELS } from "@/lib/cases/labels";
import { readJson } from "@/lib/cases/api";
import { VERDICT_LABELS, type Case } from "@/lib/schemas";

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
    return <p role="alert" className="text-sm text-red-600">{error}</p>;
  }
  if (cases === null) {
    return <p className="text-sm text-muted-foreground">Loading cases…</p>;
  }
  if (cases.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No cases yet</CardTitle>
          <CardDescription>Your verification cases will appear here.</CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    );
  }

  return (
    <ul className="space-y-3">
      {cases.map((c) => {
        const verdictLabel = c.latestVerdict ? VERDICT_LABELS[c.latestVerdict] : null;
        return (
          <li key={c.id} className="relative rounded-lg border hover:bg-secondary">
            <Link href={`/cases/${c.id}`} className="block p-4 pr-20">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{c.title}</p>
                {verdictLabel ? (
                  <span className="shrink-0 text-sm">
                    {verdictLabel.emoji} {verdictLabel.en}
                  </span>
                ) : null}
              </div>
              <p className="text-sm text-muted-foreground">
                {DESTINATION_LABELS[c.destinationCountry]} · {new Date(c.createdAt).toLocaleDateString()}
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
                    className="text-xs text-muted-foreground underline underline-offset-2"
                  >
                    Cancel
                  </button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={deletingId === c.id}
                    onClick={(e) => {
                      e.preventDefault();
                      deleteCase(c.id);
                    }}
                    className="h-7 border-destructive px-2 text-xs text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  >
                    {deletingId === c.id ? "Deleting…" : "Confirm"}
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  aria-label={`Delete case ${c.title}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setConfirmId(c.id);
                  }}
                  className="rounded px-2 py-1 text-xs text-muted-foreground underline underline-offset-2 hover:text-destructive"
                >
                  Delete
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
