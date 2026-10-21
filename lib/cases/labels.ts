import type { DestinationCountry, DocType } from "@/lib/schemas";

export const DESTINATION_LABELS: Record<DestinationCountry, string> = {
  GB: "United Kingdom",
  CA: "Canada",
  US: "United States",
  OTHER: "Other country",
};

export const DOC_TYPE_LABELS: Record<DocType, string> = {
  offer_letter: "Admission offer letter",
  scholarship_letter: "Scholarship letter",
};
