import { MessageType } from "@mutualzz/types";

export function isChannelPinnedMessage(message: {
  type?: MessageType | number | string | null;
}) {
  return Number(message.type) === MessageType.ChannelPinned;
}
