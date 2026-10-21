import { describe, expect, it } from "vitest";
import { checkDomain } from "@/lib/checks/domainCheck";

describe("checkDomain", () => {
  const officialDomains = ["ox.ac.uk"];

  it("matches the official domain", () => {
    expect(checkDomain("admissions@ox.ac.uk", officialDomains, "oxford").result).toBe("match");
  });

  it("matches a subdomain of the official domain", () => {
    expect(checkDomain("someone@admissions.ox.ac.uk", officialDomains, "oxford").result).toBe("match");
  });

  it("flags a free-mail sender", () => {
    expect(checkDomain("admissions.office.uk@gmail.com", officialDomains, "oxford").result).toBe("free_mail");
  });

  it("flags a look-alike domain by edit distance", () => {
    expect(checkDomain("admissions@0x.ac.uk", officialDomains, "oxford").result).toBe("lookalike");
  });

  it("flags a look-alike domain that embeds the institution name", () => {
    expect(checkDomain("info@oxford-admissions.co", officialDomains, "oxford").result).toBe("lookalike");
  });

  it("returns unknown, never mismatch, when there is no domain data", () => {
    expect(checkDomain("someone@example.com", [], "oxford").result).toBe("unknown");
  });

  it("returns unrelated for an unrelated real domain", () => {
    expect(checkDomain("someone@example.com", officialDomains, "oxford").result).toBe("unrelated");
  });
});
