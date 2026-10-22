"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Logo } from "@/components/brand/logo";
import { OtpInput } from "@/components/auth/otp-input";

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
    <div className="flex min-h-screen w-full flex-col justify-between bg-surface-canvas p-4 font-sans text-text-body antialiased sm:p-8">
      <div className="flex w-full items-center justify-between">
        <Logo markClassName="h-6 w-6" />
        <span className="font-mono text-[10px] uppercase tracking-widest text-text-metadata">
          Two-factor check
        </span>
      </div>

      <main className="my-8 flex w-full flex-1 items-center justify-center">
        <div className="relative w-full max-w-[420px]">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-16 left-1/2 h-32 w-80 -translate-x-1/2 rounded-full bg-primary/10 blur-[80px]"
          />
          <div className="relative w-full rounded-xl border border-border-subtle bg-surface-card p-6 shadow-2xl sm:p-9">
            <div className="mb-7 flex flex-col items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded border border-border-prominent bg-surface-card-elevated text-primary">
                <span className="material-symbols-outlined text-lg">shield_lock</span>
              </div>
              <h1 className="font-headline text-[28px] font-normal leading-snug tracking-tight text-text-headline">
                Enter your code
              </h1>
              <p className="font-sans text-sm text-text-metadata">
                Open your authenticator app and enter the current 6-digit code.
              </p>
            </div>

            <form onSubmit={verify} className="flex flex-col gap-5">
              <OtpInput value={code} onChange={setCode} disabled={busy} />
              {error ? (
                <p role="alert" className="text-center text-sm text-verdict-danger">
                  {error}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={busy || !factorId || code.trim().length !== 6}
                className="flex h-11 w-full items-center justify-center gap-2 rounded bg-primary text-sm font-medium text-surface-canvas shadow-[0_0_20px_rgba(16,185,129,0.15)] transition-all hover:bg-verdict-pass active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? "Verifying…" : "Verify"}
              </button>
            </form>

            <button
              onClick={signOut}
              className="mt-6 w-full text-center font-mono text-[11px] uppercase tracking-wider text-text-metadata underline-offset-2 hover:text-text-headline hover:underline"
            >
              Sign out
            </button>
          </div>
        </div>
      </main>

      <div className="flex w-full flex-col items-center justify-between gap-2 text-center font-mono text-[10px] uppercase tracking-widest text-text-metadata sm:flex-row">
        <span>TrueSeat</span>
        <span>Built for Pakistani students</span>
      </div>
    </div>
  );
}
