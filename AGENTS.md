# AGENTS.md: TrueSeat

Read this file at the start of every task. Keep changes small and limited to what the ticket asks.

## What this is
TrueSeat is an AI verification agent. A Pakistani student or parent uploads a study-abroad admission letter, scholarship letter, fee receipt or consultant chat. The app checks it against official university registers and returns a verdict, quoted evidence, an Urdu/English explanation and a ready verification email, before any money is paid.

**Core rule: code decides the verdict. The model only reads documents and explains findings.** A model flag can raise suspicion but can never produce 🟢.

## Stack
- Next.js (App Router) + TypeScript, deployed on Vercel
- Tailwind CSS + shadcn/ui (use defaults, do not restyle)
- zod schemas in `lib/schemas.ts`, shared by client, server and AI layer
- Supabase: Postgres with `pg_trgm`, Auth with TOTP, private Storage
- AI: Claude (primary, vision + tool use), Gemini (fallback), same schemas

## Commands
> Confirm these after the scaffold exists, then edit this block.
- Dev: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint`
- Tests: `npm test` (isolation tests live in `/tests`)
- Health check: `GET /api/health` (runs one DB query; also called daily by a GitHub Action)

## Folder map
- `app/` pages: cases, upload, results, history, auth
- `app/api/cases/*` case routes (user-token Supabase client)
- `app/api/runs/*` orchestrator; saves each stage before the next starts
- `app/api/health` keep-alive
- `lib/schemas.ts` all types and zod schemas (single source of truth)
- `prompts/` versioned model prompts (`extractions.prompt_version` records the version)
- `evals/` ~24 synthetic test cases
- `tests/` isolation and unit tests
- `skills.md` step-by-step tasks: add a pipeline stage, add a red-flag code, run isolation tests
- Root docs: README.md, SPEC.md, AI_DISCLOSURE.md, PRIOR_WORK.md

## Conventions (always)
- Import types from `lib/schemas.ts`. Do not redefine fields.
- Server routes call Supabase with the **user's access token**, never the service-role key, so RLS covers AI routes.
- Every user table has `user_id` and RLS requiring ownership **and** `aal2` (completed 2FA).
- Document text reaches a model only as delimited data, never as instructions.
- Validate every model output with zod. Invalid JSON: one repair prompt, then one retry on the fallback provider.
- Each stage writes its result before the next stage starts.
- Every model finding includes a quote that exists in the stored text (quote-guard). Every registry finding names the register and snapshot date.
- Missing domain in the dataset gives `unknown`, never `mismatch`.
- Only use red-flag codes from the `red_flag_catalogue` table.
- UI text exists in English and Urdu. Urdu summary appears on every completed case.
- Log each AI call in `ai_runs` (stage, provider, model, latency, tokens, ok, error_code). Never store document text there.

## Honesty rules for all user-facing text
- Never say "genuine" or "safe". 🟢 always carries: "This does not prove the offer is genuine. Confirm it with the university using the official contact below."
- Describe documents, never accuse people. Say "warning signs", not "fraud".
- Drafts are drafts; the user sends them. The verification email goes to the registry's official domain, never to an address taken from the document.
- Not affiliated with any government body, embassy or university.
- Never show a cached or hardcoded response as a live AI result.

## Verdicts (implemented in code)
- 🔴 High risk: any High finding confirmed by code, or two or more High quoted model flags
- 🟠 Suspicious: any Medium finding, or one High model flag without code confirmation
- 🟢 Checks passed: institution listed, all sender domains match, payee is the institution, no High or Medium findings
- ⚪ Couldn't verify: institution not found, country unsupported, essential fields unreadable or AI unavailable, with no red flags

## Boundaries
- ✅ **Always:** run lint and tests before committing; run the isolation tests after touching routes, RLS, storage or auth; update this file when the stack, commands or folders change
- ⚠️ **Ask first:** changing `lib/schemas.ts` after the schema freeze; adding dependencies; changing RLS policies, verdict rules or the red-flag catalogue; changing CI or Vercel settings
- 🚫 **Never:** use the service-role key in app code; commit secrets or API keys; let a model decide the verdict; fetch registers live at judging time; delete or skip a failing test to make it pass; edit `node_modules/` or generated files; add features from the non-goals list

## Non-goals (do not build)
Overseas job offers, public consultant database, auto-emailing universities, FIA complaint filing, visa/CAS/I-20/LOA verification, consultant licensing checks, WhatsApp bot, voice input, native apps, payments, admin dashboards.

## Priorities
P0 is the full journey: sign up, 2FA, create case, upload, verify, save, sign out, sign in, retrieve. Nothing at P1 starts until every P0 passes on the deployed URL. P2 is cut first.

## Git workflow
- Commit from your own GitHub account, in small commits, every day.
- Branch off `main`, one task per branch, short descriptive commit messages.
- No commits after the code freeze (22 Oct 2026, 11:00 PM PKT).

## Token-saving habits
- Work from a ticket: file or route, function, input/output types, acceptance test, what not to touch.
- Request targeted edits, not rewrites. Batch small related changes.
- Paste only the 5 to 10 error lines that matter plus file and line.
- Never paste data files into a prompt; import CSVs with Supabase import or a short script.
- Two-strike rule: if the same fix fails twice, stop and ask for the exact cause.
