import { ACCEPTED_MIME_TYPES, type AcceptedMimeType } from "@/lib/schemas";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const EXTENSIONS: Record<AcceptedMimeType, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
};

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export function isAcceptedMime(value: string): value is AcceptedMimeType {
  return (ACCEPTED_MIME_TYPES as readonly string[]).includes(value);
}

export function extensionFor(mime: AcceptedMimeType): string {
  return EXTENSIONS[mime];
}

// Keep the original name for display only; trim length to the DB limit.
export function safeOriginalName(name: string): string {
  const trimmed = name.trim().slice(0, 255);
  return trimmed.length > 0 ? trimmed : "letter";
}
