#!/usr/bin/env node
// Isolation tests (SPEC §11 / AGENTS.md / skills.md #3). These hit a LIVE
// deployed URL with two real, 2FA-enrolled accounts, so they can't run in CI
// without secrets — run manually before every checkpoint and before
// submission.
//
// Usage:
//   TEST_BASE_URL=https://your-app.vercel.app \
//   USER_A_COOKIE="sb-access-token=...; sb-refresh-token=..." \
//   USER_B_COOKIE="sb-access-token=...; sb-refresh-token=..." \
//   USER_A_CASE_ID=00000000-0000-0000-0000-000000000000 \
//   node tests/isolation.mjs
//
// Get each cookie string from your browser's dev tools (Application > Cookies)
// after signing in and completing the 2FA challenge for that account.

const BASE = process.env.TEST_BASE_URL;
const cookieA = process.env.USER_A_COOKIE;
const cookieB = process.env.USER_B_COOKIE;
const caseIdA = process.env.USER_A_CASE_ID;

if (!BASE || !cookieA || !cookieB || !caseIdA) {
  console.error("Set TEST_BASE_URL, USER_A_COOKIE, USER_B_COOKIE and USER_A_CASE_ID. See the comment at the top of this file.");
  process.exit(1);
}

const results = [];

async function run(name, fn) {
  try {
    const { pass, detail } = await fn();
    results.push({ name, pass, detail });
  } catch (err) {
    results.push({ name, pass: false, detail: String(err) });
  }
}

await run("1. B lists cases -> 0 of A's cases", async () => {
  const res = await fetch(`${BASE}/api/cases`, { headers: { cookie: cookieB } });
  const body = await res.json();
  const leaked = (body.cases ?? []).some((c) => c.id === caseIdA);
  return { pass: !leaked, detail: `status ${res.status}` };
});

await run("2. B opens /cases/{A's id} API -> not found", async () => {
  const res = await fetch(`${BASE}/api/ca"});