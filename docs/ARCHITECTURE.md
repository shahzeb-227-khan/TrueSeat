- Project: TrueSeat — short architecture reference (tables & bullets only)

1) Folder ownership

| Path (folder or file) | Owner |
|---|---|
| lib/schemas.ts | AI |
| lib/ai/* | AI |
| prompts/ | AI |
| evals/ | AI |
| app/api/runs/* | AI |
| supabase/migrations/* | Backend |
| lib/supabase/* | Backend |
| lib/checks/* | Backend |
| app/api/cases/* | Backend |
| app/(auth)/* (MFA pages) | Backend |
| app/(app)/* | Frontend |
| components/* | Frontend |
| lib/mock.ts | Frontend |
| tests/* | Backend (test harness) |
| docs/* | Shared (lead-reviewed) |

2) Module contracts (TypeScript signatures only)

- type Case = { id: string; userId: string; title?: string; destinationCountry?: string; createdAt: string };
- type Extraction = z.infer<typeof ExtractionModelOutputSchema>; // see lib/schemas.ts
- type Finding = z.infer<typeof FindingSchema>; // see lib/schemas.ts
- type Verdict = z.infer<typeof VerdictSchema>; // see lib/schemas.ts

- function runChecks(extraction: Extraction): Promise<Finding[]>
- function computeVerdict(findings: Finding[], context: { registryResult: 'listed'|'ambiguous'|'not_found'|'country_not_supported'; allSenderDomainsMatch: boolean; payeeIsInstitution: boolean; essentialFieldsReadable: boolean; aiAvailable: boolean; }): Verdict
- function extractDocument(file: { path: string; mimeType: string; pages?: number }): Promise<Extraction>

3) MVP cut (3-hour checklist)

- [ ] Sign up with email/password
- [ ] Mandatory TOTP 2FA enrol + challenge (AAL2 gate)
- [ ] Create a case (title, destination country)
- [ ] Upload one document (offer / scholarship / fee / chat)
- [ ] Extraction: extractDocument(file) → zod-validated Extraction
- [ ] Registry lookup (UK CSV baseline) + trigram name match
- [ ] Domain check (official domains, free-mail, look-alike)
- [ ] Payment destination check (payee, wallet, cash, third-party)
- [ ] Cross-document consistency checks (amounts, names, dates)
- [ ] Red-flag scan (model flags + quote-guard)
- [ ] composeVerdict to produce Verdict (code-only rules)
- [ ] Case saved with findings, verdict, ai_runs and drafts
- [ ] Frontend builds against lib/mock.ts for early UX

4) Gate risks and protections (one line each)

- 2FA: mandatory TOTP enforced in middleware; RLS policies require aal2 in JWT claims.
- Isolation: row-level security (user_id = auth.uid()) and private storage paths per user_id.
- DB persistence: every pipeline stage persisted (ai_runs, case_runs, findings, extractions) before next stage starts.

5) Stack & runtime notes (bullets)

- Framework: Next.js (App Router) + TypeScript
- UI: Tailwind + shadcn/ui
- DB/Auth/Storage: Supabase (Postgres, RLS, pg_trgm, MFA)
- AI: Claude primary, Gemini fallback; same zod schemas enforced server-side
- Test: vitest for unit tests; isolation script for manual cross-account checks

6) Ownership & coordination rules (bullets)

- AI owner freezes lib/schemas.ts; any schema change requires cross-team PR review.
- Frontend must develop against lib/mock.ts until AI/backend extraction API exists.
- Code (backend) computes the final verdict; model outputs are only findings/evidence.

7) References (short pointers)

- See SPEC.md §7 (AI design) and §8 (deterministic checks) for stage definitions and rule lists.
- See AGENTS.md for core rule: "Code computes verdict; model only reads and explains."