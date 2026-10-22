"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

// Account-deletion request (SPEC.md §6 "Secure account"): deletes every case,
// document and stored file the signed-in user owns, then signs them out.
// Two-step confirm so it can't be triggered by one stray click.
export function DeleteAccountButton() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onConfirm() {
    setWorking(true);
    setError(null);
    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setError(body?.message ?? "Could not delete your account. Please try again.");
        setWorking(false);
        return;
      }
      await createClient()?.auth.signOut();
      router.push("/sign-in");
      router.refresh();
    } catch {
      setError("Could not reach the server.");
      setWorking(false);
    }
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-xs text-muted-foreground underline underline-offset-2 hover:text-destructive"
      >
        Delete account
      </button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <p className="text-xs text-muted-foreground">
        This deletes all your cases, documents and findings. This cannot be undone.
      </p>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={working}
          className="text-xs text-muted-foreground underline underline-offset-2"
        >
          Cancel
        </button>
        <Button
          type="button"
          variant="outline"
          onClick={onConfirm}
          disabled={working}
          className="h-7 border-destructive px-2 text-xs text-destructive hover:bg-destructive hover:text-destructive-foreground"
        >
          {working ? "Deleting…" : "Confirm delete"}
        </Button>
      </div>
    </div>
  );
}
