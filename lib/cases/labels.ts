import type { CaseStatus, DestinationCountry, DocType } from "@/lib/schemas";

export const DESTINATION_LABELS: Record<DestinationCountry, string> = {
  GB: "United Kingdom",
  CA: "Canada",
  US: "United States",
  OTHER: "Other country",
};

export const DOC_TYPE_LABELS: Record<DocType, string> = {
  offer_letter: "Admission offer letter",
  scholarship_letter: "Scholarship letter",
  fee_receipt: "Fee receipt",
  payment_instruction: "Payment instruction",
  chat: "Consultant chat screenshot",
  email: "Email",
  other: "Other document",
};

// Matches the check constraint on cases.status (see
// supabase/migrations/20261020182044_create_cases_and_documents.sql) and
// SPEC §6 must-ship #5: "Open · Waiting for university reply · Verified by
// university · Reported · Closed".
export const CASE_STATUS_LABELS: Record<CaseStatus, string> = {
  open: "Open",
  waiting_university: "Waiting for university",
  verified_by_university: "Verified by university",
  reported: "Reported",
  closed: "Closed",
};
