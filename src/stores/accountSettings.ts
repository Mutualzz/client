import type { APIUserSettings } from "@mutualzz/types";
import {
  CLIENT_PREFERENCE_KEYS,
  PRIVACY_SETTING_KEYS,
  SYNCED_COLUMN_KEYS,
} from "@mutualzz/types";

import type { ObservableOrderedSet } from "../collections/ObservableOrderedSet";

export type AccountSettingsPatch = Omit<APIUserSettings, "updatedAt">;

export type AccountSettingsPayloadSource = Omit<
  AccountSettingsPatch,
  "spacePositions"
> & {
  spacePositions: ObservableOrderedSet<string>;
};

export const SYNCED_SETTINGS_KEYS = [
  ...SYNCED_COLUMN_KEYS,
  ...CLIENT_PREFERENCE_KEYS,
] as const;

export type SyncedSettingsKey = (typeof SYNCED_SETTINGS_KEYS)[number];

export function buildAccountSettingsPatch(
  source: AccountSettingsPayloadSource,
): AccountSettingsPatch {
  return {
    spacePositions: source.spacePositions.toArray(),
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
    whoCanDm: source.whoCanDm,
    profileVisibility: source.profileVisibility,
    convertEmoticons: source.convertEmoticons,
    uiDensity: source.uiDensity,
    messageDisplay: source.messageDisplay,
    chatFontScale: source.chatFontScale,
    timestampFormat: source.timestampFormat,
    showLinkEmbeds: source.showLinkEmbeds,
    gifAutoplay: source.gifAutoplay,
    revealAllSpoilers: source.revealAllSpoilers,
    showTypingIndicators: source.showTypingIndicators,
    sendTypingIndicators: source.sendTypingIndicators,
    replyWithMention: source.replyWithMention,
    quickReactionEmojis: [...source.quickReactionEmojis],
    showEmojiPicker: source.showEmojiPicker,
    showGifPicker: source.showGifPicker,
    showStickerPicker: source.showStickerPicker,
    showMarkdownToolbar: source.showMarkdownToolbar,
    reducedMotion: source.reducedMotion,
    highContrast: source.highContrast,
    defaultMemberListVisible: source.defaultMemberListVisible,
    showRoleColorsInMessages: source.showRoleColorsInMessages,
  };
}

export function computeSettingsHash(payload: AccountSettingsPatch): string {
  return JSON.stringify(payload);
}

export function settingValueEquals(a: unknown, b: unknown): boolean {
  if (Array.isArray(a) || Array.isArray(b)) {
    return JSON.stringify(a) === JSON.stringify(b);
  }
  return a === b;
}

export function mergeRemoteSettings(
  current: AccountSettingsPatch,
  synced: AccountSettingsPatch | null | undefined,
  remote: Partial<AccountSettingsPatch>,
): Partial<AccountSettingsPatch> | null {
  if (!synced) return null;

  const patch: Partial<AccountSettingsPatch> = {};

  for (const key of SYNCED_SETTINGS_KEYS) {
    const remoteValue = remote[key];
    if (remoteValue === undefined) continue;
    if (settingValueEquals(current[key], synced[key])) {
      (patch as Record<string, unknown>)[key] = remoteValue;
    }
  }

  if (Object.keys(patch).length === 0) return null;
  return patch;
}

export function mergeRemoteExtendedSettings(
  current: Pick<AccountSettingsPatch, (typeof CLIENT_PREFERENCE_KEYS)[number]>,
  synced: Pick<
    AccountSettingsPatch,
    (typeof CLIENT_PREFERENCE_KEYS)[number]
  > | null,
  remote: Partial<
    Pick<AccountSettingsPatch, (typeof CLIENT_PREFERENCE_KEYS)[number]>
  >,
) {
  if (!synced) return null;

  const patch: Partial<
    Pick<AccountSettingsPatch, (typeof CLIENT_PREFERENCE_KEYS)[number]>
  > = {};

  for (const key of CLIENT_PREFERENCE_KEYS) {
    const remoteValue = remote[key];
    if (remoteValue === undefined) continue;
    if (settingValueEquals(current[key], synced[key])) {
      (patch as Record<string, unknown>)[key] = remoteValue;
    }
  }

  if (Object.keys(patch).length === 0) return null;
  return patch;
}

export function applySettingsFromApi(
  target: AccountSettingsPayloadSource,
  settings: APIUserSettings,
) {
  target.currentTheme = settings.currentTheme ?? "baseDark";
  target.currentIcon = settings.currentIcon;
  target.preferEmbossed = settings.preferEmbossed ?? true;
  target.preferredSelfMute = settings.preferredSelfMute ?? false;
  target.preferredSelfDeaf = settings.preferredSelfDeaf ?? false;
  target.pushEnabled = settings.pushEnabled ?? true;
  target.pushDirectMessages = settings.pushDirectMessages ?? true;
  target.pushMentions = settings.pushMentions ?? true;
  target.shareActivity = settings.shareActivity ?? true;
  target.shareRecentActivity = settings.shareRecentActivity ?? true;
  target.whoCanDm = settings.whoCanDm;
  target.profileVisibility = settings.profileVisibility;
  target.convertEmoticons = settings.convertEmoticons;
  target.uiDensity = settings.uiDensity;
  target.messageDisplay = settings.messageDisplay;
  target.chatFontScale = settings.chatFontScale;
  target.timestampFormat = settings.timestampFormat;
  target.showLinkEmbeds = settings.showLinkEmbeds;
  target.gifAutoplay = settings.gifAutoplay;
  target.revealAllSpoilers = settings.revealAllSpoilers;
  target.showTypingIndicators = settings.showTypingIndicators;
  target.sendTypingIndicators = settings.sendTypingIndicators;
  target.replyWithMention = settings.replyWithMention;
  target.quickReactionEmojis.splice(
    0,
    target.quickReactionEmojis.length,
    ...settings.quickReactionEmojis,
  );
  target.showEmojiPicker = settings.showEmojiPicker;
  target.showGifPicker = settings.showGifPicker;
  target.showStickerPicker = settings.showStickerPicker;
  target.showMarkdownToolbar = settings.showMarkdownToolbar;
  target.reducedMotion = settings.reducedMotion;
  target.highContrast = settings.highContrast;
  target.defaultMemberListVisible = settings.defaultMemberListVisible;
  target.showRoleColorsInMessages = settings.showRoleColorsInMessages;
}

export interface AccountSettingsSyncHost {
  account: { id: string } | null;
  rest: {
    patch<TRes, TBody>(path: string, body: TBody): Promise<TRes | null>;
  };
}

export interface AccountSettingsSyncActions {
  getPayload: () => AccountSettingsPatch;
  applyServerUpdate: (settings: APIUserSettings) => void;
  applyLocalOverrides: (payload: AccountSettingsPatch) => void;
  onSyncFailed: () => void;
}

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

export const extendedSettingEquals = settingValueEquals;
