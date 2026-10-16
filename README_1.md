# TrueSeat

**Is your university seat real? Check before you pay.**

*Pehle pukhta karo, phir pay karo.*

TrueSeat is an AI verification agent for Pakistani students and families. Upload an admission letter, scholarship letter, fee receipt or a consultant's WhatsApp message. TrueSeat reads it, checks the university against official government registers, checks whether the emails, websites and payment details actually belong to that university, and explains in Urdu or English, with quoted evidence, what checks out, what doesn't, and how to confirm the offer directly with the university.

> **Status: pre-build.** This repository contains documentation only until **19 October 2026, 9:00 AM PKT**, as required by the hackathon rules. Product code is written during the build window (19–22 October 2026). Sections marked *(planned)* will be completed during the build.

Built for **Build The Next Big Thing with AI** — Devmarketplace × NED University of Engineering & Technology.

- 📄 Full specification: [SPEC.md](./SPEC.md)
- 🌐 Live app: *(planned — link added during the build)*
- 🎬 Demo video: *(planned — link added at submission)*

---

## Why TrueSeat exists

In October 2026, an IIUI gold-medallist's death drew national attention to study-abroad fraud. News reports say her family allegedly paid about **PKR 9.3 million** to an unregistered man who supplied **forged Harvard admission, scholarship and fee documents**. The fake letter was reportedly rejected at the US Embassy visa interview, after the money was gone. The case is under FIA investigation. ([PIE News](https://thepienews.com/pakistani-graduates-death-puts-alleged-us-study-fraud-in-national-spotlight/), [Minute Mirror](https://minutemirror.com.pk/not-visa-consultancy-fraud-but-fake-harvard-admission-scam-by-man-posing-as-supreme-court-registrar-dg-fia-dr-usman-anwar-reveals-breakthrough-in-iiui-gold-medalist-laiba-case-642419/))

