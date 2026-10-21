import { describe, expect, it } from "vitest";
import { crossCheckCase } from "@/lib/checks/crossCheck";
import type { ExtractionFields } from "@/lib/schemas";

function field(value: unknown, confidence = 0.95) {
  return { value, confidence, quote: null };
}

function fields(overrides: Partial<Record<keyof ExtractionFields, ReturnType<typeof field>>>): ExtractionFields {
  const empty = field(null, 0);
  return {
    institutionName: empty,
    studentName: empty,
    programme: empty,
    intake: empty,
    issueDate: empty,
    deadlineDate: empty,
    tuitionAmount: empty,
    currency: empty,
    payeeName: empty,
    paymentMethod: empty,
    senderEmails: field([]),
    urls: field([]),
    ...overrides,
  } as ExtractionFields;
}

describe("crossCheckCase", () => {
  it("flags a tuition amount mismatch in the same currency", () => {
    const docs = [
      { documentId: "d1", fields: fields({ tuitionAmount: field(18500), currency: field("GBP") }) },
      { documentId: "d2", fields: fields({ tuitionAmount: field(21000), currency: field("GBP") }) },
    ];
    const findings = crossCheckCase(docs);
    expect(findings.some((f) => f.code === "AMOUNT_MISMATCH")).toBe(true);
  });

  it("does not flag amounts in different currencies", () => {
    const docs = [
      { documentId: "d1", fields: fields({ tuitionAmount: field(18500), currency: field("GBP") }) },
      { documentId: "d2", fields: fields({ tuitionAmount: field(21000), currency: field("USD") }) },
    ];
    expect(crossCheckCase(docs).some((f) => f.code === "AMOUNT_MISMATCH")).toBe(false);
  });

  it("flags a clearly different student name", () => {
    const docs = [
      { documentId: "d1", fields: fields({ studentName: field("Ayesha Khan") }) },
      { documentId: "d2", fields: fields({ studentName: field("Bilal Ahmed") }) },
    ];
    expect(crossCheckCase(docs).some((f) => f.code === "NAME_MISMATCH")).toBe(true);
  });

  it("does not flag the same name written slightly differently", () => {
    const docs = [
      { documentId: "d1", fields: fields({ studentName: field("Ayesha Khan") }) },
      { documentId: "d2", fields: fields({ studentName: field("Ayesha  Kh") }) },
    ];
    // tolerant edit-distance should not flag this
    expect(crossCheckCase(docs).some((f) => f.code === "NAME_MISMATCH")).toBe(false);
  });
});
