"use client";

import { useEffect, useRef, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

export default function EnrollPage() {
  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  );
  const [factorId, setFactorId] = useState("");
  const [qr, setQr] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    (async () => {
      const { data: list } = await supabase.auth.mfa.listFactors();
      const stale = (list?.all ?? []).filter(
        (f) => f.factor_type === "totp" && f.status === "unverified"
      );
      for (const f of stale) {
        await supabase.auth.mfa.unenroll({ factorId: f.id });
      }
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "TrueSeat " + Date.now(),
      });
      if (error || !data) {
        setError(error?.message ?? "Could not start 2FA setup.");
        return;
      }
      setFactorId(data.id);
      setQr(data.totp.qr_code);
      setSecret(data.totp.secret);
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
      <h1 className="text-2xl font-semibold">Set up 2FA</h1>
      <p className="mt-1 text-sm text-gray-600">
        Scan this QR code with an authenticator app (Google Authenticator, Authy), then enter the 6-digit code.
      </p>
      {qr ? (
        <img src={qr} alt="2FA QR code" className="mx-auto my-4 h-48 w-48" />
      ) : (
        <p className="my-4 text-sm text-gray-500">Loading QR code...</p>
      )}
      {secret && (
        <p className="break-all text-xs text-gray-500">
          Can&apos;t scan? Enter this key manually: {secret}
        </p>
      )}
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
          {busy ? "Verifying..." : "Verify and continue"}
        </button>
      </form>
      <button onClick={signOut} className="mt-4 text-sm text-gray-500 underline">
        Sign out
      </button>
    </main>
  );
}
