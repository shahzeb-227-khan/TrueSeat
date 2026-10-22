import type { Finding, Verdict } from "@/lib/schemas";

export type ComposeVerdictInput = {
  findings: Finding[];
  registryResult: "listed" | "ambiguous" | "not_found" | "country_not_supported";
  allSenderDomainsMatch: boolean;
  payeeIsInstitution: boolean;
  essentialFieldsReadable: boolean;
  aiAvailable: boolean;
};

/**
 * AGENTS.md core rule: code decides the verdict, the model only reads
 * documents and explains findings. A model flag can raise suspicion but can
 * never alone produce checks_passed.
 *
 * 🔴 High risk: any High finding confirmed by code, or two or more High
 *    quoted model flags.
 * 🟠 Suspicious: any Medium finding, or one High model flag without code
 *    confirmation.
 * 🟢 Checks passed: institution listed, all sender domains match, payee is
 *    the institution, no High or Medium findings.
 * ⚪ Couldn't verify: institution not found, country unsupported, essential
 *    fields unreadable or AI unavailable, with no red flags.
 */
export function composeVerdict(input: ComposeVerdictInput): Verdict {
  const { findings, registryResult, allSenderDomainsMatch, payeeIsInstitution, essentialFieldsReadable, aiAvailable } =
    input;

  const highCodeFindings = findings.filter((f) => f.source === "code" && f.severity === "high");
  const mediumCodeFindings = findings.filter((f) => f.source === "code" && f.severity === "medium");
  const highModelFlags = findings.filter((f) => f.source === "model" && f.severity === "high");

  if (highCodeFindings.length > 0 || highModelFlags.length >= 2) {
    return "high_risk";
  }

  if (mediumCodeFindings.length > 0 || highModelFlags.length === 1) {
    return "suspicious";
  }

  const noRedFlags = findings.every((f) => f.severity === "info");

  if (
    registryResult === "listed" &&
    allSenderDomainsMatch &&
    payeeIsInstitution &&
    essentialFieldsReadable &&
    aiAvailable &&
    noRedFlags
  ) {
    return "checks_passed";
  }

  return "could_not_verify";
}
