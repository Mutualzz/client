import type Token from "markdown-it/lib/token.mjs";
import { resolveMarkdownTextColor } from "@mutualzz/validators";
import { processTagTokens } from "./tags";

export const COLOR_RE = /\[color=([^\]]+)\]([\s\S]*?)\[\/color\]/gi;
export const COLOR_CLOSE = "[/color]";

export function processColorTokens(children: Token[]) {
  processTagTokens(children, {
    name: "color",
    resolve: resolveMarkdownTextColor,
  });
}
