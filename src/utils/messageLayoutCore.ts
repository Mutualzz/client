import type { MessageDisplay, UiDensity } from "@mutualzz/types";

export const MESSAGE_GROUP_GAP_MS = 7 * 60 * 1000;

export type MessageLayoutNativeStyles = {
  paddingYNative: number;
  headerMarginTopNative: number;
  groupGapNative: number;
};

const MESSAGE_DISPLAY_STYLES: Record<
  MessageDisplay,
  Pick<MessageLayoutNativeStyles, "paddingYNative" | "headerMarginTopNative">
> = {
  default: {
    paddingYNative: 2,
    headerMarginTopNative: 10,
  },
  compact: {
    paddingYNative: 1,
    headerMarginTopNative: 2,
  },
};

const UI_DENSITY_GROUP_GAP: Record<
  UiDensity,
  Pick<MessageLayoutNativeStyles, "groupGapNative">
> = {
  compact: { groupGapNative: 4 },
  default: { groupGapNative: 6 },
  spacious: { groupGapNative: 14 },
};

export function getMessageGroupGapMs(): number {
  return MESSAGE_GROUP_GAP_MS;
}

export function getMessageLayoutNativeStyles(
  messageDisplay: MessageDisplay,
  uiDensity: UiDensity,
): MessageLayoutNativeStyles {
  return {
    ...MESSAGE_DISPLAY_STYLES[messageDisplay],
    ...UI_DENSITY_GROUP_GAP[uiDensity],
  };
}

export function shouldShowMessageAvatar(
  messageDisplay: MessageDisplay,
  header: boolean,
): boolean {
  if (!header) return false;
  if (messageDisplay === "compact") return false;
  return true;
}
