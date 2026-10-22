"use client";

import { useEffect, useState } from "react";
import { RUN_STAGES, VERDICT_LABELS, type RunResult, type RunStage, type Finding } from "@/lib/schemas";

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

const GROUP_ICON: Record<string, string> = {
  Institution: "account_balance",
  Sender: "alternate_email",
  Money: "payments",
  Consistency: "fact_check",
  "Warning signs": "flag",
};

const VERDICT_STYLE: Record<
  string,
  { border: string; iconBg: string; iconColor: string; icon: string; chip: string }
> = {
  high_risk: {
    border: "border-l-verdict-danger",
    iconBg: "bg-verdict-danger/15 border-verdict-danger/30",
    iconColor: "text-verdict-danger",
    icon: "gpp_bad",
    chip: "bg-verdict-danger/15 border-verdict-danger/30 text-[#FDA4AF]",
  },
  suspicious: {
    border: "border-l-verdict-warning",
    iconBg: "bg-verdict-warning/15 border-verdict-warning/30",
    iconColor: "text-verdict-warning",
    icon: "priority_high",
    chip: "bg-verdict-warning/10 border-verdict-warning/20 text-verdict-warning",
  },
  checks_passed: {
    border: "border-l-verdict-pass",
    iconBg: "bg-verdict-pass/15 border-verdict-pass/30",
    iconColor: "text-verdict-pass",
    icon: "check_circle",
    chip: "bg-verdict-pass/10 border-verdict-pass/20 text-verdict-pass",
  },
  could_not_verify: {
    border: "border-l-verdict-indeterminate border-dashed",
    iconBg: "bg-verdict-indeterminate/20 border-verdict-indeterminate/40",
    iconColor: "text-text-metadata",
    icon: "help",
    chip: "bg-verdict-indeterminate/20 border-verdict-indeterminate/40 text-text-headline",
  },
};

const SEVERITY_BORDER: Record<Finding["severity"], string> = {
  high: "border-l-verdict-danger",
  medium: "border-l-verdict-warning",
  info: "border-l-verdict-indeterminate",
};

