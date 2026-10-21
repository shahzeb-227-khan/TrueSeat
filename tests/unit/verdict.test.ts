import { describe, expect, it } from "vitest";
import { composeVerdict } from "@/lib/verdict";
import type { Finding } from "@/lib/schemas";

const base = {
  registryResult: "listed" as const,
  allSenderDomainsMatch: true,
  payeeIsInstitution: true,
  essentialFieldsReadable: true,
  aiAvailable: true,
};

function finding(partial: Partial<Finding>): Finding {
  return { source: "code", code: "X", severity: "high", documentId: null, quote: null, titleEn: "x", details: {}, ...partial };
}

describe("composeVerdict", () => {
  it("is checks_passed when everything is clean", () => {
    expect(composeVerdict({ ...base, findings: [] })).toBe("checks_passed");
  });

  it("is high_risk on any high-severity code finding", () => {
    const findings = [finding({ source: "code", severity: "high", code: "FREE_EMAIL_SENDER" })];
    expect(composeVerdict({ ...base, findings })).toBe("high_risk");
  });

  it("is high_risk on two or more high-severity model flags", () => {
    const findings = [
      finding({ source: "model", severity: "high", code: "GUARANTEED_VISA" }),
      finding({ source: "model", severity: "high", code: "SCHOLARSHIP_REQUIRES_FEE" }),
    ];
    expect(composeVerdict({ ...base, findings })).toBe("high_risk");
  });

  it("is suspicious on a single high-severity model flag with no code confirmation", () => {
    const findings = [finding({ source: "model", severity: "high", code: "GUARANTEED_VISA" })];
    expect(composeVerdict({ ...base, findings })).toBe("suspicious");
  });

  it("is suspicious on any medium code finding", () => {
    const findings = [finding({ source: "code", severity: "medium", code: "AMOUNT_MISMATCH" })];
    expect(composeVerdict({ ...base, findings })).toBe("suspicious");
  });

  it("is could_not_verify when the institution is not found and there are no findings", () => {
    expect(composeVerdict({ ...base, registryResult: "not_found", findings: [] })).toBe("could_not_verify");
  });

  it("never returns checks_passed when a sender domain doesn't match", () => {
    expect(composeVerdict({ ...base, allSenderDomainsMatch: false, findings: [] })).not.toBe("checks_passed");
  });

  it("never returns checks_passed when AI was unavailable", () => {
    expect(composeVerdict({ ...base, aiAvailable: false, findings: [] })).not.toBe("checks_passed");
  });
});
