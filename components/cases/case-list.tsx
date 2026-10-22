"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DESTINATION_LABELS } from "@/lib/cases/labels";
import { readJson } from "@/lib/cases/api";
import { VERDICT_LABELS, type Case } from "@/lib/schemas";

export function CaseList() {
  const [cases, setCases] = useState<Case[] | null>(null);
  const [error, setError] = useState<string | null>(null);

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
          <li key={c.id}>
            <Link
              href={`/cases/${c.id}`}
              className="block rounded-lg border p-4 hover:bg-secondary"
            >
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
          </li>
        );
      })}
    </ul>
  );
}
