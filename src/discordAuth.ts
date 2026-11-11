export type DiscordOAuthExchangeResult =
  | { result: "token"; token: string; client: string }
  | { result: "pending"; pendingId: string; client: string }
  | { result: "linked"; client: string }
  | { result: "import"; guildId: string; client: string }
  | { result: "error"; error: string; client: string; email?: string };

export function discordOAuthNativeReturnUrl(
  result: DiscordOAuthExchangeResult,
): string | null {
  if (result.client !== "desktop" && result.client !== "mobile") return null;

  const params = new URLSearchParams();

  switch (result.result) {
    case "token":
      params.set("token", result.token);
      break;
    case "pending":
      params.set("pending", result.pendingId);
      break;
    case "linked":
      params.set("linked", "1");
      break;
    case "import":
      params.set("import", result.guildId);
      break;
    case "error":
      params.set("error", result.error);
      if (result.email) params.set("email", result.email);
      break;
    default:
      return null;
  }

  return `mutualzz://auth/discord?${params}`;
}

export function isNativeDiscordOAuthClient(client: string) {
  return client === "desktop" || client === "mobile";
}
