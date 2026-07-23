export type ConnectionProvider = "github" | "twitch" | "steam";

export type ProviderConnectionDto = {
  provider: ConnectionProvider;
  available: boolean;
  connected: boolean;
  displayName: string | null;
  externalUrl: string | null;
  shareOnProfile: boolean;
  expired?: boolean;
};

export type SpotifyConnectionDto =
  | { connected: false; available: boolean }
  | {
      connected: true;
      displayName: string | null;
      externalUrl: string | null;
      shareSpotify: boolean;
      available: boolean;
      expired?: boolean;
    };

export type ConnectionsHealthDto = {
  github: boolean;
  twitch: boolean;
  steam: boolean;
  spotify: boolean;
};

export type UserConnectionsDto = {
  providers: ProviderConnectionDto[];
};

export const FALLBACK_CONNECTION_PROVIDERS: ConnectionProvider[] = [
  "github",
  "twitch",
  "steam",
];
