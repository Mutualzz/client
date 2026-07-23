import type {
  APIUserSettings,
  AppMode,
  UserExtendedSettings,
} from "@mutualzz/types";

import type { ObservableOrderedSet } from "../collections/ObservableOrderedSet";

export type AccountSettingsPatch = Omit<APIUserSettings, "updatedAt">;

export type AccountSettingsPayloadSource = {
  spacePositions: ObservableOrderedSet<string>;
  preferredMode: AppMode;
  preferEmbossed: boolean;
  currentTheme?: string | null;
  currentIcon?: string | null;
  preferredSelfMute: boolean;
  preferredSelfDeaf: boolean;
  pushEnabled: boolean;
  pushDirectMessages: boolean;
  pushMentions: boolean;
  shareActivity: boolean;
  shareRecentActivity: boolean;
  favoriteEmojis: readonly string[];
  favoriteGifs: readonly string[];
  favoriteStickers: readonly string[];
  extendedSettings: UserExtendedSettings;
};

export function buildAccountSettingsPatch(
  source: AccountSettingsPayloadSource,
): AccountSettingsPatch {
  return {
    spacePositions: source.spacePositions.toArray(),
    preferredMode: source.preferredMode,
    preferEmbossed: source.preferEmbossed,
    currentTheme: source.currentTheme,
    currentIcon: source.currentIcon,
    preferredSelfMute: source.preferredSelfMute,
    preferredSelfDeaf: source.preferredSelfDeaf,
    pushEnabled: source.pushEnabled,
    pushDirectMessages: source.pushDirectMessages,
    pushMentions: source.pushMentions,
    shareActivity: source.shareActivity,
    shareRecentActivity: source.shareRecentActivity,
    favoriteEmojis: [...source.favoriteEmojis],
    favoriteGifs: [...source.favoriteGifs],
    favoriteStickers: [...source.favoriteStickers],
    extendedSettings: { ...source.extendedSettings },
  };
}

export function computeSettingsHash(payload: AccountSettingsPatch): string {
  return JSON.stringify(payload);
}

export function extendedSettingEquals(
  a: UserExtendedSettings[keyof UserExtendedSettings],
  b: UserExtendedSettings[keyof UserExtendedSettings],
): boolean {
  if (Array.isArray(a) || Array.isArray(b)) {
    return JSON.stringify(a) === JSON.stringify(b);
  }
  return a === b;
}

export function mergeRemoteExtendedSettings(
  current: UserExtendedSettings,
  synced: UserExtendedSettings | null | undefined,
  remote: Partial<UserExtendedSettings>,
): Partial<UserExtendedSettings> | null {
  if (!synced) return null;

  const patch: Partial<UserExtendedSettings> = {};

  for (const key of Object.keys(remote) as (keyof UserExtendedSettings)[]) {
    const remoteValue = remote[key];
    if (remoteValue === undefined) continue;
    const syncedValue = synced[key];
    const currentValue = current[key];
    if (extendedSettingEquals(currentValue, syncedValue)) {
      (patch as Record<string, unknown>)[key] = remoteValue;
    }
  }

  if (Object.keys(patch).length === 0) return null;
  return patch;
}

export type AccountSettingsSyncHost = {
  account: { id: string } | null;
  rest: {
    patch<TRes, TBody>(path: string, body: TBody): Promise<TRes | null>;
  };
};

export type AccountSettingsSyncActions = {
  getPayload: () => AccountSettingsPatch;
  applyServerUpdate: (settings: APIUserSettings) => void;
  applyLocalOverrides: (payload: AccountSettingsPatch) => void;
  onSyncFailed: () => void;
};

export class AccountSettingsSyncEngine {
  private lastSyncedHash: string;
  private lastSyncedSnapshot: AccountSettingsPatch;
  private syncInFlight = false;
  private syncQueued = false;

  constructor(initialPayload: AccountSettingsPatch) {
    this.lastSyncedSnapshot = initialPayload;
    this.lastSyncedHash = computeSettingsHash(initialPayload);
  }

  get syncedSnapshot() {
    return this.lastSyncedSnapshot;
  }

  markSynced(payload: AccountSettingsPatch) {
    this.lastSyncedSnapshot = payload;
    this.lastSyncedHash = computeSettingsHash(payload);
  }

  isDirty(payload: AccountSettingsPatch): boolean {
    return computeSettingsHash(payload) !== this.lastSyncedHash;
  }

  getPendingOverrides(
    payload: AccountSettingsPatch,
  ): AccountSettingsPatch | null {
    return this.isDirty(payload) ? payload : null;
  }

  async sync(
    actions: AccountSettingsSyncActions,
    host: AccountSettingsSyncHost,
  ) {
    if (!host.account) return;

    const payload = actions.getPayload();
    if (!this.isDirty(payload)) return;

    if (this.syncInFlight) {
      this.syncQueued = true;
      return;
    }

    this.syncInFlight = true;
    const snapshot = this.lastSyncedSnapshot;

    try {
      const res = await host.rest.patch<APIUserSettings, AccountSettingsPatch>(
        "/@me/settings",
        payload,
      );

      if (res) {
        actions.applyServerUpdate(res);
        return;
      }

      throw new Error("Settings sync failed");
    } catch {
      actions.applyLocalOverrides(snapshot);
      this.markSynced(snapshot);
      actions.onSyncFailed();
    } finally {
      this.syncInFlight = false;
      if (this.syncQueued) {
        this.syncQueued = false;
        void this.sync(actions, host);
      }
    }
  }
}

export function favoriteEmojiKey(
  unified: string,
  skinTone: string | null = null,
) {
  return unified.startsWith("custom:")
    ? unified
    : `${unified}:${skinTone ?? ""}`;
}

export function toggleFavoriteEmoji(
  favorites: string[],
  unified: string,
  skinTone: string | null = null,
) {
  const key = favoriteEmojiKey(unified, skinTone);
  const idx = favorites.indexOf(key);
  if (idx === -1) return [...favorites, key];
  return favorites.filter((_, i) => i !== idx);
}

export function isFavoriteEmoji(
  favorites: readonly string[],
  unified: string,
  skinTone: string | null = null,
) {
  return favorites.includes(favoriteEmojiKey(unified, skinTone));
}

export function toggleFavoriteGif(favorites: string[], entry: string) {
  const url = entry.split("|")[0];
  const idx = favorites.findIndex((f) => f.split("|")[0] === url);
  if (idx === -1) return [...favorites, entry];
  return favorites.filter((_, i) => i !== idx);
}

export function isFavoriteGif(favorites: readonly string[], url: string) {
  const bare = url.split("|")[0];
  return favorites.some((f) => f.split("|")[0] === bare);
}

export function moveSpaceOrder(
  items: readonly string[],
  fromIndex: number,
  toIndex: number,
): string[] | null {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= items.length ||
    toIndex >= items.length
  ) {
    return null;
  }

  const next = [...items];
  const [removed] = next.splice(fromIndex, 1);
  if (removed == null) return null;
  next.splice(toIndex, 0, removed);
  return next;
}

export function resetSpaceOrder(spaceIds: readonly string[]) {
  return [...spaceIds].sort();
}
