import type { ClientPreferences } from "@mutualzz/types";

export const messagesSettingsFields = [
  "messageDisplay",
  "chatFontScale",
  "timestampFormat",
  "showLinkEmbeds",
  "gifAutoplay",
  "revealAllSpoilers",
  "showTypingIndicators",
  "sendTypingIndicators",
  "showEmojiPicker",
  "showGifPicker",
  "showStickerPicker",
  "replyWithMention",
  "quickReactionEmojis",
  "showMarkdownToolbar",
] as const satisfies readonly (keyof ClientPreferences)[];

export const privacySettingsFields = [
  "whoCanDm",
  "profileVisibility",
] as const;

export const appearanceSettingsFields = [
  "convertEmoticons",
  "uiDensity",
  "defaultMemberListVisible",
  "reducedMotion",
  "highContrast",
] as const satisfies readonly (keyof ClientPreferences)[];

export type MessagesSettingsField = (typeof messagesSettingsFields)[number];
export type PrivacySettingsField = (typeof privacySettingsFields)[number];
export type AppearanceSettingsField = (typeof appearanceSettingsFields)[number];

export type MessagesSettingsPatch = Pick<
  ClientPreferences,
  MessagesSettingsField
>;

export type AppearanceSettingsPatch = Pick<
  ClientPreferences,
  AppearanceSettingsField
>;

export const messagesExtendedSettingsFields = messagesSettingsFields;
export const privacyExtendedSettingsFields = privacySettingsFields;
export const appearanceExtendedSettingsFields = appearanceSettingsFields;
export type MessagesExtendedSettingsField = MessagesSettingsField;
export type PrivacyExtendedSettingsField = PrivacySettingsField;
export type AppearanceExtendedSettingsField = AppearanceSettingsField;
export type MessagesExtendedSettingsPatch = MessagesSettingsPatch;
export type AppearanceExtendedSettingsPatch = AppearanceSettingsPatch;
export interface PrivacyExtendedSettingsPatch {
  whoCanDm?: "everyone" | "friends" | "nobody";
  profileVisibility?: "everyone" | "friends" | "nobody";
}
