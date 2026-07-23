export function connectionErrorMessage(
  err: { message?: string } | undefined,
  fallback: string,
  t: (key: string) => string,
) {
  const message = err?.message?.toLowerCase() ?? "";
  if (message.includes("steam") && message.includes("openid")) {
    return t("connections.errors.steamOpenId");
  }
  if (message.includes("twitch") && message.includes("redirect")) {
    return t("connections.errors.twitchRedirect");
  }
  if (
    message.includes("revoked") ||
    message.includes("invalid_grant") ||
    message.includes("auth expired")
  ) {
    return t("connections.errors.revoked");
  }
  return err?.message || fallback;
}
