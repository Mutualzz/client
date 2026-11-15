import type Token from "markdown-it/lib/token.mjs";
import { DISPLAY_NAME_EFFECTS } from "@mutualzz/types";
import { processTagTokens } from "./tags";

export const EFFECT_RE = /\[effect=([^\]]+)\]([\s\S]*?)\[\/effect\]/gi;
export const EFFECT_CLOSE = "[/effect]";

export const resolveMarkdownTextEffect = (input: string): string | null => {
  const value = input.trim().toLowerCase();
  return (DISPLAY_NAME_EFFECTS as readonly string[]).includes(value)
    ? value
    : null;
};

export function processEffectTokens(children: Token[]) {
  processTagTokens(children, {
    name: "effect",
    resolve: resolveMarkdownTextEffect,
  });
}
