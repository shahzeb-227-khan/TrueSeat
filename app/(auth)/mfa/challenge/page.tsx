"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

export default function ChallengePage() {
  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  );
  const [factorId, setFactorId] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.mfa.listFactors();
      const factor = data?.totp?.[0];
      if (!factor) {
        window.location.href = "/mfa/enroll";
        return;
      }
      setFactorId(factor.id);
    })();
  }, [supabase]);

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const { data: ch, error: e1 } = await supabase.auth.mfa.challenge({ factorId });
    if (e1 || !ch) {
      setError(e1?.message ?? "Challenge failed.");
      setBusy(false);
      return;
    }
    const { error: e2 } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: ch.id,
      code: code.trim(),
    });
    if (e2) {
      setError(e2.message);
      setBusy(false);
      return;
    }
    window.location.href = "/cases";
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/sign-in";
  }

  return (
    <main className="mx-auto mt-16 max-w-md rounded-lg border bg-white p-6">
      <h1 className="text-2xl font-semibold">Two-factor check</h1>
      <p className="mt-1 text-sm text-gray-600">
        Enter the 6-digit code from your authenticator app.
      </p>
      <form onSubmit={verify} className="mt-4 space-y-3">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          inputMode="numeric"
          maxLength={6}
          placeholder="6-digit code"
          className="w-full rounded-md border px-3 py-2"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={busy || !factorId || code.trim().length !== 6}
          className="w-full rounded-md bg-slate-900 px-3 py-2 text-white disabled:opacity-50"
        >
          {busy ? "Verifying..." : "Verify"}
        </button>
      </form>
      <button onClick={signOut} className="mt-4 text-sm text-gray-500 underline">
        Sign out
      </button>
    </main>
  );
}
