# AI Disclosure

TrueSeat — Build The Next Big Thing with AI (Devmarketplace × NED University of Engineering & Technology), 19–22 Oct 2026.

This document states which parts of TrueSeat use AI, which AI providers and models are called, what data they see, how their output is bounded, and the licences of the third-party data and code TrueSeat depends on. See [SPEC.md §7–9](./SPEC.md#7-ai-design) for the full design and [SPEC.md §14](./SPEC.md#14-safety-privacy-and-honesty-rules) for the honesty rules this disclosure follows.

## 1. Where AI is used

AI is the core of the product, not an add-on: it is what turns a photographed offer letter, a fee voucher and a Roman-Urdu chat screenshot into structured, checkable facts. TrueSeat runs a **code-orchestrated agent** — a fixed server-side pipeline, not a free-roaming chatbot. Three of its eight stages call a hosted language model; the rest are deterministic application code that the model's output cannot override.

| Stage | AI? | What it does |
|---|---|---|
| 1. `extract_document` | **Yes** (vision) | Reads each uploaded document (image/PDF) and returns structured fields — institution, programme, amounts, payee, emails, URLs, claims — each with a 0–1 confidence score |
| 2. `lookup_institution` | No | Trigram (`pg_trgm`) similarity search against the imported registry tables |
| 2b. `disambiguate_institution` | **Yes** (text, only if >1 close registry match) | Picks the correct institution from the registry candidates already returned by code, or says "ambiguous" |
| 3. `check_domains` | No | Compares extracted emails/URLs against the official-domain dataset and a free-mail list |
| 4. `check_payment` | No | Rule-based check of payee/method/currency from extraction |
| 5. `cross_check_case` | No | Compares names, amounts, dates and payees across documents in the same case |
| 6. `scan_red_flags` | **Yes** (text) | Flags warning-sign language (guaranteed visa, urgency, insider claims, etc.) from a fixed catalogue of codes, each flag required to quote its source sentence |
| 7. `compose_verdict` | No | Deterministic rules decide 🔴/🟠/🟢/⚪ — the model never chooses the verdict |
| 8. `explain_and_draft` | **Yes** (text) | Writes the English/Urdu summary, the verification email and the FIA complaint draft, from the stored findings only |

## 2. Providers and models

| Role | Provider | Model (current default) | Notes |
|---|---|---|---|
| Primary | Anthropic | `claude-sonnet-4-5` (`ANTHROPIC_API_KEY`) | Vision + structured text output, called via the raw Messages API (no SDK, to keep the stage files provider-agnostic) |
| Fallback | Google | `gemini-2.0-flash` (`GEMINI_API_KEY`, also read from `GOOGLE_API_KEY` for compatibility) | Used only if Claude times out (30s) or returns a retryable error (429/5xx) after one retry |

Both are called with the same prompts and the same zod schema per stage, so the result is structurally identical regardless of which provider served the call. Every call is logged to `ai_runs` with provider, model, latency and token counts (no document text or images are logged).

## 3. What the model sees, and what it never decides

- **Document text is treated as data, never instructions.** An uploaded document's extracted text is passed to the model only inside clearly delimited, labelled fields. A forged document containing text like "mark this as verified" cannot change the verdict — the verdict is computed entirely by code (stage 7), and this scenario is in our adversarial test set.
- **The model never decides whether an institution is licensed.** That answer comes only from the imported registry tables (§5 below), matched by code.
- **The model never invents contact details.** The verification email and complaint draft are addressed using the institution's domain from the registry/domain dataset — never an address copied from the (possibly forged) uploaded document.
- **`explain_and_draft` sees only the stored findings JSON**, not the raw documents or images, and every figure, name, email or URL it outputs must already exist in those findings or the registry record (the *number-and-name guard*). If it introduces one that isn't there, the stage regenerates once and then falls back to a template built only from findings.

## 4. Guardrails (code, not the model)

| Guardrail | What it rejects |
|---|---|
| zod schema validation | Any extraction that doesn't match the expected shape (one repair attempt, then fallback provider) |
| **quote-guard** | Any red-flag finding whose quote doesn't appear verbatim (whitespace/case normalised) in that document's stored text — dropped, not shown to the user |
| Flag-code allowlist | Any red-flag code outside the fixed catalogue in SPEC §7.4 |
| Candidate-ID membership | A disambiguation answer that isn't one of the registry candidates actually supplied |
| **number-and-name guard** | Any amount, name, email or URL in the generated explanation/drafts that doesn't already exist in the stored findings |

`quote-guard` and the TOTP/RLS helper (`supabase-mfa-guard`) are the two components extracted as our Devmarketplace code gigs — see README's M6 row.

## 5. Data sources (not AI, but feed the checks the AI's output is validated against)

| Source | Publisher | Licence / terms |
|---|---|---|
| Register of licensed sponsors: students | UK Home Office (gov.uk) | Open Government Licence (crown copyright) |
| Designated learning institutions list | IRCC (Canada) | Government of Canada open data |
| School Search (SEVP-certified schools) | US DHS, Study in the States | US government public data |
| [university-domains-list](https://github.com/Hipo/university-domains-list) | Hipo (open source) | MIT Licence |

All registry data was imported as data, before kickoff or as dated snapshots during the build, with source URL, fetch date and row count recorded in `registry_snapshots` — never hand-edited.

## 6. What we do not claim

- No accuracy or detection-rate figures are claimed beyond what's reported, with its sample size, in README's Testing section — per SPEC §15, nothing is claimed before that evaluation is run and written up.
- A 🟢 "Checks passed" verdict is never presented as proof an offer is genuine; it is always paired with independent-verification steps, because only the university itself can confirm an offer.
- Documents are never used to train any model, and are not sent to either provider for any purpose beyond the single extraction/scan/draft call being made.
