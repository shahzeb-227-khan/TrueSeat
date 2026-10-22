import type { SupabaseClient } from "@supabase/supabase-js";
import {
  CONFIDENCE_THRESHOLD,
  type DestinationCountry,
  type Finding,
  type RunStage,
} from "@/lib/schemas";

// Server-only view of a document: includes storage_path, which is never
// exposed to the browser (see lib/cases/map.ts, which deliberately omits it
// from the client-facing CaseDocument type).
export type PipelineDocument = { id: string; mimeType: string; storagePath: string };

import { extractDocument } from "@/lib/ai/extract";
import { scanRedFlags } from "@/lib/ai/scanRedFlags";
import { explainAndDraft, type OfficialContact } from "@/lib/ai/explainAndDraft";
import { lookupInstitution, officialDomainsFor, slugFor } from "@/lib/checks/registryLookup";
import { checkAllDomains } from "@/lib/checks/domainCheck";
import { checkPayment } from "@/lib/checks/paymentCheck";
import { crossCheckCase, type CrossCheckDoc } from "@/lib/checks/crossCheck";
import { checkDateSanity } from "@/lib/checks/dateSanity";
import { composeVerdict } from "@/lib/verdict";

const BUCKET = "evidence";

type ExtractionRecord = {
  documentId: string;
  mimeType: string;
  rawText: string;
  fields: import("@/lib/schemas").ExtractionFields;
};

async function updateStage(supabase: SupabaseClient, runId: string, stage: RunStage) {
  await supabase.from("case_runs").update({ stage }).eq("id", runId);
}

async function logAiRun(
  supabase: SupabaseClient,
  runId: string,
  stage: string,
  outcome: { ok: boolean; provider?: string; model?: string | null; inputTokens?: number | null; outputTokens?: number | null; latencyMs: number; errorCode?: string }
) {
  await supabase.from("ai_runs").insert({
    case_run_id: runId,
    stage,
    provider: outcome.provider ?? "none",
    model: outcome.model ?? null,
    latency_ms: outcome.latencyMs,
    input_tokens: outcome.inputTokens ?? null,
    output_tokens: outcome.outputTokens ?? null,
    ok: outcome.ok,
    error_code: outcome.errorCode ?? null,
  });
}

async function downloadAsBase64(supabase: SupabaseClient, path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from(BUCKET).download(path);
  if (error || !data) return null;
  const buffer = Buffer.from(await data.arrayBuffer());
  return buffer.toString("base64");
}

export type PipelineResult = {
  status: "completed" | "partial" | "failed";
  verdict: import("@/lib/schemas").Verdict | null;
  errorCode: string | null;
};

/**
 * Runs the full 8-stage verification pipeline for one case and persists the
 * result (case_runs, extractions, findings, drafts, ai_runs). Each stage's
 * output is written before the next stage starts, so a crash leaves a
 * readable partial run rather than losing work.
 */
