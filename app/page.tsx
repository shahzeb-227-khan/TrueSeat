import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { VERDICT_LABELS } from "@/lib/schemas";
import { LandingUpload } from "@/components/landing-upload";

const VERDICT_ROWS: {
  key: keyof typeof VERDICT_LABELS;
  border: string;
  iconBg: string;
  iconColor: string;
  icon: string;
  description: string;
  directive: string;
}[] = [
  {
    key: "checks_passed",
    border: "border-l-verdict-pass",
    iconBg: "bg-verdict-pass/15",
    iconColor: "text-verdict-pass",
    icon: "check_circle",
    description:
      "The institution is in the official register we hold for that country, the sender's email domain matches the university's own domain, and the payment details match an accredited account.",
    directive: "Still confirm with the university before paying",
  },
  {
    key: "suspicious",
    border: "border-l-verdict-warning",
    iconBg: "bg-verdict-warning/15",
    iconColor: "text-verdict-warning",
    icon: "warning",
    description:
      "One or more inconsistencies found — a mismatched amount, a payee that doesn't match the institution, or a red flag quoted directly from your documents.",
    directive: "Pause and verify independently",
  },
  {
    key: "high_risk",
    border: "border-l-verdict-danger",
    iconBg: "bg-verdict-danger/15",
    iconColor: "text-verdict-danger",
    icon: "gpp_bad",
    description:
      "A confirmed red flag — payment requested to a personal or wallet account, a lookalike domain, or a guaranteed-admission claim quoted from your documents.",
    directive: "Do not pay",
  },
  {
    key: "could_not_verify",
    border: "border-l-verdict-indeterminate border-dashed",
    iconBg: "bg-verdict-indeterminate/20",
    iconColor: "text-text-metadata",
    icon: "help_outline",
    description:
      "The institution isn't in our register, the document was unreadable, or the destination country isn't covered yet. This is never treated as a pass.",
    directive: "Upload a clearer copy or confirm directly",
  },
];

const CHECK_CARDS = [
  {
    index: "01",
    tag: "Official register",
    icon: "verified",
    title: "Institution register check",
    body: "Checks the institution name against TrueSeat's own register of accredited UK, Canadian, and US institutions, using trigram matching to catch typos and near-misses.",
  },
  {
    index: "02",
    tag: "Sender domain",
    icon: "dns",
    title: "Sender domain match",
    body: "Compares the sender email domain in your documents against the institution's official domain on record, to catch lookalike or spoofed addresses.",
  },
  {
    index: "03",
    tag: "Payment details",
    icon: "account_balance",
    title: "Payment route check",
    body: "Flags payment requests to personal names, mobile wallets, or accounts that don't match the institution — a common pattern in scholarship and offer-letter scams.",
  },
  {
    index: "04",
    tag: "Cross-document",
    icon: "difference",
    title: "Cross-document consistency",
    body: "Compares amounts, names, and dates across every document you upload for the same case, and quotes anything that doesn't add up.",
  },
];