It is not the only case, and today there is no public register of licensed education consultants in Pakistan ([The Friday Times](https://thefridaytimes.com/13-Oct-2026/deadly-cost-pakistan-s-education-scam-industry)). The official registers of licensed **universities** do exist (UK, Canada, US), but families don't know about them, can't read the warning signs in a forged letter, and are pressured to pay quickly.

**TrueSeat turns that official data and those warning signs into a 60-second, evidence-backed check, at the moment before money changes hands.**

---

## What it does

| Step | What happens | Who does it |
|---|---|---|
| 1. Read | Extracts institution, programme, amounts, payee, emails, links and claims from photos, PDFs or text | AI (vision) |
| 2. Institution | Looks the university up in official registers: UK licensed student sponsors, Canada DLIs, US SEVP-certified schools | Code + official data |
| 3. Sender | Compares every email and website with the university's official domain; flags Gmail-style senders and look-alike domains | Code |
| 4. Money | Flags payment to personal accounts, mobile wallets, cash or third parties | Code + AI |
| 5. Consistency | Cross-checks names, amounts and dates across all documents in a case | Code |
| 6. Warning signs | Finds "guaranteed visa", "pay to release scholarship", insider claims, urgency. **Every flag must quote its source line** | AI + quote-guard |
| 7. Verdict | 🔴 High risk · 🟠 Suspicious · 🟢 Checks passed · ⚪ Couldn't verify. **Never "genuine"** | Code rules |
| 8. Act | Verification email to the university's **official** address, Urdu explanation for family, FIA complaint draft | AI + guard |
| 9. Save | Private case history with status tracking | Database |

### Example finding

> 🔴 **The offer letter was not sent from the university's email domain.**
> Quoted: *"Please send your documents to admissions.office.uk@gmail.com"*
> Official domain (from university-domains-list): `example.ac.uk`
> *Checked by code · Read by AI*

---

## How the AI is built

TrueSeat is a **code-orchestrated agent**, not a chatbot:

- **Specialised model calls** for document extraction, institution disambiguation, red-flag scanning and explanation, each with its own zod-validated schema.
- **Retrieval from official registers**, so the model never decides whether a university is licensed.
- **quote-guard:** any finding whose quote doesn't appear in the uploaded document is dropped.
- **number-and-name guard:** explanations and drafts may only contain figures, names and addresses present in the stored findings or official records.
- **Prompt-injection defence:** document text is treated as data; the verdict is computed by code.
- **Failure handling:** repair attempt → retry → fallback provider → partial result with a Retry button. Completed stages are never lost.

Details: [SPEC.md §7–8](./SPEC.md#7-ai-design).

---

## Official data sources

| Source | Publisher | Used for |
|---|---|---|
| [Register of licensed sponsors: students](https://www.gov.uk/csv-preview/6ac36a847f7c67dc11d8e48a/SP_-_Student_and_Child_Student_Web_Register_-_2026-10-05.csv) | UK Home Office | UK institutions |
| [Designated learning institutions list](https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit/prepare/designated-learning-institutions-list.html) | IRCC (Canada) | Canadian institutions |
| [School Search](https://studyinthestates.dhs.gov/school-search) | US DHS, Study in the States | US institutions (disclosed subset) |
| [university-domains-list](https://github.com/Hipo/university-domains-list) | Hipo (open source) | Official university email domains |

Each import records the source URL, download date and row count, and the app always shows which snapshot a check used.

---

## Tech stack

| Layer | Technology |
|---|---|
| Web app + API | Next.js (App Router), TypeScript |
| UI | Tailwind CSS, shadcn/ui |
| Validation | zod |
| Database, auth, storage | Supabase: PostgreSQL (RLS, `pg_trgm`), Auth with TOTP 2FA, private Storage |
| AI | Claude (primary, vision + tool use) with Gemini fallback |
| Hosting | Vercel |

---

## Security and privacy

- **Mandatory 2FA** (authenticator app) before any case data loads.
- **Row-level security** on every user table: `user_id = auth.uid()` **and** the session must have completed 2FA (`aal2`).
- **Private storage** with per-user paths and short-lived signed URLs.
- **Automated isolation tests:** a second account cannot list, open, edit or download another user's cases or files.
- Documents are **never used for model training** and can be deleted at any time; logs never contain document contents.
- TrueSeat is **not affiliated** with any government, embassy or university, and its output is **not legal advice**.

---

## Getting started *(planned)*

Setup instructions will be added during the build. Planned outline:

```bash
git clone https://github.com/<team>/trueseat.git
cd trueseat
cp .env.example .env.local     # add Supabase and AI provider keys
npm install
npx supabase db push           # run migrations
npm run import:registries      # load official registry snapshots
npm run dev
```

### Environment variables *(planned)*

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key (RLS enforced) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server-only**, used by migrations and imports, never by user routes |
| `ANTHROPIC_API_KEY` | Primary AI provider (server-only) |
| `GEMINI_API_KEY` | Fallback AI provider (server-only) |

---

## Testing *(planned)*

- Unit tests for every deterministic check (registry match, domain match, look-alike, payment, consistency, verdict rules).
- quote-guard and number-and-name guard tests.
- Two-account isolation tests and an AAL1 (password-only) access test.
- Evaluation on ~24 labelled synthetic cases, including prompt-injection attempts. **Results will be reported here with the sample size; no accuracy is claimed before then.**

---

## Hackathon compliance

| Requirement | Where |
|---|---|
| M1 Live AI in the core journey | Extraction, red-flag scan and explanation on every verification |
| M2 Persistent database | Supabase PostgreSQL |
| M3 Auth + 2FA + separate data | Supabase Auth, mandatory TOTP, RLS with `aal2`, isolation tests |
| M4 End-to-end journey | Sign up → 2FA → upload → verify → save → sign in again → retrieve |
| M5 Repo and docs | README.md, [SPEC.md](./SPEC.md), AI_DISCLOSURE.md, PRIOR_WORK.md; commits throughout 19–22 Oct |
| M6 Two code gigs | `quote-guard`, `supabase-mfa-guard` *(links added when published)* |

---

## Team

| Member | Role |
|---|---|
| **Shahzeb Alam** (lead) | AI and verification |
| **Muneeb Ahmed** | Backend, data and security |
| **Shah Iman** | Product, frontend and communication |

NED University of Engineering & Technology, Karachi.

---

## Limitations

TrueSeat checks consistency and warning signs. **It cannot prove an offer is genuine or forged; only the university can.** Registry data is a dated snapshot, the domain dataset is incomplete, visas and CAS/I-20/LOA numbers cannot be verified through any public system, and Pakistan has no public register of licensed education consultants yet. See [SPEC.md §24](./SPEC.md#24-limitations).

---

## Licence

*(To be chosen by the team before the first code commit, e.g. MIT.)* Third-party data and libraries remain under their own licences, listed in AI_DISCLOSURE.md.
