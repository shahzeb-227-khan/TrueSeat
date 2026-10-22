"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RUN_STAGES, VERDICT_LABELS, type RunResult, type RunStage } from "@/lib/schemas";

const STAGE_LABELS: Record<RunStage, string> = {
  extract_document: "Reading documents",
  lookup_institution: "Checking official register",
  check_domains: "Checking sender domains",
  check_payment: "Checking payment details",
  cross_check_case: "Cross-checking documents",
  scan_red_flags: "Scanning for warning signs",
  compose_verdict: "Working out the verdict",
  explain_and_draft: "Writing the explanation",
};

const FINDING_GROUP: Record<string, string> = {
  REGISTRY_LISTED: "Institution",
  REGISTRY_NOT_FOUND: "Institution",
  REGISTRY_AMBIGUOUS: "Institution",
  FREE_EMAIL_SENDER: "Sender",
  LOOKALIKE_DOMAIN: "Sender",
  CASH_PAYMENT: "Money",
  PERSONAL_OR_WALLET_PAYMENT: "Money",
  AMOUNT_MISMATCH: "Consistency",
  NAME_MISMATCH: "Consistency",
  DATE_INCONSISTENCY: "Consistency",
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="outline"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // clipboard may be unavailable; nothing to do
        }
      }}
    >
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

export function ResultsView({ runId }: { runId: string }) {
  const [run, setRun] = useState<RunResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function poll() {
      try {
        const res = await fetch(`/api/runs/${runId}`);
        const body = await res.json().catch(() => null);
        if (!res.ok || !body?.run) {
          if (!cancelled) setError(body?.message ?? "Could not load this verification run.");
          return;
        }
        if (cancelled) return;
        setRun(body.run as RunResult);
        if (body.run.status === "running") {
          timer = setTimeout(poll, 1500);
        }
      } catch {
        if (!cancelled) setError("Could not reach the server.");
      }
    }
    poll();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [runId]);

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (!run) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  if (run.status === "running") {
    const currentIndex = RUN_STAGES.indexOf(run.stage);
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Verification in progress</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {RUN_STAGES.map((stage, i) => (
              <li key={stage} className="flex items-center gap-2">
                <span>{i < currentIndex ? "✅" : i === currentIndex ? "⏳" : "○"}</span>
                <span className={i === currentIndex ? "font-medium" : "text-muted-foreground"}>
                  {STAGE_LABELS[stage]}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    );
  }

  if (run.status === "failed") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Verification failed</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">
            Something went wrong{run.errorCode ? ` (${run.errorCode})` : ""}. Please try running verification again.
          </p>
        </CardContent>
      </Card>
    );
  }

  const verdict = run.verdict ?? "could_not_verify";
  const label = VERDICT_LABELS[verdict];
  const grouped: Record<string, typeof run.findings> = {};
  for (const f of run.findings) {
    if (f.severity === "info") continue;
    const group = FINDING_GROUP[f.code] ?? "Warning signs";
    grouped[group] = grouped[group] ?? [];
    grouped[group].push(f);
  }

  const draftByKind = Object.fromEntries(run.drafts.map((d) => [d.kind, d]));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">
            {label.emoji} {label.en}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <p className="text-sm">{label.ur}</p>
          {verdict === "checks_passed" ? (
            <p className="text-sm text-muted-foreground">
              This does not prove the offer is genuine. Confirm it with the university using the official contact
              below.
            </p>
          ) : null}
          {run.status === "partial" ? (
            <p className="text-sm text-amber-600">Some documents could not be fully processed.</p>
          ) : null}
        </CardContent>
      </Card>

      {Object.keys(grouped).length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Findings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(grouped).map(([group, findings]) => (
              <div key={group}>
                <h3 className="text-sm font-semibold">{group}</h3>
                <ul className="mt-1 space-y-2">
                  {findings.map((f) => (
                    <li key={f.id ?? `${f.code}-${f.documentId}`} className="rounded border p-2 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span>{f.titleEn}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {f.source === "code" ? "Confirmed by check" : "Flagged by AI"}
                        </span>
                      </div>
                      {f.quote ? (
                        <blockquote className="mt-1 border-l-2 pl-2 text-xs italic text-muted-foreground">
                          &ldquo;{f.quote}&rdquo;
                        </blockquote>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {draftByKind.summary_en || draftByKind.summary_ur ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Explanation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {draftByKind.summary_en ? (
              <div className="flex items-start justify-between gap-2">
                <p className="whitespace-pre-wrap text-sm">{draftByKind.summary_en.content}</p>
                <CopyButton text={draftByKind.summary_en.content} />
              </div>
            ) : null}
            {draftByKind.summary_ur ? (
              <div className="flex items-start justify-between gap-2">
                <p dir="rtl" className="whitespace-pre-wrap text-sm">
                  {draftByKind.summary_ur.content}
                </p>
                <CopyButton text={draftByKind.summary_ur.content} />
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {draftByKind.verification_email ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Verification email (draft)</CardTitle>
          </CardHeader>
          <CardContent className="flex items-start justify-between gap-2">
            <p className="whitespace-pre-wrap text-sm">{draftByKind.verification_email.content}</p>
            <CopyButton text={draftByKind.verification_email.content} />
          </CardContent>
        </Card>
      ) : null}

      {draftByKind.complaint ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">FIA complaint (draft)</CardTitle>
          </CardHeader>
          <CardContent className="flex items-start justify-between gap-2">
            <p className="whitespace-pre-wrap text-sm">{draftByKind.complaint.content}</p>
            <CopyButton text={draftByKind.complaint.content} />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">How this was checked</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            The verdict above is computed by TrueSeat&apos;s own rules from the registry, domain, payment and
            cross-document checks. AI only reads the documents and explains the findings -- it never decides the
            verdict. TrueSeat is not affiliated with any government body, embassy or university.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