export default async function Home() {
  const supabase = createServerSupabase();
  if (supabase) {
    const { data } = await supabase.auth.getUser();
    if (data.user) redirect("/cases");
  }

  return (
    <div className="min-h-screen bg-surface-canvas font-sans text-text-body antialiased">
      {/* Header */}
      <header className="fixed top-0 z-50 w-full border-b border-border-prominent bg-surface-canvas/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-subtle bg-surface-card text-primary">
              <span className="material-symbols-outlined text-[18px]">verified_user</span>
            </div>
            <span className="font-headline text-[22px] tracking-tight text-text-headline">TrueSeat</span>
          </div>
          <nav className="hidden items-center gap-1 md:flex">
            <Link
              href="/sign-up"
              className="rounded-lg border border-border-subtle bg-surface-card px-3 py-1.5 text-sm font-medium text-text-headline"
            >
              Verify an offer
            </Link>
            <Link
              href="/guide"
              className="rounded-lg px-3 py-1.5 text-sm text-text-body transition-colors hover:bg-surface-card-elevated hover:text-text-headline"
            >
              Scam alerts &amp; FIA guide
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="hidden text-sm text-text-body transition-colors hover:text-text-headline sm:block"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-surface-canvas shadow-sm transition-colors hover:bg-verdict-pass"
            >
              <span>Verify a document</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="w-full pt-16">
        {/* Hero */}
        <section className="relative w-full overflow-hidden border-b border-border-prominent pb-20 pt-16">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: "radial-gradient(#F8FAFC 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />
          <div className="relative mx-auto flex max-w-6xl flex-col items-center px-4 text-center sm:px-6 lg:px-8">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border-subtle bg-surface-card px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="font-sans text-[11px] font-medium uppercase tracking-[0.14em] text-text-metadata">
                Free document check
              </span>
              <span className="text-border-prominent">•</span>
              <span className="font-urdu text-sm text-primary">مفت تصدیق</span>
            </div>

            <h1 className="max-w-4xl font-headline text-[40px] font-light leading-[1.08] tracking-[-0.025em] text-text-headline sm:text-[56px] lg:text-[68px]">
              Check your university offer before you{" "}
              <span className="font-normal italic text-primary">pay any deposit</span>.
            </h1>
            <p className="font-urdu mb-4 mt-3 text-lg text-text-metadata sm:text-xl" dir="rtl">
              فیس ادا کرنے سے پہلے اپنے داخلہ لیٹر کی تصدیق کریں
            </p>
            <p className="mb-10 max-w-2xl font-sans text-[15px] leading-relaxed text-text-body sm:text-[17px]">
              Fraudulent admission letters, spoofed university domains, and third-party payment requests target
              Pakistani students every year. TrueSeat checks your documents against our institution register, sender
              domain, and payment details — then gives you a clear verdict in English and Urdu.
            </p>

            {/* Tool card */}
            <div className="relative w-full max-w-2xl rounded-[10px] border border-border-subtle bg-surface-card p-5 text-left shadow-2xl sm:p-6">
              <div className="mb-5 flex items-center justify-between border-b border-border-subtle pb-3">
                <div className="flex items-center gap-2 rounded-lg border border-border-prominent bg-surface-card-elevated px-3 py-1.5 text-xs font-medium text-text-headline">
                  <span className="material-symbols-outlined text-[16px] text-primary">upload_file</span>
                  Upload letter
                </div>
                <div className="flex items-center gap-1.5 font-mono text-[11px] text-text-metadata">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>Encrypted, private storage</span>
                </div>
              </div>

              <LandingUpload />

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border-subtle pt-3 text-xs text-text-metadata">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-text-metadata">Covers:</span>
                  <span>United Kingdom</span>
                  <span>•</span>
                  <span>Canada</span>
                  <span>•</span>
                  <span>United States</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Verdict system */}
        <section className="w-full border-b border-border-prominent py-20">
          <div className="mx-auto max-w-5xl space-y-10 px-4 sm:px-6 lg:px-8">
            <div className="space-y-2 text-left">
              <div className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-text-metadata">
                Verdict system
              </div>
              <h2 className="font-headline text-3xl font-normal tracking-tight text-text-headline sm:text-4xl">
                Four possible verdicts — never a loud false &quot;all clear&quot;
              </h2>
              <p className="max-w-2xl font-sans text-sm text-text-body">
                Every document gets one of four verdicts, computed by TrueSeat&apos;s own rules — not by the AI. The
                AI only reads documents and explains the findings; it never decides the verdict.
              </p>
            </div>

            <div className="overflow-hidden rounded-[10px] border border-border-subtle bg-surface-card">
              <div className="hidden grid-cols-12 gap-4 border-b border-border-subtle px-6 py-3 font-mono text-[11px] uppercase tracking-wider text-text-metadata md:grid">
                <div className="col-span-4">Verdict</div>
                <div className="col-span-5">What it means</div>
                <div className="col-span-3 text-right">What to do</div>
              </div>
              <div className="divide-y divide-border-subtle">
                {VERDICT_ROWS.map((row) => {
                  const label = VERDICT_LABELS[row.key];
                  return (
                    <div
                      key={row.key}
                      className={`grid grid-cols-1 items-center gap-3 border-l-[3px] bg-surface-card p-5 transition-colors hover:bg-surface-card-elevated sm:px-6 md:grid-cols-12 md:gap-4 ${row.border}`}
                    >
                      <div className="col-span-4 flex items-center gap-3">
                        <div
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${row.iconBg} ${row.iconColor}`}
                        >
                          <span className="material-symbols-outlined text-[16px]">{row.icon}</span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-text-headline">
                            {label.emoji} {label.en}
                          </div>
                          <div className="font-urdu text-xs text-text-metadata" dir="rtl">
                            {label.ur}
                          </div>
                        </div>
                      </div>
                      <div className="col-span-5 text-xs leading-relaxed text-text-body">{row.description}</div>
                      <div className="col-span-3 md:text-right">
                        <span className="inline-flex items-center gap-1.5 rounded bg-surface-card-elevated px-2.5 py-1 font-mono text-[11px] text-text-body">
                          {row.directive}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <p className="font-sans text-xs text-text-metadata">
              Bilingual English and Urdu explanations are generated with every result.
            </p>
          </div>
        </section>

        {/* How it works */}
        <section className="w-full border-b border-border-prominent py-20">
          <div className="mx-auto max-w-5xl space-y-12 px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl space-y-2 text-center">
              <div className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-text-metadata">
                Verification workflow
              </div>
              <h2 className="font-headline text-3xl font-normal tracking-tight text-text-headline sm:text-4xl">
                How verification works
              </h2>
              <p className="font-sans text-sm text-text-body">
                Three stages, run automatically once you upload your documents.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {[
                {
                  n: "1",
                  title: "Upload your documents",
                  body: "Add your admission letter, fee invoice, or a screenshot of a consultant's message — image, PDF, or plain text.",
                  stage: "STAGE 01",
                  tag: "IMAGE / PDF READING",
                },
                {
                  n: "2",
                  title: "Register, domain & payment checks",
                  body: "We check the institution against our register, match the sender domain, and check the payment details — all computed by code, not AI.",
                  stage: "STAGE 02",
                  tag: "REGISTRY + DOMAIN",
                },
                {
                  n: "3",
                  title: "Clear verdict & next steps",
                  body: "Get a verdict with quoted evidence, a plain-language explanation in English and Urdu, a ready-to-send verification email, and an FIA complaint draft if needed.",
                  stage: "STAGE 03",
                  tag: "RESULT",
                },
              ].map((step) => (
                <div
                  key={step.n}
                  className="flex flex-col justify-between rounded-[10px] border border-border-subtle bg-surface-card p-6"
                >
                  <div>
                    <div className="mb-5 flex h-9 w-9 items-center justify-center rounded-full border border-border-prominent bg-surface-card-elevated font-mono text-sm font-medium text-text-headline">
                      {step.n}
                    </div>
                    <h3 className="mb-2 font-headline text-xl font-normal text-text-headline">{step.title}</h3>
                    <p className="font-sans text-xs leading-relaxed text-text-body">{step.body}</p>
                  </div>
                  <div className="mt-6 flex items-center justify-between border-t border-border-subtle pt-3 font-mono text-[11px] text-text-metadata">
                    <span>{step.stage}</span>
                    <span>{step.tag}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What TrueSeat checks */}
        <section className="w-full border-b border-border-prominent py-20">
          <div className="mx-auto max-w-5xl space-y-10 px-4 sm:px-6 lg:px-8">
            <div className="space-y-2 text-left">
              <div className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-text-metadata">
                What we check
              </div>
              <h2 className="font-headline text-3xl font-normal tracking-tight text-text-headline sm:text-4xl">
                What TrueSeat checks — and what it doesn&apos;t
              </h2>
              <p className="max-w-2xl font-sans text-sm text-text-body">
                Plain, code-level criteria, so you know exactly what a verdict is and isn&apos;t based on.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {CHECK_CARDS.map((c) => (
                <div key={c.index} className="space-y-3 rounded-[10px] border border-border-subtle bg-surface-card p-5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs uppercase tracking-wider text-text-metadata">
                      {c.index} • {c.tag}
                    </span>
                    <span className="material-symbols-outlined text-[18px] text-primary">{c.icon}</span>
                  </div>
                  <h3 className="font-headline text-lg text-text-headline">{c.title}</h3>
                  <p className="font-sans text-xs leading-relaxed text-text-body">{c.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Honesty / independence notice */}
        <section className="w-full border-b border-border-prominent py-10">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-start justify-between gap-4 rounded-[10px] border border-border-subtle bg-surface-card p-4 md:flex-row md:items-center">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined mt-0.5 text-[20px] text-text-metadata">verified_user</span>
                <div className="space-y-0.5">
                  <div className="text-xs font-medium text-text-headline">Independent — not an official authority</div>
                  <p className="max-w-3xl text-xs leading-relaxed text-text-metadata">
                    TrueSeat is not affiliated with any government body, embassy, or university, and does not issue
                    visas or accept admission deposits. A &quot;checks passed&quot; result is not a guarantee — always
                    confirm directly with the university before paying.
                  </p>
                </div>
              </div>
              <Link
                href="/guide"
                className="flex items-center gap-1 whitespace-nowrap font-mono text-xs text-primary hover:underline"
              >
                Scam alerts &amp; FIA guide <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="w-full py-20 text-center">
          <div className="mx-auto max-w-3xl space-y-6 px-4 sm:px-6 lg:px-8">
            <h2 className="font-headline text-3xl font-light tracking-tight text-text-headline sm:text-5xl">
              Never send a tuition deposit <span className="font-normal italic text-primary">without checking first</span>.
            </h2>
            <p className="mx-auto max-w-xl font-sans text-sm text-text-body sm:text-base">
              Create a free account and upload your documents for a verdict in minutes.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-xs font-semibold text-surface-canvas shadow-sm transition-colors hover:bg-verdict-pass"
              >
                <span className="material-symbols-outlined text-[16px]">upload_file</span>
                <span>Create a free account</span>
              </Link>
              <Link
                href="/sign-in"
                className="rounded-full border border-border-subtle bg-surface-card px-5 py-2.5 text-xs font-medium text-text-headline transition-colors hover:bg-surface-card-elevated"
              >
                Sign in
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full border-t border-border-prominent text-xs text-text-metadata">
        <div className="mx-auto max-w-5xl space-y-8 px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div className="space-y-2 md:col-span-1">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded border border-border-subtle bg-surface-card text-primary">
                  <span className="material-symbols-outlined text-[14px]">verified_user</span>
                </div>
                <span className="font-headline text-lg text-text-headline">TrueSeat</span>
              </div>
              <p className="text-xs leading-relaxed text-text-metadata">
                A safety check for Pakistani students before paying a university offer.
              </p>
            </div>
            <div>
              <div className="mb-2.5 font-mono text-[11px] uppercase tracking-wider text-text-metadata">
                Verification
              </div>
              <ul className="space-y-1.5">
                <li>
                  <Link href="/sign-up" className="transition-colors hover:text-text-body">
                    Verify an offer
                  </Link>
                </li>
                <li>
                  <Link href="/cases" className="transition-colors hover:text-text-body">
                    My cases
                  </Link>
                </li>
                <li>
                  <Link href="/registries" className="transition-colors hover:text-text-body">
                    Official registries
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <div className="mb-2.5 font-mono text-[11px] uppercase tracking-wider text-text-metadata">
                Safety
              </div>
              <ul className="space-y-1.5">
                <li>
                  <Link href="/guide" className="transition-colors hover:text-text-body">
                    Scam alerts &amp; FIA guide
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <div className="mb-2.5 font-mono text-[11px] uppercase tracking-wider text-text-metadata">
                Account
              </div>
              <ul className="space-y-1.5">
                <li>
                  <Link href="/sign-in" className="transition-colors hover:text-text-body">
                    Sign in
                  </Link>
                </li>
                <li>
                  <Link href="/sign-up" className="transition-colors hover:text-text-body">
                    Create account
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col items-center justify-between gap-3 border-t border-border-subtle pt-6 font-mono text-[11px] sm:flex-row">
            <div>TrueSeat — built for Pakistani students</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
