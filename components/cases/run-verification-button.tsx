"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

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
    <div className="space-y-2">
      <Button onClick={startRun} disabled={loading}>
        {loading ? "Starting verification…" : "Run verification"}
      </Button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
