import { describe, expect, it } from "vitest";
import { applyQuoteGuard } from "@/lib/ai/scanRedFlags";
import type { ModelFlag } from "@/lib/schemas";

function flag(overrides: Partial<ModelFlag>): ModelFlag {
  return { code: "GUARANTEED_VISA", documentId: "doc-1", severity: "high", quote: "visa is guaranteed", explanation: "x", ...overrides };
}

describe("applyQuoteGuard", () => {
  const docText = new Map([["doc-1", "Dear applicant, your visa is GUARANTEED if you pay today."]]);

  it("keeps a flag whose quote exists in the document (case/whitespace-insensitive)", () => {
    const { kept, dropped } = applyQuoteGuard([flag({})], docText);
    expect(kept).toHaveLength(1);
    expect(dropped).toHaveLength(0);
  });

  it("drops a flag whose quote was invented", () => {
    const { kept, dropped } = applyQuoteGuard([flag({ quote: "100% visa success rate" })], docText);
    expect(kept).toHaveLength(0);
    expect(dropped).toHaveLength(1);
    expect(dropped[0].reason).toBe("quote_not_found");
  });

  it("drops a flag that references an unknown document", () => {
    const { kept, dropped } = applyQuoteGuard([flag({ documentId: "doc-missing" })], docText);
    expect(kept).toHaveLength(0);
    expect(dropped[0].reason).toBe("unknown_document_id");
  });
});
