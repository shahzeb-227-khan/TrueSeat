import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { toDocument, type DocumentRow } from "@/lib/cases/map";
import {
  extensionFor,
  isAcceptedMime,
  isUuid,
  safeOriginalName,
} from "@/lib/cases/upload";
import { DocumentMetaSchema, MAX_UPLOAD_BYTES, type AcceptedMimeType } from "@/lib/schemas";

const BUCKET = "evidence";

// POST /api/cases/[id]/documents: upload one letter (multipart: file, docType).
// Storage path is {user_id}/{case_id}/{document_id}.{ext}; the file is removed if the row insert fails.
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = createServerSupabase();
  if (!supabase) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!isUuid(params.id)) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // The case must be visible to this user (RLS); otherwise it is treated as not found.
  const { data: caseRow } = await supabase
    .from("cases")
    .select("id")
    .eq("id", params.id)
    .maybeSingle();
  if (!caseRow) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "invalid_input", message: "Choose a file to upload." }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "invalid_input", message: "The file is empty." }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "too_large", message: "Files must be 10 MB or smaller." }, { status: 413 });
  }
  if (!isAcceptedMime(file.type)) {
    return NextResponse.json(
      { error: "unsupported_type", message: "Upload a JPG, PNG or PDF file." },
      { status: 415 }
    );
  }
  const meta = DocumentMetaSchema.safeParse({ docType: form?.get("docType") });
  if (!meta.success) {
    return NextResponse.json({ error: "invalid_input", message: meta.error.issues[0]?.message }, { status: 400 });
  }

  const mime: AcceptedMimeType = file.type;
  const documentId = crypto.randomUUID();
  const storagePath = `${auth.user.id}/${params.id}/${documentId}.${extensionFor(mime)}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, { contentType: mime, upsert: false });
  if (uploadError) return NextResponse.json({ error: "storage_error" }, { status: 500 });

  const { data, error } = await supabase
    .from("documents")
    .insert({
      id: documentId,
      case_id: params.id,
      user_id: auth.user.id,
      storage_path: storagePath,
      mime_type: mime,
      doc_type: meta.data.docType,
      original_name: safeOriginalName(file.name),
      size_bytes: file.size,
    })
    .select("id, case_id, doc_type, mime_type, original_name, size_bytes, uploaded_at")
    .single();

  if (error || !data) {
    // Keep storage and the database in step: remove the orphaned object.
    await supabase.storage.from(BUCKET).remove([storagePath]);
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  return NextResponse.json({ document: toDocument(data as DocumentRow) }, { status: 201 });
}
