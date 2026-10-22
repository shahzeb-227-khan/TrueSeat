import { z } from "zod";

// ---------- Cases ----------

export const DESTINATION_COUNTRIES = ["GB", "CA", "US", "OTHER"] as const;
export type DestinationCountry = (typeof DESTINATION_COUNTRIES)[number];

export const CASE_STATUSES = ["open", "running", "reviewed", "closed"] as const;
export type CaseStatus = (typeof CASE_STATUSES)[number];

export const DOC_TYPES = [
  "offer_letter",
  "scholarship_letter",
  "fee_receipt",
  "payment_instruction",
  "chat",
  "email",
  "other",
] as const;
export type DocType = (typeof DOC_TYPES)[number];

export const ACCEPTED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "text/plain",
] as const;
export type AcceptedMimeType = (typeof ACCEPTED_MIME_TYPES)[number];

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
export const MAX_DOCUMENTS_PER_CASE = 10;

export const CaseCreateSchema = z.object({
  destinationCountry: z.enum(DESTINATION_COUNTRIES),
  title: z.string().min(1).max(200).optional(),
});
export type CaseCreateInput = z.infer<typeof CaseCreateSchema>;

export const DocumentMetaSchema = z.object({
  docType: z.enum(DOC_TYPES),
  mimeType: z.enum(ACCEPTED_MIME_TYPES),
  fileName: z.string().min(1).max(255),
  sizeBytes: z.number().int().positive().max(MAX_UPLOAD_BYTES),
});
export type DocumentMetaInput = z.infer<typeof DocumentMetaSchema>;

export type Verdict = "high_risk" | "suspicious" | "checks_passed" | "could_not_verify";

export const VERDICT_LABELS: Record<Verdict, { emoji: string; en: string; ur: string }> = {
  high_risk: { emoji: "🔴", en: "High risk", ur: "زیادہ خطرہ" },
  suspicious: { emoji: "🟠", en: "Suspicious", ur: "مشکوک" },
  checks_passed: { emoji: "🟢", en: "Checks passed", ur: "چیک پاس ہوگئے" },
  could_not_verify: { emoji: "⚪", en: "Couldn't verify", ur: "تصدیق نہیں ہو سکی" },
};

export type CaseDocument = {
  id: string;
  caseId: string;
  docType: DocType;
  mimeType: string;
  originalName: string;
  sizeBytes: number;
  uploadedAt: string;
};

export type Case = {
  id: string;
  title: string;
  destinationCountry: DestinationCountry;
  status: CaseStatus;
  latestVerdict?: Verdict | null;
  createdAt: string;
  updatedAt: string;
};

export type CaseWithDocuments = Case & { documents: CaseDocument[] };

// ---------- Verification pipeline ----------

export const RUN_STAGES = [
  "extract_document",
  "lookup_institution",
  "check_domains",
  "check_payment",
  "cross_check_case",
  "scan_red_flags",
  "compose_verdict",
  "explain_and_draft",
] as const;
export type RunStage = (typeof RUN_STAGES)[number];

export const CONFIDENCE_THRESHOLD = 0.5;

export type FieldWithEvidence<T> = { value: T | null; confidence: number; quote: string | null };

export type ExtractionFields = {
  institutionName: FieldWithEvidence<string>;
  studentName: FieldWithEvidence<string>;
  programme: FieldWithEvidence<string>;
  intake: FieldWithEvidence<string>;
  issueDate: FieldWithEvidence<string>;
  deadlineDate: FieldWithEvidence<string>;
  tuitionAmount: FieldWithEvidence<number>;
  currency: FieldWithEvidence<string>;
  payeeName: FieldWithEvidence<string>;
  paymentMethod: FieldWithEvidence<string>;
  senderEmails: FieldWithEvidence<string[]>;
  urls: FieldWithEvidence<string[]>;
};

const FieldSchema = <T extends z.ZodTypeAny>(valueSchema: T) =>
  z.object({ value: valueSchema.nullable(), confidence: z.number().min(0).max(1), quote: z.string().nullable() });

