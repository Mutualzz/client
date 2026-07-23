import type { UserExtendedSettings } from "@mutualzz/types";

export const messagesExtendedSettingsFields = [
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
] as const satisfies readonly (keyof UserExtendedSettings)[];

export const privacyExtendedSettingsFields = [
  "whoCanDm",
  "profileVisibility",
] as const satisfies readonly (keyof UserExtendedSettings)[];

export const appearanceExtendedSettingsFields = [
  "convertEmoticons",
  "uiDensity",
  "defaultMemberListVisible",
  "reducedMotion",
  "highContrast",
] as const satisfies readonly (keyof UserExtendedSettings)[];

export type MessagesExtendedSettingsField =
  (typeof messagesExtendedSettingsFields)[number];

export type PrivacyExtendedSettingsField =
  (typeof privacyExtendedSettingsFields)[number];

export type AppearanceExtendedSettingsField =
  (typeof appearanceExtendedSettingsFields)[number];

export type MessagesExtendedSettingsPatch = Pick<
  UserExtendedSettings,
  MessagesExtendedSettingsField
>;

export type PrivacyExtendedSettingsPatch = Pick<
  UserExtendedSettings,
  PrivacyExtendedSettingsField
>;

export type AppearanceExtendedSettingsPatch = Pick<
  UserExtendedSettings,
  AppearanceExtendedSettingsField
>;
