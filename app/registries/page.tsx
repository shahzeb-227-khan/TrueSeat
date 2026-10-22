import { AppShell } from "@/components/app-shell";
import { DESTINATION_LABELS } from "@/lib/cases/labels";
import { createServerSupabase } from "@/lib/supabase/server";
import type { DestinationCountry } from "@/lib/schemas";

const COUNTRIES: DestinationCountry[] = ["GB", "CA", "US"];

const OFFICIAL_LINKS: { country: DestinationCountry; label: string; url: string }[] = [
  {
    country: "GB",
    label: "UK Register of Licensed Sponsors (gov.uk)",
    url: "https://www.gov.uk/government/publications/register-of-licensed-sponsors-students",
  },
  {
    country: "CA",
    label: "Canada's Designated Learning Institutions list (IRCC)",
    url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit/prepare/designated-learning-institutions-list.html",
  },
  {
    country: "US",
    label: "US SEVP-certified school search (ICE)",
    url: "https://www.ice.gov/sevis/schools",
  },
];

type InstitutionRow = {
  id: string;
  name: string;
  country: DestinationCountry;
  registry_id: string | null;
  registry_status: string | null;
};

export default async function RegistriesPage({
  searchParams,
}: {
  searchParams: { q?: string; country?: string };
}) {
  const supabase = createServerSupabase();
  const userEmail = supabase ? (await supabase.auth.getUser()).data.user?.email ?? null : null;

  const q = (searchParams.q ?? "").trim();
  const country = (searchParams.country ?? "ALL").toUpperCase();

  let rows: InstitutionRow[] = [];
  let unavailable = false;

  if (supabase) {
    let query = supabase.from("institutions").select("id, name, country, registry_id, registry_status");
    if (q) query = query.ilike("name", `%${q}%`);
    if (country !== "ALL" && COUNTRIES.includes(country as DestinationCountry)) {
      query = query.eq("country", country);
    }
    const { data, error } = await query.order("name").limit(50);
    if (error) {
      unavailable = true;
    } else {
      rows = (data as InstitutionRow[]) ?? [];
    }
  } else {
    unavailable = true;
  }

  return (
    <AppShell userEmail={userEmail}>
      {/* Header */}
      <section className="mb-8 rounded-xl border border-border-subtle bg-surface-card p-6 sm:p-8">
        <span className="font-mono text-[11px] uppercase tracking-widest text-text-metadata">
          Reference data
        </span>
        <h1 className="mt-1 font-headline text-3xl font-light tracking-tight text-text-headline">
          Official registries we check against
        </h1>
        <p dir="rtl" className="mt-1 font-urdu text-lg text-text-metadata">
          سرکاری تصدیق شدہ یونیورسٹیز کی فہرست
        </p>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-body">
          When you run a verification, TrueSeat checks the institution name against a small, documented subset of
          the UK, Canadian and US official registries listed below. If a university isn&apos;t in this subset, we
          say so plainly (&ldquo;couldn&apos;t verify&rdquo;) rather than guessing — we never report a false pass.
        </p>
      </section>

      {/* Search */}
      <form method="GET" className="mb-6 flex flex-col gap-3 rounded-xl border border-border-subtle bg-surface-card p-5 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-text-metadata">
            search
          </span>
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search by institution name…"
            className="h-11 w-full rounded border border-border-subtle bg-surface-canvas pl-10 pr-3 text-sm text-text-headline placeholder:text-text-metadata focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <select
          name="country"
          defaultValue={country}
          className="h-11 rounded border border-border-subtle bg-surface-canvas px-3 text-sm text-text-headline focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="ALL">All countries</option>
          {COUNTRIES.map((c) => (
            <option key={c} value={c}>
              {DESTINATION_LABELS[c]}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="h-11 rounded bg-primary px-5 text-sm font-medium text-surface-canvas shadow-[0_0_20px_rgba(16,185,129,0.15)] transition-all hover:bg-verdict-pass active:scale-[0.99]"
        >
          Search
        </button>
      </form>

      {/* Results */}
      <section className="mb-10 flex flex-col gap-3">
        {unavailable ? (
          <p className="text-sm text-text-metadata">
            The registry lookup isn&apos;t available right now. Please try again shortly, or check the official
            sources linked below.
          </p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-text-metadata">
            {q
              ? "No match in our documented subset. That doesn't mean the institution is fake — check it against the official registries below directly."
              : "No institutions to show yet."}
          </p>
        ) : (
          rows.map((r) => (
            <article
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border-prominent border-l-2 border-l-verdict-pass bg-surface-card p-4"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[20px] text-verdict-pass">check_circle</span>
                <div>
                  <h3 className="text-sm font-medium text-text-headline">{r.name}</h3>
                  <p className="font-mono text-[11px] text-text-metadata">
                    {DESTINATION_LABELS[r.country]}
                    {r.registry_id ? ` · Ref ${r.registry_id}` : ""}
                  </p>
                </div>
              </div>
              <span className="rounded border border-verdict-pass/20 bg-verdict-pass/10 px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider text-verdict-pass">
                {r.registry_status ?? "listed"}
              </span>
            </article>
          ))
        )}
      </section>

      {/* Check it yourself */}
      <section className="rounded-xl border border-border-subtle bg-surface-card p-6">
        <h2 className="font-headline text-lg font-normal text-text-headline">
          Check the full official registry yourself
        </h2>
        <p className="mt-1 text-sm text-text-metadata">
          Our subset above is small by design. For anything it doesn&apos;t cover, always confirm directly with the
          official government source for the destination country.
        </p>
        <ul className="mt-4 flex flex-col gap-2">
          {OFFICIAL_LINKS.map((link) => (
            <li key={link.country}>
              <a
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </AppShell>
  );
}
