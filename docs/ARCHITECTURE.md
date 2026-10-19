# TrueSeat Architecture

Scope: Phase 1 (Setup and Authentication) plus the module boundaries later phases build against. Product rules: AGENTS.md. Full detail: SPEC.md.

## 1. Folder tree and owners

| Path | Owner | Purpose |
|---|---|---|
| `lib/schemas.ts` | AI | zod schemas and inferred types (frozen after agreement) |
| `lib/ai/*` | AI | Claude and Gemini wrapper, extraction, red-flag scan, explanation |
| `prompts/` | AI | versioned prompts |
| `evals/` | AI | synthetic test cases |
| `app/api/runs/*` | AI | orchestrator; saves each stage before the next |
| `supabase/migrations/` | Backend | SQL migrations, applied via `apply_migration` only |
| `lib/supabase/*` | Backend | user-token client, storage helpers |
| `lib/checks/*` | Backend | registry, domain, payment, cross-document, date checks, `computeVerdict` |
| `app/api/cases/*` | Backend | case, document and confirmation routes |
| `app/api/health/` | Backend | keep-alive, runs one DB query |
| `app/(auth)/*` | Backend | sign-up, sign-in, TOTP enrolment and challenge |
| `middleware.ts` | Backend (proposed) | redirects non-AAL2 sessions; not in the split yet, confirm |
| `tests/` | Backend | isolation and unit tests |
| `.github/workflows/` | Backend | daily keep-alive action |
| `app/layout.tsx` | Frontend | root layout |
| `app/(app)/*` | Frontend | cases, upload, results, history |
| `components/*` | Frontend | shadcn and feature components |
| `lib/mock.ts` | Frontend | mock data typed only from `lib/schemas.ts` |
| `docs/` | Frontend | this file and other project docs |
| `package.json`, `tsconfig.json`, `tailwind.config.ts`, `next.config.*` | Lead (Shahzeb) | set once; later changes by PR to lead, new dependencies only |
| `README.md`, `.env.example` | Lead | setup and env names (no values) |
| `AGENTS.md`, `SPEC.md`, `skills.md` | Lead | not changed by this file |

- Conflict flag: AGENTS.md folder map omits `docs/`, `.github/` and `middleware.ts`. This file adds them; AGENTS.md is not edited.
- Import direction: `lib/ai` may import `lib/checks/verdict.ts`; `lib/checks` never imports `lib/ai`.

## 2. Module contracts (TypeScript signatures)

```ts
// lib/schemas.ts (AI, frozen)
export const VerdictSchema = z.enum(["high_risk", "suspicious", "checks_passed", "could_not_verify"]);
export type Verdict = z.infer<typeof VerdictSchema>;

export const CaseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  destinationCountry: z.string().length(2),
  status: z.enum(["open", "waiting_university", "verified_by_university", "reported", "closed"]),
  latestVerdict: VerdictSchema.nullable(),
  updatedAt: z.string(),
});
export type Case = z.infer<typeof CaseSchema>;

export const ExtractionSchema = z.object({
  documentId: z.string().uuid(),
  docType: z.enum(["offer_letter", "scholarship_letter", "fee_receipt", "payment_instruction", "chat", "email", "other"]),
  institutionName: z.string().nullable(),
  programme: z.string().nullable(),
  amounts: z.array(z.object({ value: z.number(), currency: z.string().length(3), label: z.string() })),
  payee: z.object({ name: z.string().nullable(), method: z.enum(["bank", "wallet", "cash", "card", "unknown"]).nullable() }),
  emails: z.array(z.string()),
  urls: z.array(z.string()),
  fieldConfidence: z.record(z.number().min(0).max(1)),
  rawText: z.string(),
});
export type Extraction = z.infer<typeof ExtractionSchema>;

export const FindingSchema = z.object({
  code: z.string(),
  source: z.enum(["code", "model"]),
  severity: z.enum(["high", "medium", "info", "pass"]),
  documentId: z.string().uuid().nullable(),
  quote: z.string().nullable(),
  details: z.record(z.unknown()),
});
export type Finding = z.infer<typeof FindingSchema>;
```

```ts
// lib/ai/extract.ts (AI)
export type DocumentInput = {
  documentId: string;
  mimeType: "image/jpeg" | "image/png" | "application/pdf" | "text/plain";
  bytes?: Uint8Array; // file upload
  text?: string;      // pasted text
};
export function extractDocument(file: DocumentInput): Promise<Extraction>;

// lib/checks/index.ts (Backend)
// Async because the registry lookup runs a pg_trgm query.
export function runChecks(extraction: Extraction): Promise<Finding[]>;

// lib/checks/verdict.ts (Backend, pure, unit-tested)
// Code decides the verdict. AI calls this; it never reimplements it.
export function computeVerdict(findings: Finding[]): Verdict;

// lib/supabase/server.ts (Backend)
// Client built from the user's access token, so RLS applies.
export function createUserClient(accessToken: string): SupabaseClient;
```

## 3. MVP cut (3 hours)

- [ ] Sign up with email and password, with a "check your inbox" message (Backend)
- [ ] TOTP 2FA enrolment and challenge; non-AAL2 sessions blocked from data (Backend)
- [ ] Create a case with destination country (Frontend, API by Backend)
- [ ] Upload one letter to private storage (Backend route, Frontend UI)
- [ ] Extraction with zod validation, Claude with Gemini fallback (AI)
- [ ] UK register lookup (pg_trgm) and domain check, both in `lib/checks` (Backend)
- [ ] Verdict card using `computeVerdict` (Frontend, verdict by Backend)
- [ ] Case list (Frontend)
- Gate items, not cut: isolation tests in `tests/`; each stage saved before the next.

## 4. Gate risks

| Risk | Protection | Owner |
|---|---|---|
| 2FA not enforced | Mandatory TOTP enrolment; RLS requires `aal2`; AAL1 call to `/api/cases` returns 401 | Backend |
| Data isolation leak | RLS on every user table (`user_id = auth.uid()`); user-token client only; isolation suite run at each checkpoint | Backend |
| DB persistence lost | Each stage writes before the next starts; restart and redeploy test; daily `/api/health` keep-alive | AI and Backend |

## 5. SPEC.md references

| Topic | SPEC section |
|---|---|
| Journey and MVP scope | §5, §6 |
| Extraction and orchestrator stages | §7.1, §7.2 |
| Document text as untrusted data | §7.3 |
| Deterministic checks and verdict rules | §8 |
| Registry sources | §9 |
| Data model | §10 |
| Auth, 2FA, RLS, storage, isolation tests | §11 |
| Stack and keep-alive | §12 |
| Failure handling | §13 |
| Ownership and integration dates | §17, §18 |
