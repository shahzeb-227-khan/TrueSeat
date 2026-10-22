import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ModelFlagsOutputSchema, type ModelFlag } from "@/lib/schemas";
import { callModelForJson } from "./jsonExtract";
import type { ModelPart } from "./provider";

const PROMPT_VERSION = "scan_red_flags.v1";
let cachedPrompt: string | null = null;

function loadPrompt(): string {
  if (cachedPrompt) return cachedPrompt;
  cachedPrompt = readFileSync(join(process.cwd(), "prompts", `${PROMPT_VERSION}.md`), "utf8");
  return cachedPrompt;
}

function normaliseForQuoteMatch(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * Quote-guard: drop any model flag whose quote does not appear (after
 * whitespace/case normalisation) in the stored text of the document it
 * references. This is the single most important safety check in the
 * pipeline -- a flag the model invented never reaches the results screen.
 */
export function applyQuoteGuard(
  flags: ModelFlag[],
  docTextById: Map<string, string>
): { kept: ModelFlag[]; dropped: Array<ModelFlag & { reason: string }> } {
  const kept: ModelFlag[] = [];
  const dropped: Array<ModelFlag & { reason: string }> = [];

  for (const flag of flags) {
    const sourceText = docTextById.get(flag.documentId);
    if (!sourceText) {
      dropped.push({ ...flag, reason: "unknown_document_id" });
      continue;
    }
    const haystack = normaliseForQuoteMatch(sourceText);
    const needle = normaliseForQuoteMatch(flag.quote);
    if (needle.length < 3 || !haystack.includes(needle)) {
      dropped.push({ ...flag, reason: "quote_not_found" });
      continue;
    }
    kept.push(flag);
  }
  return { kept, dropped };
}

export type ScanRedFlagsOutcome =
  | { ok: true; flags: ModelFlag[]; dropped: Array<ModelFlag & { reason: string }>; provider: "anthropic" | "google"; model: string; inputTokens: number | null; outputTokens: number | null; latencyMs: number }
  | { ok: false; errorCode: string; latencyMs: number };

export async function scanRedFlags(docs: { documentId: string; rawText: string }[]): Promise<ScanRedFlagsOutcome> {
  const body = docs.map((d) => `### documentId: ${d.documentId}\n${d.rawText}`).join("\n\n");
  const parts: ModelPart[] = [{ type: "text", text: body }];

  const result = await callModelForJson(ModelFlagsOutputSchema, loadPrompt(), parts);
  if (!result.ok) return { ok: false, errorCode: result.errorCode, latencyMs: result.latencyMs };

  const docTextById = new Map(docs.map((d) => [d.documentId, d.rawText]));
  const { kept, dropped } = applyQuoteGuard(result.data.flags, docTextById);

  return {
    ok: true,
    flags: kept,
    dropped,
    provider: result.provider,
    model: result.model,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
    latencyMs: result.latencyMs,
  };
}
