import { AppShell } from "@/components/app-shell";
import { createServerSupabase } from "@/lib/supabase/server";

type Pattern = {
  severity: "high" | "medium";
  icon: string;
  tagEn: string;
  tagUr: string;
  title: string;
  description: string;
  lookFor: string[];
  reality: string;
};

const PATTERNS: Pattern[] = [
  {
    severity: "high",
    icon: "timer_off",
    tagEn: "Urgent deadline",
    tagUr: "ہنگامی ڈیڈلائن",
    title: "\"Pay in 24–48 hours or lose your seat\"",
    description:
      "A message claims your offer or seat will be cancelled unless a deposit is wired immediately, often to an account that isn't the university's own.",
    lookFor: [
      "Extreme time pressure with threats of cancellation",
      "Payment requested to a personal name, a \"consultancy\" account, or an account in a different country from the university",
      "Request to use cash, a wallet app, or an informal transfer service",
    ],
    reality:
      "Genuine universities give realistic payment windows (typically weeks, not hours) and only accept fees through their own official payment portal or direct bank transfer to the institution itself — never to an agent's personal or company account.",
  },
  {
    severity: "medium",
    icon: "alternate_email",
    tagEn: "Lookalike sender",
    tagUr: "جعلی ای میل ایڈریس",
    title: "Admissions emails from a free or lookalike domain",
    description:
      "The offer letter looks genuine, but the email it arrived from doesn't actually belong to the university — it's a free webmail address, or a domain that's spelled slightly differently from the real one.",
    lookFor: [
      "Sender address on Gmail, Yahoo, Outlook or similar free email services",
      "A domain with extra words, hyphens, or a different suffix than the university's real site (e.g. \"-admissions\" added, or .org instead of .ac.uk)",
      "Reply-to address that differs from the sending address",
    ],
    reality:
      "Always check the university's real domain on its own official website, and verify independently — don't just trust the letter. TrueSeat checks sender domains against each institution's known official domains during verification.",
  },
  {
    severity: "high",
    icon: "payments",
    tagEn: "Payment redirection",
    tagUr: "رقم کی غلط منتقلی",
    title: "Fee invoice doesn't match the university's own payment details",
    description:
      "The offer letter is for a real, accredited university, but a separate \"fee voucher\" or invoice attached to it directs payment somewhere else entirely — often a different country or an intermediary company.",
    lookFor: [
      "Recipient name on the invoice isn't the university itself",
      "Bank country doesn't match where the university is based",
      "Instruction to pay an \"agent\", \"facilitation fee\", or deposit before any official payment link is given",
    ],
    reality:
      "Universities that accept international fees usually do so only via their own named payment portal (e.g. Flywire, Convera) or a bank account in the university's own name. If in doubt, contact the university's admissions office directly using contact details from their own website — not the ones on the document.",
  },
  {
    severity: "medium",
    icon: "military_tech",
    tagEn: "Guaranteed outcome",
    tagUr: "ضمانت شدہ نتیجہ",
    title: "\"100% guaranteed visa\" or \"guaranteed scholarship\"",
    description:
      "A consultant or agent claims to have special access, quotas, or connections that guarantee admission, a scholarship, or visa approval — something no legitimate university or visa authority can promise.",
    lookFor: [
      "Claims of insider access to embassy or university staff",
      "Scholarships offered automatically, with no application or interview",
      "Pressure to pay an upfront \"guarantee fee\"",
    ],
    reality:
      "No government visa office or university sells guaranteed outcomes. Scholarships go through a documented application and review process. Treat any guarantee claim as a serious warning sign.",
  },
  {
    severity: "medium",
    icon: "description",
    tagEn: "Inconsistent documents",
    tagUr: "دستاویزات میں تضاد",
    title: "Names, dates or amounts don't match across documents",
    description:
      "Small inconsistencies between your offer letter, fee receipt, and any correspondence — a different spelling of your name, a tuition amount that doesn't match, or dates that don't line up.",
    lookFor: [
      "Student name spelled differently across documents",
      "Tuition or deposit amount changes between documents",
      "Issue or deadline dates that contradict each other",
    ],
    reality:
      "Genuine institutional paperwork is internally consistent. Any mismatch is worth double-checking directly with the institution before acting on it.",
  },
];

