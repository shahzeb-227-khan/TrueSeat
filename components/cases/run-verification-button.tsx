"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RunVerificationButton({ caseId }: { caseId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startRun() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/runs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ caseId }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.runId) {
        setError(body?.message ?? "Could not start verification. Please try again.");
        setLoading(false);
        return;
      }
      router.push(`/cases/${caseId}/results/${body.runId}`);
    } catch {
      setError("Could not reach the server. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={startRun}
        disabled={loading}
        className="flex h-11 items-center justify-center gap-2 self-start rounded-full bg-primary px-6 text-sm font-semibold text-surface-canvas shadow-[0_0_20px_rgba(16,185,129,0.15)] transition-all hover:bg-verdict-pass active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="material-symbols-outlined text-[18px]">
          {loading ? "hourglass_top" : "fact_check"}
        </span>
        {loading ? "Starting verification…" : "Run verification"}
      </button>
      {error ? (
        <p role="alert" className="text-sm text-verdict-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
