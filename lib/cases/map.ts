import type {
  AcceptedMimeType,
  Case,
  CaseDocument,
  CaseStatus,
  DestinationCountry,
  DocType,
  Verdict,
} from "@/lib/schemas";

// Database rows (snake_case) as returned by PostgREST.
export type CaseRow = {
  id: string;
  title: string;
  destination_country: DestinationCountry;
  status: CaseStatus;
  latest_verdict: Verdict | null;
  created_at: string;
  updated_at: string;
};

export type DocumentRow = {
  id: string;
  case_id: string;
  doc_type: DocType;
  mime_type: AcceptedMimeType;
  original_name: string;
  size_bytes: number;
  uploaded_at: string;
};

export function toCase(row: CaseRow): Case {
  return {
    id: row.id,
    title: row.title,
    destinationCountry: row.destination_country,
    status: row.status,
    latestVerdict: row.latest_verdict ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// storage_path is intentionally not exposed to the browser.
export function toDocument(row: DocumentRow): CaseDocument {
  return {
    id: row.id,
    caseId: row.case_id,
    docType: row.doc_type,
    mimeType: row.mime_type,
    originalName: row.original_name,
    sizeBytes: row.size_bytes,
    uploadedAt: row.uploaded_at,
  };
}
