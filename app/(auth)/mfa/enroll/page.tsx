"use client";

import { useEffect, useRef, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Logo } from "@/components/brand/logo";
import { OtpInput } from "@/components/auth/otp-input";

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
  const [copied, setCopied] = useState(false);
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

  async function copySecret() {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard may be unavailable
    }
  }

  return (
    <div className="flex min-h-screen w-full flex-col justify-between bg-surface-canvas p-4 font-sans text-text-body antialiased sm:p-8">
      <div className="flex w-full items-center justify-between">
        <Logo markClassName="h-6 w-6" />
        <span className="font-mono text-[10px] uppercase tracking-widest text-text-metadata">
          Set up two-factor authentication
        </span>
      </div>

      <main className="my-8 flex w-full flex-1 items-center justify-center">
        <div className="relative w-full max-w-[480px]">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-16 left-1/2 h-32 w-80 -translate-x-1/2 rounded-full bg-primary/10 blur-[80px]"
          />
          <div className="relative w-full rounded-xl border border-border-subtle bg-surface-card p-6 shadow-2xl sm:p-9">
            <div className="mb-6 flex flex-col items-start gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded border border-border-prominent bg-surface-card-elevated text-primary">
                  <span className="material-symbols-outlined text-lg">shield_lock</span>
                </div>
                <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-text-metadata">
                  Required once per account
                </span>
              </div>
              <h1 className="font-headline text-[32px] font-normal leading-snug tracking-tight text-text-headline">
                Set up two-factor authentication
              </h1>
              <p className="font-sans text-sm text-text-metadata">
                Scan this QR code with an authenticator app (Google Authenticator, Authy, 1Password), then enter the
                6-digit code it generates.
              </p>
            </div>

            <div className="mb-6 flex flex-col items-center gap-4 rounded border border-border-subtle bg-surface-canvas p-5">
              {qr ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qr} alt="2FA QR code" className="h-48 w-48 rounded bg-white p-2" />
              ) : error ? (
                <p className="text-sm text-verdict-danger">{error}</p>
              ) : (
                <p className="text-sm text-text-metadata">Loading QR code…</p>
              )}
              {secret ? (
                <div className="flex w-full items-center justify-between gap-2 rounded border border-border-prominent bg-surface-card-elevated px-3 py-2">
                  <code className="select-all break-all font-mono text-[12px] tracking-widest text-text-headline">
                    {secret}
                  </code>
                  <button
                    type="button"
                    onClick={copySecret}
                    className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-primary hover:text-primary/80"
                  >
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
              ) : null}
              <p className="text-center text-[11px] text-text-metadata">
                Can&apos;t scan the code? Enter that key manually in your authenticator app instead.
              </p>
            </div>

            <form onSubmit={verify} className="flex flex-col gap-4">
              <OtpInput value={code} onChange={setCode} disabled={busy} />
              {error && !qr ? null : error ? (
                <p role="alert" className="text-center text-sm text-verdict-danger">
                  {error}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={busy || !factorId || code.trim().length !== 6}
                className="flex h-11 w-full items-center justify-center gap-2 rounded bg-primary text-sm font-medium text-surface-canvas shadow-[0_0_20px_rgba(16,185,129,0.15)] transition-all hover:bg-verdict-pass active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? "Verifying…" : "Verify and continue"}
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
