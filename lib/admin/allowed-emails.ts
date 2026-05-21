/** Primary superadmin (Google sign-in). Always allowed. */
export const DEFAULT_SUPERADMIN_EMAIL = "olawaleoluwaseyi24@gmail.com";

function parseAdminEmails(): Set<string> {
  const allowed = new Set<string>([DEFAULT_SUPERADMIN_EMAIL.toLowerCase()]);
  const raw = process.env.ADMIN_EMAILS?.trim();
  if (!raw) {
    return allowed;
  }
  for (const entry of raw.split(",")) {
    const email = entry.trim().toLowerCase();
    if (email) {
      allowed.add(email);
    }
  }
  return allowed;
}

export function isAdminAccessConfigured(): boolean {
  return true;
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) {
    return false;
  }
  return parseAdminEmails().has(email.trim().toLowerCase());
}

export function getAdminEmails(): string[] {
  return [...parseAdminEmails()];
}
