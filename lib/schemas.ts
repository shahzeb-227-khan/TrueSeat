import { z } from "zod";

// Case and document types shared by API routes and UI.
// Bootstrap subset for the case-creation phase. Extraction, Finding and Verdict types come later.

export const DESTINATION_COUNTRIES = ["GB", "CA", "US", "OTHER"] as const;
export type DestinationCountry = (typeof DESTINATION_COUNTRIES)[number];

export const CASE_STATUSES = [
  "open",
  "waiting_university",
  "verified_by_university",
  "reported",
  "closed",
] as const;
export type CaseStatus = (typeof CASE_STATUSES)[number];

export const DOC_TYPES = ["offer_letter", "scholarship_letter"] as const;
export type DocType = (typeof DOC_TYPES)[number];

export const ACCEPTED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png"] as const;
export type AcceptedMimeType = (typeof ACCEPTED_MIME_TYPES)[number];

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export const CaseCreateSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Give the case a title.")
    .max(120, "Keep the title under 120 characters."),
  destinationCountry: z.enum(DESTINATION_COUNTRIES, {
    errorMap: () => ({ message: "Choose a destination." }),
  }),
});
export type CaseCreate = z.infer<typeof CaseCreateSchema>;

export const DocumentMetaSchema = z.object({
  docType: z.enum(DOC_TYPES, {
    errorMap: () => ({ message: "Choose the type of letter." }),
  }),
});

export const CaseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  destinationCountry: z.enum(DESTINATION_COUNTRIES),
  status: z.enum(CASE_STATUSES),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Case = z.infer<typeof CaseSchema>;

export const DocumentSchema = z.object({
  id: z.string().uuid(),
  caseId: z.string().uuid(),
  docType: z.enum(DOC_TYPES),
  mimeType: z.enum(ACCEPTED_MIME_TYPES),
  originalName: z.string(),
  sizeBytes: z.number().int().positive(),
  uploadedAt: z.string(),
});
export type CaseDocument = z.infer<typeof DocumentSchema>;

export type CaseWithDocuments = Case & { documents: CaseDocument[] };
