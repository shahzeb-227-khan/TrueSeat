import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ExtractionModelOutputSchema, type ExtractionModelOutput } from "@/lib/schemas";
import { callModelForJson } from "./jsonExtract";
import type { ModelPart } from "./provider";

const PROMPT_VERSION = "extract_document.v1";
let cachedPrompt: string | null = null;

function loadPrompt(): string {
  if (cachedPrompt) return cachedPrompt;
  cachedPrompt = readFileSync(join(process.cwd(), "prompts", `${PROMPT_VERSION}.md`), "utf8");
  return cachedPrompt;
}

export type ExtractInput =
  | { kind: "file"; mimeType: string; base64: string }
  | { kind: "text"; text: string };

export type ExtractOutcome =
  | { ok: true; data: ExtractionModelOutput; provider: "anthropic" | "google"; model: string; inputTokens: number | null; outputTokens: number | null; latencyMs: number; promptVersion: string }
  | { ok: false; errorCode: string; latencyMs: number; promptVersion: string };

export async function extractDocument(input: ExtractInput): Promise<ExtractOutcome> {
  const parts: ModelPart[] =
    input.kind === "file"
      ? [{ type: "file", mimeType: input.mimeType, base64: input.base64 }]
      : [{ type: "text", text: `Document text (pasted, not a scanned file):\n\n${input.text}` }];

  const result = await callModelForJson(ExtractionModelOutputSchema, loadPrompt(), parts);
  if (!result.ok) return { ok: false, errorCode: result.errorCode, latencyMs: result.latencyMs, promptVersion: PROMPT_VERSION };
  return { ...result, promptVersion: PROMPT_VERSION };
}

export { PROMPT_VERSION as EXTRACT_PROMPT_VERSION };
