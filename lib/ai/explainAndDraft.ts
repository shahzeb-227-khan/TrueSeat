import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ExplainAndDraftOutputSchema, type ExplainAndDraftOutput, type Finding, type Verdict } from "@/lib/schemas";
import { callModelForJson } from "./jsonExtract";
import type { ModelPart } from "./provider";

const PROMPT_VERSION = "explain_and_draft.v1";
let cachedPrompt: string | null = null;

function loadPrompt(): string {
  if (cachedPrompt) return cachedPrompt;
  cachedPrompt = readFileSync(join(process.cwd(), "prompts", `${PROMPT_VERSION}.md`), "utf8");
  return cachedPrompt;
}

export type OfficialContact = {
  institutionName: string;
  officialDomain: string | null;
  admissionsEmail: string | null;
  registrySource: string;
  snapshotDate: string;
};

function allowedVocabulary(findings: Finding[], contact: OfficialContact | null): Set<string> {
  const vocab = new Set<string>();
  const add = (v: unknown) => {
    if (v === null || v === undefined) return;
    if (typeof v === "string" || typeof v === "number") vocab.add(String(v).toLowerCase());
  };
  for (const f of findings) {
    add(f.quote);
    add(f.titleEn);
    Object.values(f.details ?? {}).forEach(add);
  }
  if (contact) {
    add(contact.institutionName);
    add(contact.officialDomain);
    add(contact.admissionsEmail);
  }
  return vocab;
}

const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
const AMOUNT_RE = /\b\d{3,}(?:[.,]\d+)?\b/g;

function violatesNumberAndNameGuard(output: ExplainAndDraftOutput, vocab: Set<string>): boolean {
  const text = `${output.verificationEmail}\n${output.complaintDraft}`;
  const emails = text.match(EMAIL_RE) ?? [];
  for (const e of emails) {
    if (!vocab.has(e.toLowerCase())) return true;
  }
  const amounts = text.match(AMOUNT_RE) ?? [];
  for (const a of amounts) {
    if (!vocab.has(a.toLowerCase())) return true;
  }
  return false;
}

function templateFallback(
  verdict: Verdict,
  findings: Finding[],
  contact: OfficialContact | null
): ExplainAndDraftOutput {
  const bulletsEn = findings.map((f) => `- ${f.titleEn}`).join("\n") || "- No findings recorded.";
  const email = contact?.admissionsEmail ?? (contact?.officialDomain ? `admissions@${contact.officialDomain}` : "the institution's official admissions address");
  return {
    summaryEn: `Verdict: ${verdict}.\n\nFindings:\n${bulletsEn}\n\nThis is an automatically generated summary; please review each finding above.`,
    summaryUr: `نتیجہ: ${verdict}۔ براہ کرم اوپر دی گئی تفصیلات ملاحظہ کریں۔`,
    verificationEmail: `To: ${email}\nSubject: Verifying an offer\n\nDear Admissions Office,\n\nI received an offer referencing your institution and would like to confirm it directly with you before proceeding. Could you confirm whether this offer is genuine?\n\nThank you.`,
    complaintDraft: "This is a draft complaint. Please review the findings above and fill in the specific details before sending it to the FIA.",
    nextSteps: ["Contact the university directly using its official domain.", "Do not pay until the university confirms the offer in writing."],
  };
}

export type ExplainAndDraftOutcome =
  | { ok: true; data: ExplainAndDraftOutput; usedFallbackTemplate: boolean; provider: "anthropic" | "google" | "none"; model: string | null; inputTokens: number | null; outputTokens: number | null; latencyMs: number }
  | { ok: false; errorCode: string; latencyMs: number };

export async function explainAndDraft(
  verdict: Verdict,
  findings: Finding[],
  contact: OfficialContact | null
): Promise<ExplainAndDraftOutcome> {
  const vocab = allowedVocabulary(findings, contact);
  const input = {
    verdict,
    findings: findings.map((f) => ({ code: f.code, severity: f.severity, titleEn: f.titleEn, quote: f.quote, details: f.details })),
    officialContact: contact,
  };
  const parts: ModelPart[] = [{ type: "text", text: JSON.stringify(input, null, 2) }];

  const first = await callModelForJson(ExplainAndDraftOutputSchema, loadPrompt(), parts);
  if (first.ok && !violatesNumberAndNameGuard(first.data, vocab)) {
    return { ok: true, data: first.data, usedFallbackTemplate: false, provider: first.provider, model: first.model, inputTokens: first.inputTokens, outputTokens: first.outputTokens, latencyMs: first.latencyMs };
  }

  const second = await callModelForJson(ExplainAndDraftOutputSchema, loadPrompt(), parts);
  if (second.ok && !violatesNumberAndNameGuard(second.data, vocab)) {
    return { ok: true, data: second.data, usedFallbackTemplate: false, provider: second.provider, model: second.model, inputTokens: second.inputTokens, outputTokens: second.outputTokens, latencyMs: second.latencyMs };
  }

  return {
    ok: true,
    data: templateFallback(verdict, findings, contact),
    usedFallbackTemplate: true,
    provider: "none",
    model: null,
    inputTokens: null,
    outputTokens: null,
    latencyMs: (first.ok ? first.latencyMs : 0) + (second.ok ? second.latencyMs : 0),
  };
}
