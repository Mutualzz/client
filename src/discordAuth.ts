export type DiscordOAuthExchangeResult =
  | { result: "token"; token: string; client: string }
  | { result: "pending"; pendingId: string; client: string }
  | { result: "linked"; client: string }
  | { result: "error"; error: string; client: string; email?: string };

export function discordOAuthNativeReturnUrl(
  result: DiscordOAuthExchangeResult,
): string | null {
  if (result.client !== "desktop" && result.client !== "mobile") return null;

  const params = new URLSearchParams();
  if (result.result === "token") {
    params.set("token", result.token);
  } else if (result.result === "pending") {
    params.set("pending", result.pendingId);
  } else if (result.result === "linked") {
    params.set("linked", "1");
  } else if (result.result === "error") {
    params.set("error", result.error);
    if (result.email) params.set("email", result.email);
  } else {
    return null;
  }

  return `mutualzz://auth/discord?${params}`;
}

export function isNativeDiscordOAuthClient(client: string) {
  return client === "desktop" || client === "mobile";
}
