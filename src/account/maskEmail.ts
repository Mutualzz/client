export function maskEmail(email: string) {
  const atIndex = email.indexOf("@");
  if (atIndex === -1) return "****";

  const domain = email.slice(atIndex + 1);
  if (!domain) return "****";

  return `${"*".repeat(atIndex)}@${domain}`;
}
