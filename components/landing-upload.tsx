"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

// Anonymous visitors can't actually upload (accounts + mandatory 2FA are
// required before any file reaches storage — see SPEC.md). This still gives
// them a real file picker on the landing page itself: choosing a file takes
// them straight into sign-up, and the file they picked carries over once
// they're on /cases, instead of silently discarding it.
export function LandingUpload() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  function handleFile(file: File | null) {
    if (!file) return;
    setFileName(file.name);
    try {
      sessionStorage.setItem("trueseat:pending-upload-name", file.name);
    } catch {
      // sessionStorage may be unavailable; not essential to the flow
    }
    router.push("/sign-up");
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        handleFile(e.dataTransfer.files?.[0] ?? null);
      }}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
      }}
      className={`group flex cursor-pointer flex-col items-center justify-center rounded-[8px] border-2 border-dashed p-8 text-center transition-colors sm:p-10 ${
        dragOver ? "border-primary bg-surface-canvas/60" : "border-border-subtle bg-surface-canvas/40 hover:border-primary/50"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/jpeg,image/png,image/webp,text/plain"
        className="sr-only"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-border-subtle bg-surface-card-elevated text-text-body transition-colors group-hover:border-primary/30 group-hover:text-primary">
        <span className="material-symbols-outlined text-[24px]">cloud_upload</span>
      </div>
      <div className="mb-1 text-sm font-medium text-text-headline">
        {fileName ? fileName : "Choose a file or drag it here"}
      </div>
      <div className="mb-4 max-w-sm text-xs text-text-metadata">
        Accepts PDF, JPG, PNG and plain text — up to 15MB per file. You&apos;ll create a free account (with 2FA) on
        the next step before anything is uploaded.
      </div>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-surface-canvas shadow-sm transition-colors group-hover:bg-verdict-pass">
        <span className="material-symbols-outlined text-[16px]">add</span>
        <span>{fileName ? "Continue to create account" : "Select a file to get started"}</span>
      </span>
    </div>
  );
}
