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

export const CASE_STATUS_LABELS: Record<CaseStatus, string> = {
  open: "Open",
  running: "Verification running",
  reviewed: "Reviewed",
  closed: "Closed",
};
