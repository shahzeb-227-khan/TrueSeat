import type { ExtractionFields } from "@/lib/schemas";

export type CrossCheckDoc = { documentId: string; fields: ExtractionFields };

export type CrossCheckFinding = {
  code: "AMOUNT_MISMATCH" | "NAME_MISMATCH";
  documentIds: string[];
  details: Record<string, unknown>;
};

function normaliseName(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function looksSameName(a: string, b: string): boolean {
  const an = normaliseName(a);
  const bn = normaliseName(b);
  if (!an || !bn) return true; // nothing to compare, don't flag
  if (an === bn) return true;
  const aWords = an.split(" ").filter(Boolean);
  const bWords = bn.split(" ").filter(Boolean);
  const bSet = new Set(bWords);
  let shared = 0;
  for (const w of aWords) if (bSet.has(w)) shared++;
  const minLen = Math.min(aWords.length, bWords.length);
  return minLen > 0 && shared / minLen >= 0.5;
}

export function crossCheckCase(docs: CrossCheckDoc[]): CrossCheckFinding[] {
  const findings: CrossCheckFinding[] = [];
  if (docs.length < 2) return findings;

  // Amount mismatch: compare pairs that both have a tuition amount AND the same currency.
  const withAmount = docs.filter(
    (d) => d.fields.tuitionAmount.value !== null && d.fields.currency.value
  );
  for (let i = 0; i < withAmount.length; i++) {
    for (let j = i + 1; j < withAmount.length; j++) {
      const a = withAmount[i];
      const b = withAmount[j];
      if (a.fields.currency.value !== b.fields.currency.value) continue;
      const diff = Math.abs((a.fields.tuitionAmount.value as number) - (b.fields.tuitionAmount.value as number));
      if (diff > 0.01) {
        findings.push({
          code: "AMOUNT_MISMATCH",
          documentIds: [a.documentId, b.documentId],
          details: {
            amountA: a.fields.tuitionAmount.value,
            amountB: b.fields.tuitionAmount.value,
            currency: a.fields.currency.value,
          },
        });
      }
    }
  }

  // Name mismatch: compare student names across documents that both have one.
  const withName = docs.filter((d) => d.fields.studentName.value);
  for (let i = 0; i < withName.length; i++) {
    for (let j = i + 1; j < withName.length; j++) {
      const a = withName[i];
      const b = withName[j];
      const an = a.fields.studentName.value as string;
      const bn = b.fields.studentName.value as string;
      if (!looksSameName(an, bn)) {
        findings.push({
          code: "NAME_MISMATCH",
          documentIds: [a.documentId, b.documentId],
          details: { nameA: an, nameB: bn },
        });
      }
    }
  }

  return findings;
}
