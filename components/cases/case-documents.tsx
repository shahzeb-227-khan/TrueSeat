import { DOC_TYPE_LABELS } from "@/lib/cases/labels";
import type { CaseDocument } from "@/lib/schemas";

export function CaseDocuments({ documents }: { documents: CaseDocument[] }) {
  return (
    <div className="rounded-[10px] border border-border-subtle bg-surface-card p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="material-symbols-outlined text-[18px] text-text-metadata">folder_open</span>
        <h2 className="font-headline text-lg text-text-headline">Uploaded documents</h2>
        <span className="ml-auto font-mono text-[11px] uppercase tracking-wider text-text-metadata">
          {documents.length} file{documents.length === 1 ? "" : "s"}
        </span>
      </div>
      {documents.length === 0 ? (
        <p className="text-sm text-text-metadata">No documents uploaded yet.</p>
      ) : (
        <ul className="divide-y divide-border-subtle">
          {documents.map((d) => (
            <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
              <span className="flex items-center gap-2 text-sm text-text-headline">
                <span className="material-symbols-outlined text-[16px] text-text-metadata">description</span>
                {d.originalName}
              </span>
              <span className="font-mono text-[11px] uppercase tracking-wider text-text-metadata">
                {DOC_TYPE_LABELS[d.docType]} · {Math.round(d.sizeBytes / 1024)} KB
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
