export type DateSanityFinding = {
  code: "DATE_INCONSISTENCY";
  documentId: string;
  reason: string;
};

function parse(d: string | null): Date | null {
  if (!d) return null;
  const t = Date.parse(d);
  return Number.isNaN(t) ? null : new Date(t);
}

export function checkDateSanity(
  documentId: string,
  issueDate: string | null,
  deadlineDate: string | null,
  intake: string | null
): DateSanityFinding[] {
  const findings: DateSanityFinding[] = [];
  const issue = parse(issueDate);
  const deadline = parse(deadlineDate);
  const now = new Date();

  if (issue && deadline && deadline.getTime() < issue.getTime()) {
    findings.push({
      code: "DATE_INCONSISTENCY",
      documentId,
      reason: "The deadline date is before the document's own issue date.",
    });
  }

  if (deadline && deadline.getTime() < now.getTime()) {
    findings.push({
      code: "DATE_INCONSISTENCY",
      documentId,
      reason: "The stated deadline has already passed.",
    });
  }

  if (intake) {
    const yearMatch = intake.match(/(20\d{2})/);
    if (yearMatch) {
      const intakeYear = Number(yearMatch[1]);
      if (intakeYear < now.getFullYear()) {
        findings.push({
          code: "DATE_INCONSISTENCY",
          documentId,
          reason: `The stated intake year (${intakeYear}) is in the past.`,
        });
      }
    }
  }

  return findings;
}
