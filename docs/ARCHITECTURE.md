- Project: TrueSeat — AI verification agent for Pakistani students/parents

- Stack
  - Next.js (App Router), TypeScript
  - UI: Tailwind + shadcn/ui
  - Auth: Supabase Auth + TOTP (AAL2)
  - DB: Supabase Postgres (pg_trgm enabled)
  - AI: Claude (primary) + Gemini (fallback)

- Ownership by folder (3 devs, zero file overlap)
  | Path (folder or file)                         | Owner    |
  |-----------------------------------------------|----------|
  | lib/schemas.ts                                | AI       |
  | lib/ai/*                                      | AI       |
  | prompts/                                       | AI       |
  | evals/                                         | AI       |
  | app/api/runs/*                                | AI       |
  | supabase/migrations/*                         | Backend  |
  | lib/supabase/*                                | Backend  |
  | lib/checks/*                                  | Backend  |
  | app/api/cases/*                               | Backend  |
  | app/(auth)/* (MFA pages, enroll/challenge)    | Backend  |
  | app/(app)/*                                   | Frontend |
  | components/*                                  | Frontend |
  | lib/mock.ts                                   | Frontend |
  | rest of repo config (package.json, tsconfig)  | Lead (Shahzeb)

- Module contracts: TypeScript signatures only
  - Types (zod names)
    - Case: zod name "Case"
    - Extraction: zod name "ExtractionModelOutputSchema" (ExtractionModelOutput)
    - Finding: zod name / TS type "Finding"
    - Verdict: union 'high_risk' | 'suspicious' | 'checks_passed' | 'could_not_verify'
  - Function signatures
    - runChecks(extraction: ExtractionModelOutput): Promise<Finding[]>
    - computeVerdict(findings: Finding[]): Verdict
    - extractDocument(file: { mimeType: string; base64: string } | { text: string }): Promise<ExtractionModelOutput>

- MVP cut (3-hour checklist)
  - [ ] Sign up (email/password) and email confirmation
  - [ ] Mandatory TOTP 2FA (enrol & challenge pages; middleware AAL2 gate)
  - [ ] Create a case (destination country + optional title)
  - [ ] Upload one document (offer/scholarship/receipt/chat) — accepted mime: jpeg/png/webp/pdf/txt
  - [ ] Run extraction: extractDocument(file) => ExtractionModelOutput
  - [ ] Run code checks: runChecks(extraction) => Findings (includes UK register + domain checks)
  - [ ] Compute verdict: computeVerdict(findings) => Verdict (code-only decision)
  - [ ] Display verdict card in case UI (emoji + en/ur labels + quoted evidence)
  - [ ] Case list shows latestVerdict for each case
  - Note: Frontend builds against lib/mock.ts first (mock Extraction / Findings / Verdict)

- Gate risks & mitigation (one line each)
  - 2FA gate: middleware enforces AAL2 via supabase.auth.mfa.getAuthenticatorAssuranceLevel(); unauthenticated or non-AAL2 sessions redirected to /mfa and APIs return 401.
  - Isolation tests: per-user data uses RLS and auth.uid(); tests run in /tests with isolated users to avoid cross-talk.
  - DB persistence: migrations staged under supabase/migrations and applied only via apply_migration; service-role key never used in browser or middleware.

- Constraints & reminders (bullets only)
  - Code computes verdict; models only assist extraction/explanation — model outputs never make a green-pass decision directly.
  - Documents are sent to models as native files (image/pdf base64) or plain text; extract_document input size equals actual file bytes (no OCR transcript step).
  - Keep lib/schemas.ts frozen once agreed; all types derive from it.
  - Do not include service-role keys in any client-side code; use public anon keys only where intended.

- References
  - SPEC.md §8 for deterministic checks and verdict rules
  - AGENTS.md for agent governance and file ownership

- Branch
  - main
