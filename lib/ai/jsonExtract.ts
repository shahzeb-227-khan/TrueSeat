import type { z } from "zod";
import { callModel, type ModelCallOutcome, type ModelPart } from "./provider";

export type StructuredCallResult<T> =
  | { ok: true; data: T; provider: "anthropic" | "google"; model: string; inputTokens: number | null; outputTokens: number | null; latencyMs: number }
  | { ok: false; errorCode: string; latencyMs: number };

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const first = candidate.indexOf("{");
  const firstArr = candidate.indexOf("[");
  const start = first === -1 ? firstArr : firstArr === -1 ? first : Math.min(first, firstArr);
  const trimmed = start >= 0 ? candidate.slice(start) : candidate;
  return JSON.parse(trimmed);
}

export async function callModelForJson<T>(
  schema: z.ZodType<T>,
  system: string,
  parts: ModelPart[]
): Promise<StructuredCallResult<T>> {
  const attempt = async (outcome: ModelCallOutcome): Promise<StructuredCallResult<T> | null> => {
    if (!outcome.ok) return { ok: false, errorCode: outcome.errorCode, latencyMs: outcome.latencyMs };
    try {
      const parsed = schema.parse(extractJson(outcome.text));
      return {
        ok: true,
        data: parsed,
        provider: outcome.provider,
        model: outcome.model,
        inputTokens: outcome.inputTokens,
        outputTokens: outcome.outputTokens,
        latencyMs: outcome.latencyMs,
      };
    } catch {
      return null;
    }
  };

  const first = await callModel(system, parts);
  const firstResult = await attempt(first);
  if (firstResult) return firstResult;

  const repairParts: ModelPart[] = [
    ...parts,
    { type: "text", text: "Your previous reply was not valid JSON matching the required schema. Reply again with ONLY the JSON object, no commentary, no markdown fences." },
  ];
  const second = await callModel(system, repairParts);
  const secondResult = await attempt(second);
  if (secondResult) return secondResult;

  return { ok: false, errorCode: "invalid_model_output", latencyMs: (first.ok ? first.latencyMs : 0) + (second.ok ? second.latencyMs : 0) };
}
