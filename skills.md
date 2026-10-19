# TrueSeat Skills

Repeatable tasks for AI agents working on this repo. Read `AGENTS.md` first. Types come from `lib/schemas.ts` only. Use the user-token Supabase client, never the service-role key. The verdict is always computed by code, never by a model.

Skills in this file:
1. Add a pipeline stage
2. Add a red-flag code
3. Run the isolation tests

---

## 1. Add a pipeline stage

**Use when:** adding, splitting or changing a stage, a new check, or a new model call in the verification run (`app/api/runs/[id]/route.ts`).

### Steps
1. **Decide: code or model.** Prefer code. Use a model only for reading or explaining text.
2. **Define the output type** in `lib/schemas.ts` as a zod schema. Reuse `Finding` and `Extraction` where possible. Do not edit existing types without team approval (schema freeze).
3. **If a model stage:**
   - Put the prompt in `prompts/<stage>.v1.md` and record the version in `extractions.prompt_version`.
   - Pass document text only as delimited data, never as instructions.
   - Validate with zod. Invalid JSON: one repair prompt, then one retry on the fallback provider.
   - Add a guard before storing (quote-guard for flags, number-and-name guard for explanations).
4. **Add the stage to the orchestrator** in fixed order. Save its result to the database before the next stage starts. Update `case_runs.stage`.
5. **Log to `ai_runs`:** stage, provider, model, latency_ms, input_tokens, output_tokens, ok, error_code. Never store document text.
6. **Failure handling:** 30 s timeout; back-off and one retry on 429/5xx; then fallback provider; if both fail, save the run as `partial` so Retry resumes from the last completed stage.
7. **Test:** unit test for code logic; add one positive and one negative case to `evals/`; run skill 3 if you touched any route or table.
8. **Update `AGENTS.md`** in the same commit.

### Never
- Show a cached or hardcoded response as a live AI result.
- Let model output produce a 🟢 verdict.
- Fetch registers live at runtime; use the stored snapshot and show its date.

### Example ticket
"In `app/api/runs/[id]/route.ts`, add stage `check_domains` using `institution_domains`. Return `Finding[]` from `lib/schemas.ts`. Do not change earlier stages. Test: `admissions.office.uk@gmail.com` gives `FREE_EMAIL_SENDER`; `ox-ac-uk.com` gives `LOOKALIKE_DOMAIN`."

---

## 2. Add a red-flag code

**Use when:** adding a new warning sign or finding code. Codes live in the `red_flag_catalogue` table; the model may only use codes from it.

### Steps
1. **Name the code** in UPPER_SNAKE_CASE and set severity: `High` or `Medium`.
2. **Decide who detects it:**
   - **Code** (domains, payees, amounts, names, dates): deterministic function plus unit test.
   - **Model** (language signs such as guaranteed visa, secrecy, urgency): add the code to the allowed list in the red-flag prompt in `prompts/` and bump the prompt version.
3. **Add the catalogue row** (migration or seed): `code, severity, title_en, title_ur, explanation_en, explanation_ur`. Wording describes the document ("warning sign"), never accuses a person, never says "fraud".
4. **Add the code to the zod enum** in `lib/schemas.ts`.
5. **Model-detected only:** every flag must carry a quote. Quote-guard drops any flag whose quote is not in the stored text and logs it in `ai_runs`.
6. **Check verdict impact:**
   - 🔴 High risk: any High finding confirmed by code, or two or more High quoted model flags.
   - 🟠 Suspicious: any Medium finding, or one High model flag without code confirmation.
   - 🟢 is impossible while any High or Medium finding exists.
7. **Add eval cases** in `evals/`: one document that should trigger it, one that should not.
8. **Update docs:** catalogue table in SPEC.md; `AGENTS.md` if needed.

### Never
- Add a code the UI cannot show in both English and Urdu.
- Let a model flag with no quote reach the results screen.
- Change the verdict rules without team approval.

---

## 3. Run the isolation tests

**Use when:** at every checkpoint, after any change to routes, RLS, storage or auth, and before submitting. Failing any test is disqualifying (gate M3).

### Setup
- Two real accounts, A and B, email confirmed and TOTP enrolled.
- A has at least one case with an uploaded document.
- Run against the deployed URL, not only localhost. Use the test command in `AGENTS.md` (tests live in `/tests`).

### The five tests
| # | Action | Expected |
|---|--------|----------|
| 1 | B lists cases | 0 of A's cases |
| 2 | B opens `/cases/{A's id}` | Not found |
| 3 | B reads, updates or deletes A's case via the API | 404 or 403 |
| 4 | B requests A's storage path | Denied |
| 5 | Password-only (AAL1) session calls `/api/cases` | 401 |

### Also confirm
- RLS on user tables requires `user_id = auth.uid()` and `aal = 'aal2'`.
- Bucket `evidence` is private, path prefix equals `auth.uid()`, files only via short-lived signed URLs.
- Server routes use the user's access token, not the service-role key.

### Report
Table of test number, pass/fail, and the exact status code for any failure. If any fails: stop feature work, fix the policy or route, re-run all five.

### Never
- Weaken a policy to make a test pass.
- Use the service-role key to "verify" results.
