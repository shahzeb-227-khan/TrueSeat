const WALLET_KEYWORDS = [
  "jazzcash",
  "easypaisa",
  "upaisa",
  "nayapay",
  "sadapay",
  "wallet",
  "personal account",
  "my account",
];

const CASH_KEYWORDS = ["cash", "in person", "hand over", "hand it over"];

function normalise(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

function looksLikeSameEntity(a: string, b: string): boolean {
  const an = normalise(a).replace(/[^a-z0-9 ]/g, "");
  const bn = normalise(b).replace(/[^a-z0-9 ]/g, "");
  if (!an || !bn) return false;
  if (an === bn || an.includes(bn) || bn.includes(an)) return true;
  const aWords = new Set(an.split(" ").filter((w) => w.length > 3));
  const bWords = new Set(bn.split(" ").filter((w) => w.length > 3));
  let shared = 0;
  for (const w of aWords) if (bWords.has(w)) shared++;
  return shared >= Math.min(2, Math.min(aWords.size, bWords.size));
}

export type PaymentCheckResult = {
  flag: "CASH_PAYMENT" | "PERSONAL_OR_WALLET_PAYMENT" | null;
  reason: string | null;
};

export function checkPayment(
  payeeName: string | null,
  paymentMethod: string | null,
  institutionName: string
): PaymentCheckResult {
  const method = normalise(paymentMethod ?? "");

  if (CASH_KEYWORDS.some((k) => method.includes(k))) {
    return { flag: "CASH_PAYMENT", reason: "The payment instructions ask for cash, not a traceable bank transfer." };
  }

  if (WALLET_KEYWORDS.some((k) => method.includes(k))) {
    return {
      flag: "PERSONAL_OR_WALLET_PAYMENT",
      reason: "The payment instructions point to a mobile wallet or personal account, not the institution's own bank account.",
    };
  }

  if (payeeName && !looksLikeSameEntity(payeeName, institutionName)) {
    return {
      flag: "PERSONAL_OR_WALLET_PAYMENT",
      reason: `The payee ("${payeeName}") does not appear to be the institution itself.`,
    };
  }

  return { flag: null, reason: null };
}
