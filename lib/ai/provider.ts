// Thin, dependency-free wrapper over the Claude and Gemini HTTP APIs.
// Uses plain fetch (no SDK) so the stage files stay provider-agnostic and the
// repo doesn't need extra packages installed under time pressure.
//
// AGENTS.md: "Claude (primary, vision + tool use), Gemini (fallback)."
// Failure handling: 30s timeout, one retry with back-off on 429/5xx, then
// the fallback provider.

export type ModelPart = { type: "text"; text: string } | { type: "file"; mimeType: string; base64: string };

export type ModelCallResult = {
  text: string;
  provider: "anthropic" | "google";
  model: string;
  inputTokens: number | null;
  outputTokens: number | null;
};

const CLAUDE_MODEL = process.env.TRUESEAT_CLAUDE_MODEL ?? "claude-sonnet-4-5";
const GEMINI_MODEL = process.env.TRUESEAT_GEMINI_MODEL ?? "gemini-2.0-flash";
const TIMEOUT_MS = 30_000;

function withTimeout(ms: number): { signal: AbortSignal; cancel: () => void } {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, cancel: () => clearTimeout(id) };
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callClaude(system: string, parts: ModelPart[]): Promise<ModelCallResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw Object.assign(new Error("ANTHROPIC_API_KEY not set"), { code: "no_key" });

  const content = parts.map((p) => {
    if (p.type === "text") return { type: "text", text: p.text };
    const blockType = p.mimeType === "application/pdf" ? "document" : "image";
    return { type: blockType, source: { type: "base64", media_type: p.mimeType, data: p.base64 } };
  });

  const { signal, cancel } = withTimeout(TIMEOUT_MS);
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal,
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 2048,
        system,
        messages: [{ role: "user", content }],
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw Object.assign(new Error(`anthropic_http_${res.status}`), { status: res.status, body });
    }
    const json = await res.json();
    const text = (json.content ?? []).map((c: { text?: string }) => c.text ?? "").join("");
    return {
      text,
      provider: "anthropic",
      model: CLAUDE_MODEL,
      inputTokens: json.usage?.input_tokens ?? null,
      outputTokens: json.usage?.output_tokens ?? null,
    };
  } finally {
    cancel();
  }
}

async function callGemini(system: string, parts: ModelPart[]): Promise<ModelCallResult> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) throw Object.assign(new Error("GOOGLE_API_KEY not set"), { code: "no_key" });

  const geminiParts = parts.map((p) =>
    p.type === "text" ? { text: p.text } : { inlineData: { mimeType: p.mimeType, data: p.base64 } }
  );

  const { signal, cancel } = withTimeout(TIMEOUT_MS);
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        signal,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts: geminiParts }],
        }),
      }
    );
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw Object.assign(new Error(`google_http_${res.status}`), { status: res.status, body });
    }
    const json = await res.json();
    const text = (json.candidates?.[0]?.content?.parts ?? [])
      .map((p: { text?: string }) => p.text ?? "")
      .join("");
    return {
      text,
      provider: "google",
      model: GEMINI_MODEL,
      inputTokens: json.usageMetadata?.promptTokenCount ?? null,
      outputTokens: json.usageMetadata?.candidatesTokenCount ?? null,
    };
  } finally {
    cancel();
  }
}

function isRetryable(err: unknown): boolean {
  const e = err as { status?: number; name?: string };
  return e?.name === "AbortError" || e?.status === 429 || (e?.status !== undefined && e.status >= 500);
}

export type ModelCallOutcome =
  | (ModelCallResult & { ok: true; latencyMs: number })
  | { ok: false; latencyMs: number; errorCode: string; provider: "none"; model: null; inputTokens: null; outputTokens: null };

export async function callModel(system: string, parts: ModelPart[]): Promise<ModelCallOutcome> {
  const start = Date.now();
  try {
    const result = await callClaude(system, parts);
    return { ...result, ok: true, latencyMs: Date.now() - start };
  } catch (err) {
    if (isRetryable(err)) {
      await sleep(1500);
      try {
        const result = await callClaude(system, parts);
        return { ...result, ok: true, latencyMs: Date.now() - start };
      } catch {
        // fall through to Gemini below
      }
    }
  }

  try {
    const result = await callGemini(system, parts);
    return { ...result, ok: true, latencyMs: Date.now() - start };
  } catch (err) {
    const e = err as { code?: string; status?: number };
    return {
      ok: false,
      latencyMs: Date.now() - start,
      errorCode: e?.code ?? (e?.status ? `http_${e.status}` : "unknown_error"),
      provider: "none",
      model: null,
      inputTokens: null,
      outputTokens: null,
    };
  }
}
