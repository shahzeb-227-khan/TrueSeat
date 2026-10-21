- REPO OWNERSHIP (folder → owner)

| Path / file patterns | Owner |
|---|---:|
| lib/schemas.ts | AI |
| lib/ai/* | AI |
| prompts/* | AI |
| evals/* | AI |
| app/api/runs/* | AI |
| supabase/migrations/* | Backend |
| lib/supabase/* | Backend |
| lib/checks/* | Backend |
| app/(auth)/* | Backend |
| app/api/cases/* | Backend |
| app/(app)/* | Frontend |
| components/* | Frontend |
| lib/mock.ts | Frontend |
| docs/* | Frontend (lead coordination) |
| middleware.ts | Backend |
| package.json, tsconfig.json, next.config.mjs | Lead (coord.) |

- MODULE CONTRACTS (TypeScript signatures only)

Types (zod-exported names):
- type Case
- type Extraction
- type Finding
- type Verdict
- type RunStage

Key function signatures:
- function runChecks(extraction: Extraction): Promise<Finding[]>
- function computeVerdict(findings: Finding[]): Verdict
- function extractDocument(input: { kind: 'file'; mimeType: string; base64: string } | { kind: 'text'; text: string }): Promise<{ ok: boolean; data: Extraction; rawText: string }>
- function lookupInstitution(supabase: any, name: string, destinationCountry: string): Promise<{ result: 'listed' | 'not_found' | 'ambiguous'; matched?: any; candidates: any[] }>
- function composeVerdict(findings: Finding[], options?: { destinationCountry?: string }): Verdict
- function scanRedFlags(docs: { documentId: string; rawText: string }[]): Promise<{ ok: boolean; issues: any[] }>
- function createUserClient(accessToken: string): import('@supabase/supabase-js').SupabaseClient

- MVP CUT (3-hour checklist)

- [ ] Sign up (email+password) with inbox message
- [ ] Mandatory TOTP 2FA: enroll (/mfa/enroll) and challenge (/mfa/challenge)
- [ ] AAL2 gate enforced by middleware for protected routes
- [ ] Create case UI wired to lib/mock.ts
- [ ] Upload single document (letter) to evidence bucket (mocked for frontend)
- [ ] Extraction stage returns Extraction (mock or AI)
- [ ] Registry lookup (seeded subset) and domain check (lib/checks)
- [ ] Compute verdict in code and display verdict card
- [ ] Case list shows created cases (frontend reads lib/mock.ts)

- GATE RISKS & PROTECTIONS (one-line each)

- 2FA: enforce AAL2 on edge and server; non-AAL2 sessions limited to /mfa/*, /sign-in, /sign-up and /api/health.
- Isolation: strict folder ownership, per-user RLS, frontend builds against lib/mock.ts first.
- DB persistence: persist each pipeline stage before advancing; use transactional writes where available.

- STACK (single-line list)

- Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, Supabase (Auth+Storage+Postgres), Claude primary + Gemini fallback

- NOTES / CONSTRAINTS (bullets only)

- Frontend must build against lib/mock.ts first; avoid runtime dependency on AI or server pipelines during UI development.
- Service-role key NEVER used in browser or middleware; server-only usage requires explicit approval.
- Refer to SPEC.md and AGENTS.md for pipeline and ownership details; if conflicts exist, flag AGENTS.md (do not edit it).
