import type { APIMessage, Snowflake as SnowflakeId } from "@mutualzz/types";
import { MessageType } from "@mutualzz/types";
import SnowflakeUtil from "./Snowflake";

interface SystemMessageUsers {
  resolveSystem(): Promise<{
    id: SnowflakeId;
    toJSON(): APIMessage["author"];
  } | null>;
}

export const createSystemMessage = async (
  users: SystemMessageUsers,
  channelId: string,
  content: string,
  flags?: bigint,
): Promise<APIMessage | null> => {
  const systemUser = await users.resolveSystem();
  if (!systemUser) return null;

  return {
    author: systemUser.toJSON(),
    authorId: systemUser.id,
    channelId,
    embeds: [],
    content,
    edited: false,
    id: SnowflakeUtil.generate(),
    nonce: null,
    spaceId: null,
    type: MessageType.System,
    flags: flags || 0n,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};