export default async function GuidePage() {
  const supabase = createServerSupabase();
  const userEmail = supabase ? (await supabase.auth.getUser()).data.user?.email ?? null : null;

  return (
    <AppShell userEmail={userEmail}>
      {/* Header */}
      <section className="mb-8 rounded-xl border border-border-subtle bg-surface-card p-6 sm:p-8">
        <span className="font-mono text-[11px] uppercase tracking-widest text-text-metadata">
          Stay safe
        </span>
        <h1 className="mt-1 font-headline text-3xl font-light tracking-tight text-text-headline">
          Scam patterns &amp; how to get help
        </h1>
        <p dir="rtl" className="mt-1 font-urdu text-lg text-text-metadata">
          فراڈ کے عام طریقے اور مدد حاصل کرنے کا طریقہ
        </p>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-body">
          These are the patterns TrueSeat&apos;s checks are built to look for. None of this requires taking our
          word for it — every point below can be verified independently with the university or the relevant
          government agency.
        </p>
      </section>

      {/* Patterns */}
      <section className="mb-10 flex flex-col gap-4">
        <h2 className="font-headline text-xl font-normal text-text-headline">Common patterns to watch for</h2>
        {PATTERNS.map((p) => (
          <article
            key={p.title}
            className={`flex flex-col gap-3 rounded-lg border border-border-subtle border-l-4 bg-surface-card p-5 sm:p-6 ${
              p.severity === "high" ? "border-l-verdict-danger" : "border-l-verdict-warning"
            }`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded border px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider ${
                  p.severity === "high"
                    ? "border-verdict-danger/30 bg-verdict-danger/15 text-[#FDA4AF]"
                    : "border-verdict-warning/30 bg-verdict-warning/15 text-verdict-warning"
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">{p.icon}</span>
                {p.tagEn}
              </span>
              <span dir="rtl" className="font-urdu text-xs text-text-metadata">
                {p.tagUr}
              </span>
            </div>
            <h3 className="font-headline text-lg font-normal text-text-headline">{p.title}</h3>
            <p className="text-sm leading-relaxed text-text-body">{p.description}</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded border border-border-subtle bg-surface-canvas p-3">
                <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-text-metadata">
                  Look for
                </span>
                <ul className="list-inside list-disc space-y-1 text-xs text-text-body">
                  {p.lookFor.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded border border-verdict-pass/20 bg-surface-canvas p-3">
                <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-verdict-pass">
                  What's actually true
                </span>
                <p className="text-xs leading-relaxed text-text-body">{p.reality}</p>
              </div>
            </div>
          </article>
        ))}
      </section>

      {/* If you've already paid or shared details */}
      <section className="mb-10 flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface-card p-6 sm:p-8">
        <h2 className="font-headline text-xl font-normal text-text-headline">
          If you've already sent money or shared documents
        </h2>
        <ol className="flex flex-col gap-3 text-sm leading-relaxed text-text-body">
          <li className="flex gap-3">
            <span className="font-mono text-primary">01</span>
            <span>
              Stop all further payments immediately. Don&apos;t send more money to try to "fix" the situation.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="font-mono text-primary">02</span>
            <span>
              Keep every message, email and receipt — don&apos;t delete anything. Screenshots with visible
              timestamps help.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="font-mono text-primary">03</span>
            <span>
              Contact your bank immediately to ask about reversing or freezing the transfer — the sooner you report
              it, the better the chance of recovery.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="font-mono text-primary">04</span>
            <span>
              Report it to FIA&apos;s Cyber Crime Wing (contact details below) and, separately, email the
              university&apos;s official admissions office directly using contact details from their own website.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="font-mono text-primary">05</span>
            <span>
              If you ran a verification on this case in TrueSeat, the results page gives you a ready-to-send
              verification email and FIA complaint draft you can use as a starting point.
            </span>
          </li>
        </ol>
      </section>

      {/* Report it */}
      <section className="rounded-xl border border-border-subtle bg-surface-card p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded border border-verdict-danger/30 bg-verdict-danger/15 text-verdict-danger">
            <span className="material-symbols-outlined text-[22px]">emergency</span>
          </div>
          <div>
            <h2 className="font-headline text-xl font-normal text-text-headline">
              FIA Cyber Crime Wing (Pakistan)
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-text-body">
              The Federal Investigation Agency's Cyber Crime Wing handles reports of online fraud, including
              education and visa scams.
            </p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <a
            href="tel:1991"
            className="flex items-center gap-3 rounded border border-border-subtle bg-surface-canvas p-4 transition-colors hover:border-primary/40"
          >
            <span className="material-symbols-outlined text-[20px] text-primary">phone_in_talk</span>
            <div>
              <p className="font-mono text-base font-semibold text-text-headline">1991</p>
              <p className="font-mono text-[11px] text-text-metadata">National helpline</p>
            </div>
          </a>
          <a
            href="tel:051111345786"
            className="flex items-center gap-3 rounded border border-border-subtle bg-surface-canvas p-4 transition-colors hover:border-primary/40"
          >
            <span className="material-symbols-outlined text-[20px] text-primary">call</span>
            <div>
              <p className="font-mono text-base font-semibold text-text-headline">051-111-345-786</p>
              <p className="font-mono text-[11px] text-text-metadata">FIA helpline</p>
            </div>
          </a>
          <a
            href="https://complaint.fia.gov.pk/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded border border-border-subtle bg-surface-canvas p-4 transition-colors hover:border-primary/40"
          >
            <span className="material-symbols-outlined text-[20px] text-primary">open_in_new</span>
            <div>
              <p className="text-sm font-medium text-text-headline">Online complaint portal</p>
              <p className="font-mono text-[11px] text-text-metadata">complaint.fia.gov.pk</p>
            </div>
          </a>
        </div>
        <p className="mt-4 text-xs text-text-metadata">
          Email: <a href="mailto:complaints@fia.gov.pk" className="text-primary hover:underline">complaints@fia.gov.pk</a>.
          Outside Pakistan, report the fraud to your own country&apos;s equivalent agency and to your bank as well.
        </p>
      </section>
    </AppShell>
  );
}
