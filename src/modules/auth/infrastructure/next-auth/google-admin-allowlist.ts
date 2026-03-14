function normalizeEmailAddress(email: string): string {
  return email.trim().toLowerCase();
}

export function getGoogleAdminEmailAllowlist(
  envValue = process.env.GOOGLE_ADMIN_EMAIL_ALLOWLIST,
): string[] {
  if (!envValue) {
    return [];
  }

  return envValue
    .split(",")
    .map((email) => normalizeEmailAddress(email))
    .filter(Boolean);
}

export function isGoogleAdminEmail(
  email: string,
  envValue = process.env.GOOGLE_ADMIN_EMAIL_ALLOWLIST,
): boolean {
  const normalizedEmail = normalizeEmailAddress(email);

  return getGoogleAdminEmailAllowlist(envValue).includes(normalizedEmail);
}
