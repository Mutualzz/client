export const minecraftAvatarUrl = (uuid: string): string => {
  const id = uuid.trim().toLowerCase().replace(/-/g, "");
  return `https://minotar.net/cube/${id}/128.png`;
};

export const minecraftSkinUrl = (uuid: string): string => {
  const id = uuid.trim().toLowerCase().replace(/-/g, "");
  return `https://minotar.net/skin/${id}`;
};

export const minecraftServerLabel = (server: {
  serverId: string;
  displayName?: string | null;
}) => server.displayName?.trim() || server.serverId;
