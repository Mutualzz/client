import type {
  DmPrivacy,
  MessageDisplay,
  ProfileVisibility,
  TimestampFormat,
  UiDensity,
} from "@mutualzz/types";

export function messageDisplayLabelKey(value: MessageDisplay) {
  return value === "compact"
    ? "textAndChat.messageDisplayCompact"
    : "textAndChat.messageDisplayDefault";
}

export function timestampFormatLabelKey(value: TimestampFormat) {
  if (value === "absolute") return "textAndChat.timestampAbsolute";
  return "textAndChat.timestampRelative";
}

export function uiDensityLabelKey(value: UiDensity) {
  if (value === "compact") return "appearance.uiDensityCompact";
  if (value === "spacious") return "appearance.uiDensitySpacious";
  return "appearance.uiDensityDefault";
}

export function privacyLabelKey(value: DmPrivacy | ProfileVisibility) {
  if (value === "friends") return "privacy.privacyFriends";
  if (value === "nobody") return "privacy.privacyNobody";
  return "privacy.privacyEveryone";
}
