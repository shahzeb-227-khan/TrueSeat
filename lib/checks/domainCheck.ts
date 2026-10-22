import { levenshtein } from "./levenshtein";
import { isFreeMailDomain } from "./freeMailProviders";

export type DomainCheckResult = "match" | "free_mail" | "lookalike" | "unrelated" | "unknown";

export type DomainCheckOutcome = {
  value: string;
  domain: string | null;
  result: DomainCheckResult;
  matchedDomain: string | null;
};

export function extractDomain(value: string): string | null {
  const emailMatch = value.match(/@([a-z0-9.-]+\.[a-z]{2,})/i);
  if (emailMatch) return emailMatch[1].toLowerCase();
  const urlMatch = value.match(/^(?:https?:\/\/)?(?:www\.)?([a-z0-9.-]+\.[a-z]{2,})/i);
  if (urlMatch) return urlMatch[1].toLowerCase();
  return null;
}

export function matchesOfficial(domain: string, officialDomains: string[]): string | null {
  for (const official of officialDomains) {
    const o = official.toLowerCase();
    if (domain === o || domain.endsWith(`.${o}`)) return official;
  }
  return null;
}

export function isLookalike(domain: string, officialDomains: string[], institutionSlug: string): string | null {
  for (const official of officialDomains) {
    const o = official.toLowerCase();
    const dist = levenshtein(domain, o);
    if (dist > 0 && dist <= 2) return official;
  }
  if (institutionSlug && domain.replace(/[.-]/g, "").includes(institutionSlug.replace(/[.-]/g, ""))) {
    // Looks like it's trying to look official (embeds the institution's name)
    // but isn't on the official domain list at all.
    return officialDomains[0] ?? null;
  }
  return null;
}

export function checkDomain(
  value: string,
  officialDomains: string[],
  institutionSlug: string
): DomainCheckOutcome {
  const domain = extractDomain(value);
  if (!domain) return { value, domain: null, result: "unknown", matchedDomain: null };

  if (isFreeMailDomain(domain)) {
    return { value, domain, result: "free_mail", matchedDomain: null };
  }

  if (officialDomains.length === 0) {
    return { value, domain, result: "unknown", matchedDomain: null };
  }

  const official = matchesOfficial(domain, officialDomains);
  if (official) return { value, domain, result: "match", matchedDomain: official };

  const lookalike = isLookalike(domain, officialDomains, institutionSlug);
  if (lookalike) return { value, domain, result: "lookalike", matchedDomain: lookalike };

  return { value, domain, result: "unrelated", matchedDomain: null };
}

export function checkAllDomains(
  values: string[],
  officialDomains: string[],
  institutionSlug: string
): DomainCheckOutcome[] {
  const unique = Array.from(new Set(values.filter(Boolean)));
  return unique.map((v) => checkDomain(v, officialDomains, institutionSlug));
}
