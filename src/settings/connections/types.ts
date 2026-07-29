export type ConnectionProvider = "github" | "twitch" | "steam";

export interface ProviderConnectionDto {
  provider: ConnectionProvider;
  available: boolean;
  connected: boolean;
  displayName: string | null;
  externalUrl: string | null;
  shareOnProfile: boolean;
  expired?: boolean;
}

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

export interface ConnectionsHealthDto {
  github: boolean;
  twitch: boolean;
  steam: boolean;
  spotify: boolean;
}

export interface UserConnectionsDto {
  providers: ProviderConnectionDto[];
}

export const FALLBACK_CONNECTION_PROVIDERS: ConnectionProvider[] = [
  "github",
  "twitch",
  "steam",
];
