export const FREE_MAIL_DOMAINS = [
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "icloud.com",
  "aol.com",
  "protonmail.com",
  "zoho.com",
  "mail.com",
  "yandex.com",
  "gmx.com",
] as const;

export function isFreeMailDomain(domain: string): boolean {
  return (FREE_MAIL_DOMAINS as readonly string[]).includes(domain.toLowerCase());
}