export async function runPipeline(
  supabase: SupabaseClient,
  runId: string,
  caseId: string,
  destinationCountry: DestinationCountry,
  documents: PipelineDocument[]
): Promise<PipelineResult> {
  if (documents.length === 0) {
    await supabase
      .from("case_runs")
      .update({ status: "failed", error_code: "no_documents", finished_at: new Date().toISOString() })
      .eq("id", runId);
    return { status: "failed", verdict: null, errorCode: "no_documents" };
  }

  let aiAvailable = false;

  // --- Stage 1: extract_document --------------------------------------
  await updateStage(supabase, runId, "extract_document");
  const extractions: ExtractionRecord[] = [];

  for (const doc of documents) {
    const base64 = await downloadAsBase64(supabase, doc.storagePath);
    if (base64 === null) continue;

    const input =
      doc.mimeType === "text/plain"
        ? ({ kind: "text", text: Buffer.from(base64, "base64").toString("utf8") } as const)
        : ({ kind: "file", mimeType: doc.mimeType, base64 } as const);

    const outcome = await extractDocument(input);
    await logAiRun(supabase, runId, "extract_document", {
      ok: outcome.ok,
      provider: outcome.ok ? outcome.provider : undefined,
      model: outcome.ok ? outcome.model : undefined,
      inputTokens: outcome.ok ? outcome.inputTokens : undefined,
      outputTokens: outcome.ok ? outcome.outputTokens : undefined,
      latencyMs: outcome.latencyMs,
      errorCode: outcome.ok ? undefined : outcome.errorCode,
    });

    if (!outcome.ok) continue;
    aiAvailable = true;

    await supabase.from("extractions").insert({
      document_id: doc.id,
      fields: outcome.data.fields,
      raw_text: outcome.data.rawText,
      model: outcome.model,
      prompt_version: outcome.promptVersion,
    });

    extractions.push({
      documentId: doc.id,
      mimeType: doc.mimeType,
      rawText: outcome.data.rawText,
      fields: outcome.data.fields,
    });
  }

  const findings: Finding[] = [];
  const essentialFieldsReadable = extractions.some(
    (e) => e.fields.institutionName.value !== null && e.fields.institutionName.confidence >= CONFIDENCE_THRESHOLD
  );

  // --- Stage 2: lookup_institution -------------------------------------
  await updateStage(supabase, runId, "lookup_institution");
  const bestInstitutionGuess = extractions
    .map((e) => e.fields.institutionName)
    .filter((f) => f.value !== null)
    .sort((a, b) => b.confidence - a.confidence)[0];

  const registry = bestInstitutionGuess?.value
    ? await lookupInstitution(supabase, bestInstitutionGuess.value, destinationCountry)
    : { result: "not_found" as const, matched: null, candidates: [], snapshotId: null };

  if (registry.result === "listed" && registry.matched) {
    findings.push({
      source: "code",
      code: "REGISTRY_LISTED",
      severity: "info",
      documentId: null,
      quote: null,
      titleEn: `${registry.matched.name} is on the official register (${registry.matched.registryStatus ?? "listed"}).`,
      details: { registryId: registry.matched.registryId },
    });
  } else if (registry.result === "not_found") {
    findings.push({
      source: "code",
      code: "REGISTRY_NOT_FOUND",
      severity: "info",
      documentId: null,
      quote: null,
      titleEn: "This institution was not found in our seeded registry subset.",
      details: {},
    });
  } else if (registry.result === "ambiguous") {
    findings.push({
      source: "code",
      code: "REGISTRY_AMBIGUOUS",
      severity: "info",
      documentId: null,
      quote: null,
      titleEn: "Several institutions matched closely; could not confirm a single one.",
      details: { candidates: registry.candidates.map((c) => c.name) },
    });
  }

  const officialDomains = registry.matched ? await officialDomainsFor(supabase, registry.matched.id) : [];
  const institutionSlug = registry.matched ? slugFor(registry.matched.name) : "";

  // --- Stage 3: check_domains -------------------------------------------
  await updateStage(supabase, runId, "check_domains");
  const allSenderValues = extractions.flatMap((e) => [
    ...(e.fields.senderEmails.value ?? []),
    ...(e.fields.urls.value ?? []),
  ]);
  const domainResults = checkAllDomains(allSenderValues, officialDomains, institutionSlug);

  for (const d of domainResults) {
    if (d.result === "free_mail") {
      findings.push({
        source: "code",
        code: "FREE_EMAIL_SENDER",
        severity: "high",
        documentId: null,
        quote: d.value,
        titleEn: `Sent from a free email address (${d.domain}), not the university's own domain.`,
        details: { value: d.value },
      });
    } else if (d.result === "lookalike") {
      findings.push({
        source: "code",
        code: "LOOKALIKE_DOMAIN",
        severity: "high",
        documentId: null,
        quote: d.value,
        titleEn: `"${d.domain}" closely resembles the official domain "${d.matchedDomain}" but is not it.`,
        details: { value: d.value, matchedDomain: d.matchedDomain },
      });
    }
  }
  const checkedDomains = domainResults.filter((d) => d.result !== "unknown");
  const allSenderDomainsMatch = checkedDomains.length > 0 && checkedDomains.every((d) => d.result === "match");

  // --- Stage 4: check_payment --------------------------------------------
  await updateStage(supabase, runId, "check_payment");
  const payeeExtraction = extractions.find((e) => e.fields.payeeName.value || e.fields.paymentMethod.value);
  let payeeIsInstitution = false;
  if (payeeExtraction && registry.matched) {
    const payment = checkPayment(
      payeeExtraction.fields.payeeName.value,
      payeeExtraction.fields.paymentMethod.value,
      registry.matched.name
    );
    if (payment.flag) {
      findings.push({
        source: "code",
        code: payment.flag,
        severity: "high",
        documentId: payeeExtraction.documentId,
        quote: null,
        titleEn: payment.reason ?? "Payment does not go to the institution.",
        details: {},
      });
    } else {
      payeeIsInstitution = true;
    }
  }

  // --- Stage 5: cross_check_case ------------------------------------------
  await updateStage(supabase, runId, "cross_check_case");
  const crossDocs: CrossCheckDoc[] = extractions.map((e) => ({ documentId: e.documentId, fields: e.fields }));
  for (const cf of crossCheckCase(crossDocs)) {
    findings.push({
      source: "code",
      code: cf.code,
      severity: "medium",
      documentId: cf.documentIds[0] ?? null,
      quote: null,
      titleEn:
        cf.code === "AMOUNT_MISMATCH"
          ? "The amount in one document does not match another document in this case."
          : "The name in one document does not match another document in this case.",
      details: cf.details,
    });
  }
  for (const e of extractions) {
    for (const df of checkDateSanity(
      e.documentId,
      e.fields.issueDate.value,
      e.fields.deadlineDate.value,
      e.fields.intake.value
    )) {
      findings.push({
        source: "code",
        code: df.code,
        severity: "medium",
        documentId: df.documentId,
        quote: null,
        titleEn: df.reason,
        details: {},
      });
    }
  }

  // --- Stage 6: scan_red_flags --------------------------------------------
  await updateStage(supabase, runId, "scan_red_flags");
  const redFlagDocs = extractions.map((e) => ({ documentId: e.documentId, rawText: e.rawText }));
  if (redFlagDocs.length > 0) {
    const scan = await scanRedFlags(redFlagDocs);
    await logAiRun(supabase, runId, "scan_red_flags", {
      ok: scan.ok,
      provider: scan.ok ? scan.provider : undefined,
      model: scan.ok ? scan.model : undefined,
      inputTokens: scan.ok ? scan.inputTokens : undefined,
      outputTokens: scan.ok ? scan.outputTokens : undefined,
      latencyMs: scan.latencyMs,
      errorCode: scan.ok ? undefined : scan.errorCode,
    });
    if (scan.ok) {
      aiAvailable = true;
      for (const flag of scan.flags) {
        findings.push({
          source: "model",
          code: flag.code,
          severity: flag.severity,
          documentId: flag.documentId,
          quote: flag.quote,
          titleEn: flag.explanation,
          details: {},
        });
      }
    }
  }

  // --- Stage 7: compose_verdict (code decides, never the model) ----------
  await updateStage(supabase, runId, "compose_verdict");
  const verdict = composeVerdict({
    findings,
    registryResult: registry.result,
    allSenderDomainsMatch,
    payeeIsInstitution,
    essentialFieldsReadable,
    aiAvailable,
  });

  for (const f of findings) {
    await supabase.from("findings").insert({
      case_run_id: runId,
      source: f.source,
      code: f.code,
      severity: f.severity,
      document_id: f.documentId,
      quote: f.quote,
      title_en: f.titleEn,
      title_ur: f.titleUr ?? null,
      details: f.details ?? {},
    });
  }

  await supabase.from("case_runs").update({ verdict }).eq("id", runId);
  await supabase.from("cases").update({ latest_verdict: verdict, updated_at: new Date().toISOString() }).eq("id", caseId);

  // --- Stage 8: explain_and_draft -----------------------------------------
  await updateStage(supabase, runId, "explain_and_draft");
  const contact: OfficialContact | null = registry.matched
    ? {
        institutionName: registry.matched.name,
        officialDomain: officialDomains[0] ?? null,
        admissionsEmail: officialDomains[0] ? `admissions@${officialDomains[0]}` : null,
        registrySource: "Seeded registry subset",
        snapshotDate: "2026-10",
      }
    : null;

  const draft = await explainAndDraft(verdict, findings, contact);
  if (draft.ok) {
    if (draft.provider !== "none") aiAvailable = true;
    await logAiRun(supabase, runId, "explain_and_draft", {
      ok: true,
      provider: draft.provider,
      model: draft.model,
      inputTokens: draft.inputTokens,
      outputTokens: draft.outputTokens,
      latencyMs: draft.latencyMs,
    });
    const rows = [
      { kind: "summary_en", content: draft.data.summaryEn },
      { kind: "summary_ur", content: draft.data.summaryUr },
      { kind: "verification_email", content: draft.data.verificationEmail },
      { kind: "complaint", content: draft.data.complaintDraft },
    ];
    for (const row of rows) {
      await supabase.from("drafts").insert({ case_run_id: runId, kind: row.kind, content: row.content });
    }
  } else {
    await logAiRun(supabase, runId, "explain_and_draft", { ok: false, latencyMs: draft.latencyMs, errorCode: draft.errorCode });
  }

  const status = extractions.length === documents.length ? "completed" : "partial";
  await supabase
    .from("case_runs")
    .update({ status, finished_at: new Date().toISOString() })
    .eq("id", runId);

  return { status, verdict, errorCode: null };
}