const SEVERITY_LABEL: Record<Finding["severity"], string> = {
  high: "High",
  medium: "Medium",
  info: "Note",
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // clipboard may be unavailable; nothing to do
        }
      }}
      className="inline-flex items-center gap-1.5 rounded border border-border-subtle bg-surface-card-elevated px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-text-body transition-colors hover:border-border-prominent hover:text-text-headline"
    >
      <span className="material-symbols-outlined text-[14px]">{copied ? "done" : "content_copy"}</span>
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function StageLadder({ run }: { run: RunResult }) {
  const currentIndex = RUN_STAGES.indexOf(run.stage);
  return (
    <section className="rounded-[10px] border border-border-subtle bg-surface-card p-5 sm:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="font-mono text-[11px] uppercase tracking-widest text-text-metadata">
            Verification in progress
          </span>
          <h1 className="mt-1 font-headline text-2xl font-normal text-text-headline">
            Running checks on your documents
          </h1>
        </div>
        <span className="font-mono text-[11px] text-text-metadata">
          Stage {Math.max(currentIndex, 0) + 1} of {RUN_STAGES.length}
        </span>
      </div>

      <div className="mb-6 flex h-1.5 gap-0.5 overflow-hidden rounded-full bg-surface-card-elevated p-0.5">
        {RUN_STAGES.map((stage, i) => (
          <div
            key={stage}
            className={`h-full flex-1 rounded-sm ${
              i < currentIndex
                ? "bg-verdict-pass"
                : i === currentIndex
                  ? "animate-pulse bg-verdict-warning"
                  : "bg-surface-card-elevated"
            }`}
          />
        ))}
      </div>

      <ul className="flex flex-col gap-2.5">
        {RUN_STAGES.map((stage, i) => {
          const done = i < currentIndex;
          const active = i === currentIndex;
          return (
            <li
              key={stage}
              className={`flex items-center gap-3 rounded-lg border p-3.5 transition-all ${
                active
                  ? "border-verdict-warning/40 border-l-4 border-l-verdict-warning bg-surface-card-elevated"
                  : done
                    ? "border-border-subtle border-l-4 border-l-verdict-pass bg-surface-card"
                    : "border-border-subtle border-l-4 border-l-verdict-indeterminate bg-surface-card/60 opacity-80"
              }`}
            >
              <div
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded border text-[11px] font-mono ${
                  done
                    ? "border-verdict-pass/40 bg-verdict-pass/10 text-verdict-pass"
                    : active
                      ? "border-verdict-warning/40 bg-verdict-warning/10 text-verdict-warning"
                      : "border-border-prominent bg-surface-card-elevated text-text-metadata"
                }`}
              >
                {done || active ? (
                  <span className="material-symbols-outlined text-[14px]">{done ? "check" : "sync"}</span>
                ) : (
                  i + 1
                )}
              </div>
              <span className={active || done ? "text-sm text-text-headline" : "text-sm text-text-body"}>
                {STAGE_LABELS[stage]}
              </span>
              {active ? (
                <span className="ml-auto font-mono text-[11px] uppercase tracking-wider text-verdict-warning">
                  In progress
                </span>
              ) : done ? (
                <span className="ml-auto font-mono text-[11px] uppercase tracking-wider text-verdict-pass">Done</span>
              ) : (
                <span className="ml-auto font-mono text-[11px] uppercase tracking-wider text-text-metadata">
                  Queued
                </span>
              )}
            </li>
          );
        })}
      </ul>

      <p className="mt-6 border-t border-border-subtle pt-4 text-xs text-text-metadata">
        This page updates automatically. Do not send any money or share one-time codes while a check is still
        running.
      </p>
    </section>
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
    return <p className="text-sm text-verdict-danger">{error}</p>;
  }

  if (!run) {
    return <p className="text-sm text-text-metadata">Loading…</p>;
  }

  if (run.status === "running") {
    return <StageLadder run={run} />;
  }

  if (run.status === "failed") {
    return (
      <div className="rounded-[10px] border border-border-subtle border-l-4 border-l-verdict-danger bg-surface-card p-6">
        <h1 className="font-headline text-xl font-normal text-text-headline">Verification failed</h1>
        <p className="mt-2 text-sm text-verdict-danger">
          Something went wrong{run.errorCode ? ` (${run.errorCode})` : ""}. Please try running verification again.
        </p>
      </div>
    );
  }

  const verdict = run.verdict ?? "could_not_verify";
  const label = VERDICT_LABELS[verdict];
  const style = VERDICT_STYLE[verdict];
  const grouped: Record<string, Finding[]> = {};
  for (const f of run.findings) {
    if (f.severity === "info") continue;
    const group = FINDING_GROUP[f.code] ?? "Warning signs";
    grouped[group] = grouped[group] ?? [];
    grouped[group].push(f);
  }

  const draftByKind = Object.fromEntries(run.drafts.map((d) => [d.kind, d]));

  return (
    <div className="flex flex-col gap-8">
      {/* Verdict hero */}
      <section
        className={`relative overflow-hidden rounded-xl border border-border-subtle border-l-4 bg-surface-card p-6 shadow-2xl sm:p-8 ${style.border}`}
      >
        <div className="relative z-10 flex flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span
              className={`inline-flex items-center gap-2 rounded border px-3 py-1 font-mono text-[11px] uppercase tracking-widest ${style.chip}`}
            >
              <span className="material-symbols-outlined text-[16px]">{style.icon}</span>
              {label.emoji} {label.en}
            </span>
            {run.status === "partial" ? (
              <span className="font-mono text-xs text-verdict-warning">Some documents could not be fully processed.</span>
            ) : null}
          </div>

          <div className="flex items-start gap-4">
            <div className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded border ${style.iconBg}`}>
              <span className={`material-symbols-outlined text-[24px] ${style.iconColor}`}>{style.icon}</span>
            </div>
            <div>
              <h1 className="font-headline text-2xl font-normal leading-tight text-text-headline sm:text-3xl">
                {label.en}
              </h1>
              <p dir="rtl" className="mt-1.5 font-urdu text-base text-text-metadata">
                {label.ur}
              </p>
            </div>
          </div>

          {verdict === "checks_passed" ? (
            <p className="rounded bg-surface-canvas/60 p-3 text-sm text-text-body">
              This does not prove the offer is genuine — it means our checks found nothing wrong. Confirm it with the
              university directly using their official contact details before sending any money.
            </p>
          ) : null}
        </div>
      </section>

      {/* Findings */}
      {Object.keys(grouped).length > 0 ? (
        <section className="flex flex-col gap-4">
          <div>
            <span className="font-mono text-[11px] uppercase tracking-widest text-text-metadata">
              What we found
            </span>
            <h2 className="font-headline text-xl font-normal text-text-headline sm:text-2xl">Findings by category</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {Object.entries(grouped).map(([group, findings]) =>
              findings.map((f) => (
                <div
                  key={f.id ?? `${f.code}-${f.documentId}`}
                  className={`flex flex-col gap-3 rounded-lg border border-border-prominent border-l-2 bg-surface-card p-5 ${SEVERITY_BORDER[f.severity]}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-text-metadata">{group}</span>
                    <span className="rounded border border-border-subtle bg-surface-canvas px-2 py-0.5 font-mono text-[11px] text-text-metadata">
                      {SEVERITY_LABEL[f.severity]}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-text-headline">
                    <span className="material-symbols-outlined text-[18px] text-text-metadata">
                      {GROUP_ICON[group] ?? "flag"}
                    </span>
                    <h3 className="text-sm font-medium text-text-headline">{f.titleEn}</h3>
                  </div>
                  {f.quote ? (
                    <blockquote className="rounded border border-border-subtle bg-surface-canvas p-2.5 font-mono text-xs italic text-text-metadata">
                      &ldquo;{f.quote}&rdquo;
                    </blockquote>
                  ) : null}
                  <div className="flex items-center justify-between border-t border-border-subtle pt-2.5 font-mono text-[11px] text-text-metadata">
                    <span>{f.source === "code" ? "Confirmed by check" : "Flagged by AI"}</span>
                  </div>
                </div>
              )),
            )}
          </div>
        </section>
      ) : null}

      {/* Bilingual summary */}
      {draftByKind.summary_en || draftByKind.summary_ur ? (
        <section className="flex flex-col gap-4">
          <div>
            <span className="font-mono text-[11px] uppercase tracking-widest text-text-metadata">Explanation</span>
            <h2 className="font-headline text-xl font-normal text-text-headline sm:text-2xl">
              Plain-language summary
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {draftByKind.summary_en ? (
              <div className="flex flex-col gap-4 rounded-lg border border-border-subtle bg-surface-card p-6">
                <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-text-metadata">
                    EN
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-body">
                  {draftByKind.summary_en.content}
                </p>
                <div className="flex justify-end border-t border-border-subtle pt-3">
                  <CopyButton text={draftByKind.summary_en.content} />
                </div>
              </div>
            ) : null}
            {draftByKind.summary_ur ? (
              <div
                className="flex flex-col gap-4 rounded-lg border border-border-subtle bg-surface-card p-6 text-right"
                dir="rtl"
              >
                <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-text-metadata">
                    UR
                  </span>
                </div>
                <p className="whitespace-pre-wrap font-urdu text-base leading-loose text-text-body">
                  {draftByKind.summary_ur.content}
                </p>
                <div className="flex justify-start border-t border-border-subtle pt-3">
                  <CopyButton text={draftByKind.summary_ur.content} />
                </div>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* Drafts */}
      {draftByKind.verification_email || draftByKind.complaint ? (
        <section className="flex flex-col gap-4">
          <div>
            <span className="font-mono text-[11px] uppercase tracking-widest text-text-metadata">
              Suggested next steps
            </span>
            <h2 className="font-headline text-xl font-normal text-text-headline sm:text-2xl">Ready-to-send drafts</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {draftByKind.verification_email ? (
              <div className="flex flex-col gap-3 rounded-lg border border-border-subtle bg-surface-card p-6">
                <div className="flex items-center gap-2 text-text-headline">
                  <span className="material-symbols-outlined text-[18px] text-primary">outgoing_mail</span>
                  <h3 className="text-sm font-medium text-text-headline">Verification email (draft)</h3>
                </div>
                <div className="max-h-56 overflow-y-auto whitespace-pre-wrap rounded border border-border-subtle bg-surface-canvas p-3 font-mono text-[12px] leading-relaxed text-text-body">
                  {draftByKind.verification_email.content}
                </div>
                <div className="flex justify-end">
                  <CopyButton text={draftByKind.verification_email.content} />
                </div>
              </div>
            ) : null}
            {draftByKind.complaint ? (
              <div className="flex flex-col gap-3 rounded-lg border border-border-subtle bg-surface-card p-6">
                <div className="flex items-center gap-2 text-text-headline">
                  <span className="material-symbols-outlined text-[18px] text-verdict-danger">policy</span>
                  <h3 className="text-sm font-medium text-text-headline">FIA complaint (draft)</h3>
                </div>
                <div className="max-h-56 overflow-y-auto whitespace-pre-wrap rounded border border-border-subtle bg-surface-canvas p-3 font-mono text-[12px] leading-relaxed text-text-body">
                  {draftByKind.complaint.content}
                </div>
                <div className="flex justify-end">
                  <CopyButton text={draftByKind.complaint.content} />
                </div>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* How this was checked */}
      <footer className="flex items-start gap-4 rounded-lg border border-border-subtle bg-surface-card p-6">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded border border-border-prominent bg-surface-canvas">
          <span className="material-symbols-outlined text-[18px] text-primary">policy</span>
        </div>
        <div>
          <h4 className="font-mono text-xs font-semibold uppercase tracking-wider text-text-headline">
            How this was checked
          </h4>
          <p className="mt-1 text-xs leading-relaxed text-text-metadata">
            The verdict above is computed by TrueSeat&apos;s own rules from the registry, domain, payment and
            cross-document checks. AI only reads the documents and explains the findings — it never decides the
            verdict. TrueSeat is not affiliated with any government body, embassy or university.
          </p>
        </div>
      </footer>
    </div>
  );
}
