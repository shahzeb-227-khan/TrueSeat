
// ---------------------------------------------------------------------------
// Verification types (Extraction, Finding, Verdict). Match the Supabase tables.
// ---------------------------------------------------------------------------

export const VERDICTS = ["high_risk", "suspicious", "checks_passed", "could_not_verify"] as const;
export type Verdict = z.infer<typeof VerdictSchema>;
export const VerdictSchema = z.enum(VERDICTS);

export const SEVERITIES = ["high", "medium", "info"] as const;
export const SeveritySchema = z.enum(SEVERITIES);
export type Severity = z.infer<typeof SeveritySchema>;

export const FINDING_SOURCES = ["code", "model"] as const;

export const RED_FLAG_CODES = [
  "GUARANTEED_VISA",
  "GUARANTEED_ADMISSION_OR_SCHOLARSHIP",
  "SCHOLARSHIP_REQUIRES_FEE",
  "PERSONAL_OR_WALLET_PAYMENT",
  "CASH_PAYMENT",
  "FREE_EMAIL_SENDER",
  "LOOKALIKE_DOMAIN",
  "INSIDER_CONNECTION_CLAIM",
  "OFFICIAL_IMPERSONATION_CLAIM",
  "EXTREME_URGENCY",
  "SECRECY_REQUEST",
  "AMOUNT_MISMATCH",
  "NAME_MISMATCH",
  "DATE_INCONSISTENCY",
] as const;
export type RedFlagCode = (typeof RED_FLAG_CODES)[number];

export const MODEL_FLAG_CODES = [
  "GUARANTEED_VISA",
  "GUARANTEED_ADMISSION_OR_SCHOLARSHIP",
  "SCHOLARSHIP_REQUIRES_FEE",
  "INSIDER_CONNECTION_CLAIM",
  "OFFICIAL_IMPERSONATION_CLAIM",
  "EXTREME_URGENCY",
  "SECRECY_REQUEST",
] as const;

// Confidence threshold: fields below this are flagged for the user to confirm.
export const CONFIDENCE_THRESHOLD = 0.7;

const Confidence = z.number().min(0).max(1);

// A single value the model read from a document, with its confidence and a quote.
// Missing values are null, never guessed.
export const ExtractedFieldSchema = <T extends z.ZodTypeAny>(inner: T) =>
  z.object({
    value: inner.nullable(),
    confidence: Confidence,
    quote: z.string().nullable(),
  });

export const ExtractionFieldsSchema = z.object({
  institutionName: ExtractedFieldSchema(z.string()),
  studentName: ExtractedFieldSchema(z.string()),
  programme: ExtractedFieldSchema(z.string()),
  intake: ExtractedFieldSchema(z.string()),
  issueDate: ExtractedFieldSchema(z.string()),
  deadlineDate: ExtractedFieldSchema(z.string()),
  tuitionAmount: ExtractedFieldSchema(z.number()),
  currency: ExtractedFieldSchema(z.string()),
  payeeName: ExtractedFieldSchema(z.string()),
  paymentMethod: ExtractedFieldSchema(z.string()),
  senderEmails: ExtractedFieldSchema(z.array(z.string())),
  urls: ExtractedFieldSchema(z.array(z.string())),
});
export type ExtractionFields = z.infer<typeof ExtractionFieldsSchema>;

// What the model must return for one document (the model also returns the text it read).
export const ExtractionModelOutputSchema = z.object({
  rawText: z.string(),
  fields: ExtractionFieldsSchema,
});
export type ExtractionModelOutput = z.infer<typeof ExtractionModelOutputSchema>;

export const ExtractionSchema = z.object({
  id: z.string().uuid(),
  documentId: z.string().uuid(),
  fields: ExtractionFieldsSchema,
  userConfirmed: z.boolean(),
  model: z.string().nullable(),
  promptVersion: z.string().nullable(),
  createdAt: z.string(),
});
export type Extraction = z.infer<typeof ExtractionSchema>;

// A model-detected red flag. The quote MUST appear in the stored document text (quote-guard).
export const ModelFlagSchema = z.object({
  code: z.enum(MODEL_FLAG_CODES),
  quote: z.string().min(3),
});
export const ModelFlagsOutputSchema = z.object({
  flags: z.array(ModelFlagSchema),
});
export type ModelFlag = z.infer<typeof ModelFlagSchema>;

export const FindingSchema = z.object({
  id: z.string().uuid().optional(),
  source: z.enum(FINDING_SOURCES),
  code: z.string(),
  severity: SeveritySchema,
  documentId: z.string().uuid().nullable(),
  quote: z.string().nullable(),
  details: z.record(z.unknown()).default({}),
});
export type Finding = z.infer<typeof FindingSchema>;

export const REGISTRY_RESULTS = ["listed", "ambiguous", "not_found", "country_not_supported"] as const;
export type RegistryResult = (typeof REGISTRY_RESULTS)[number];

export const DOMAIN_RESULTS = ["match", "free_mail", "lookalike", "unrelated", "unknown"] as const;
export type DomainResult = (typeof DOMAIN_RESULTS)[number];

export const RUN_STATUSES = ["running", "completed", "partial", "failed"] as const;
export type RunStatus = (typeof RUN_STATUSES)[number];

export const CaseRunSchema = z.object({
  id: z.string().uuid(),
  caseId: z.string().uuid(),
  status: z.enum(RUN_STATUSES),
  stage: z.string().nullable(),
  verdict: VerdictSchema.nullable(),
  errorCode: z.string().nullable(),
  createdAt: z.string(),
});
export type CaseRun = z.infer<typeof CaseRunSchema>;

export const VERDICT_DISCLAIMER =
  "This does not prove the offer is genuine. Confirm it with the university using the official contact below.";
