"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { DOC_TYPE_LABELS } from "@/lib/cases/labels";
import { readJson } from "@/lib/cases/api";
import { DOC_TYPES, MAX_UPLOAD_BYTES, type CaseDocument } from "@/lib/schemas";

const MAX_MB = Math.round(MAX_UPLOAD_BYTES / (1024 * 1024));

export function UploadLetterForm({ caseId, hasDocument }: { caseId: string; hasDocument: boolean }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<string>(DOC_TYPES[0]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file) {
      setError("Choose a file to upload.");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setError(`Files must be ${MAX_MB} MB or smaller.`);
      return;
    }
    setError(null);
    setSaving(true);
    const form = new FormData();
    form.append("file", file);
    form.append("docType", docType);
    const res = await fetch(`/api/cases/${caseId}/documents`, { method: "POST", body: form });
    const result = await readJson<{ document: CaseDocument }>(res);
    setSaving(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setFile(null);
    router.refresh();
  }

  return (
    <div className="rounded-[10px] border border-border-subtle bg-surface-card p-5 sm:p-6">
      <div className="mb-4">
        <h2 className="font-headline text-lg text-text-headline">
          {hasDocument ? "Add another document" : "Upload a document"}
        </h2>
        <p className="text-xs text-text-metadata">
          JPG, PNG, PDF or plain text, up to {MAX_MB} MB. Stored privately — only you can see it.
        </p>
      </div>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <div className="space-y-1.5">
          <label htmlFor="doc-type" className="font-mono text-[11px] uppercase tracking-wider text-text-metadata">
            Document type
          </label>
          <select
            id="doc-type"
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            className="h-11 w-full rounded border border-border-subtle bg-surface-canvas px-3 text-sm text-text-headline transition-colors hover:border-border-prominent focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {DOC_TYPES.map((t) => (
              <option key={t} value={t}>
                {DOC_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>

        <label
          htmlFor="doc-file"
          className="group flex cursor-pointer flex-col items-center justify-center rounded-[8px] border-2 border-dashed border-border-subtle bg-surface-canvas/40 p-6 text-center transition-colors hover:border-primary/50"
        >
          <span className="material-symbols-outlined mb-2 text-[24px] text-text-metadata transition-colors group-hover:text-primary">
            cloud_upload
          </span>
          <span className="text-sm font-medium text-text-headline">
            {file ? file.name : "Choose a file or drag it here"}
          </span>
          {file ? (
            <span className="mt-1 text-xs text-text-metadata">{Math.round(file.size / 1024)} KB</span>
          ) : null}
          <input
            id="doc-file"
            type="file"
            accept="application/pdf,image/jpeg,image/png,image/webp,text/plain"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="sr-only"
          />
        </label>

        {error ? (
          <p role="alert" className="text-sm text-verdict-danger">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={saving || !file}
          className="h-11 w-full rounded bg-primary text-sm font-medium text-surface-canvas shadow-[0_0_20px_rgba(16,185,129,0.15)] transition-all hover:bg-verdict-pass active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:self-start sm:px-6"
        >
          {saving ? "Uploading…" : "Upload document"}
        </button>
      </form>
    </div>
  );
}
