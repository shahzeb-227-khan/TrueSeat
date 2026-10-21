"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DOC_TYPE_LABELS } from "@/lib/cases/labels";
import { readJson } from "@/lib/cases/api";
import { DOC_TYPES, MAX_UPLOAD_BYTES, type CaseDocument } from "@/lib/schemas";

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
      setError("Files must be 10 MB or smaller.");
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
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{hasDocument ? "Add another letter" : "Upload a letter"}</CardTitle>
        <CardDescription>JPG, PNG or PDF, up to 10 MB. Files are stored privately.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="doc-type" className="text-sm font-medium">
              Type of letter
            </label>
            <select
              id="doc-type"
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {DOC_TYPES.map((t) => (
                <option key={t} value={t}>
                  {DOC_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="doc-file" className="text-sm font-medium">
              File
            </label>
            <input
              id="doc-file"
              type="file"
              accept="application/pdf,image/jpeg,image/png"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm"
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
          <Button type="submit" disabled={saving || !file}>
            {saving ? "Uploading…" : "Upload letter"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