export const ExtractionModelOutputSchema = z.object({
  rawText: z.string(),
  fields: z.object({
    institutionName: FieldSchema(z.string()),
    studentName: FieldSchema(z.string()),
    programme: FieldSchema(z.string()),
    intake: FieldSchema(z.string()),
    issueDate: FieldSchema(z.string()),
    deadlineDate: FieldSchema(z.string()),
    tuitionAmount: FieldSchema(z.number()),
    currency: FieldSchema(z.string()),
    payeeName: FieldSchema(z.string()),
    paymentMethod: FieldSchema(z.string()),
    senderEmails: FieldSchema(z.array(z.string())),
    urls: FieldSchema(z.array(z.string())),
  }),
});
export type ExtractionModelOutput = z.infer<typeof ExtractionModelOutputSchema>;

export const RED_FLAG_CODES = [
  "GUARANTEED_VISA",
  "GUARANTEED_ADMISSION_OR_SCHOLARSHIP",
  "SCHOLARSHIP_REQUIRES_FEE",
  "PERSONAL_OR_WALLET_PAYMENT",
  "CASH_PAYMENT",
  "INSIDER_CONNECTION_CLAIM",
  "OFFICIAL_IMPERSONATION_CLAIM",
  "EXTREME_URGENCY",
  "SECRECY_REQUEST",
  "FREE_EMAIL_SENDER",
  "LOOKALIKE_DOMAIN",
  "AMOUNT_MISMATCH",
  "NAME_MISMATCH",
  "DATE_INCONSISTENCY",
] as const;
export type RedFlagCode = (typeof RED_FLAG_CODES)[number] | "REGISTRY_LISTED" | "REGISTRY_NOT_FOUND" | "REGISTRY_AMBIGUOUS";

export const ModelFlagSchema = z.object({
  code: z.enum(RED_FLAG_CODES),
  documentId: z.string(),
  severity: z.enum(["high", "medium"]),
  quote: z.string(),
  explanation: z.string(),
});
export type ModelFlag = z.infer<typeof ModelFlagSchema>;

export const ModelFlagsOutputSchema = z.object({ flags: z.array(ModelFlagSchema) });

export type Finding = {
  id?: string;
  source: "code" | "model";
  code: string;
  severity: "high" | "medium" | "info";
  documentId: string | null;
  quote: string | null;
  titleEn: string;
  titleUr?: string;
  details: Record<string, unknown>;
};

export const DRAFT_KINDS = ["summary_en", "summary_ur", "verification_email", "complaint"] as const;
export type DraftKind = (typeof DRAFT_KINDS)[number];

export type Draft = { id: string; kind: DraftKind; content: string; edited: boolean };
export const DraftSchema = z.object({
  id: z.string(),
  kind: z.enum(DRAFT_KINDS),
  content: z.string(),
  edited: z.boolean(),
});

export const ExplainAndDraftOutputSchema = z.object({
  summaryEn: z.string(),
  summaryUr: z.string(),
  verificationEmail: z.string(),
  complaintDraft: z.string(),
  nextSteps: z.array(z.string()),
});
export type ExplainAndDraftOutput = z.infer<typeof ExplainAndDraftOutputSchema>;

export const AiRunSchema = z.object({
  caseRunId: z.string(),
  stage: z.string(),
  provider: z.enum(["anthropic", "google", "none"]),
  model: z.string().nullable(),
  latencyMs: z.number(),
  inputTokens: z.number().nullable(),
  outputTokens: z.number().nullable(),
  ok: z.boolean(),
  errorCode: z.string().nullable(),
});

export type CaseRun = {
  id: string;
  caseId: string;
  status: "running" | "completed" | "partial" | "failed";
  stage: RunStage;
  verdict: Verdict | null;
  errorCode: string | null;
  startedAt: string;
  finishedAt: string | null;
};

export type RunResult = CaseRun & {
  registrySnapshotIds: string[];
  findings: Finding[];
  drafts: Draft[];
};

export type Institution = {
  id: string;
  name: string;
  country: DestinationCountry;
  registryId: string | null;
  registryStatus: string | null;
};
