import Token from "markdown-it/lib/token.mjs";

export interface MarkdownTagDefinition {
  name: string;
  resolve: (value: string) => string | null;
}

interface CharMap {
  tokenIndex: number;
  offset: number;
}

const isBreak = (token: Token) =>
  token.type === "softbreak" || token.type === "hardbreak";

export const createTagRegex = (name: string) =>
  new RegExp(`\\[${name}=([^\\]]+)\\]([\\s\\S]*?)\\[\\/${name}\\]`, "gi");

function buildSearch(children: Token[]) {
  let search = "";
  const map: CharMap[] = [];

  for (let tokenIndex = 0; tokenIndex < children.length; tokenIndex++) {
    const token = children[tokenIndex];

    if (token.type === "text") {
      for (let offset = 0; offset < token.content.length; offset++) {
        map.push({ tokenIndex, offset });
        search += token.content[offset];
      }
      continue;
    }

    if (isBreak(token)) {
      map.push({ tokenIndex, offset: 0 });
      search += "\n";
    }
  }

  return { search, map };
}

function cloneText(token: Token, content: string) {
  const next = new Token("text", "", 0);
  next.content = content;
  next.level = token.level;
  return next;
}

export function processTagTokens(
  children: Token[],
  definition: MarkdownTagDefinition,
) {
  const openMarker = `[${definition.name}=`;
  const closeMarker = `[/${definition.name}]`;
  const openType = `${definition.name}_open`;
  const closeType = `${definition.name}_close`;

  const recurse = () => {
    for (const token of children) {
      if (token.children) processTagTokens(token.children, definition);
    }
  };

  const { search, map } = buildSearch(children);
  if (!search.includes(openMarker)) return recurse();

  const matches: {
    start: number;
    openEnd: number;
    closeStart: number;
    end: number;
    value: string;
  }[] = [];

  const tagRegex = createTagRegex(definition.name);
  let match: RegExpExecArray | null;
  while ((match = tagRegex.exec(search))) {
    const resolved = definition.resolve(match[1]);
    if (!resolved) continue;

    const start = match.index;
    const openEnd =
      start + match[0].length - match[2].length - closeMarker.length;
    const closeStart = openEnd + match[2].length;
    const end = closeStart + closeMarker.length;

    matches.push({ start, openEnd, closeStart, end, value: resolved });
  }

  if (matches.length === 0) return recurse();

  const createOpen = (level: number, value: string) => {
    const openToken = new Token(openType, "", 1);
    openToken.level = level;
    openToken.attrSet(definition.name, value);
    return openToken;
  };

  const createClose = (level: number) => {
    const closeToken = new Token(closeType, "", -1);
    closeToken.level = level;
    return closeToken;
  };

  const next: Token[] = [];
  let matchIndex = 0;
  let i = 0;

  while (i < children.length) {
    const active = matches[matchIndex];
    if (!active) {
      next.push(children[i]);
      i += 1;
      continue;
    }

    const openMap = map[active.start];
    const closeMap = map[active.closeStart];

    if (i < openMap.tokenIndex) {
      next.push(children[i]);
      i += 1;
      continue;
    }

    if (i === openMap.tokenIndex) {
      const openToken = children[i];
      if (openToken.type === "text" && openMap.offset > 0) {
        next.push(
          cloneText(openToken, openToken.content.slice(0, openMap.offset)),
        );
      }

      next.push(createOpen(openToken.level, active.value));

      const openEndMap = map[active.openEnd - 1];
      const afterOpenOffset = openEndMap.offset + 1;

      if (openMap.tokenIndex === closeMap.tokenIndex) {
        const inner = openToken.content.slice(afterOpenOffset, closeMap.offset);
        if (inner) next.push(cloneText(openToken, inner));

        next.push(createClose(openToken.level));

        const afterClose = openToken.content.slice(
          closeMap.offset + closeMarker.length,
        );
        if (afterClose) next.push(cloneText(openToken, afterClose));

        i += 1;
        matchIndex += 1;
        continue;
      }

      const afterOpen = openToken.content.slice(afterOpenOffset);
      if (afterOpen) next.push(cloneText(openToken, afterOpen));
      i += 1;

      while (i < closeMap.tokenIndex) {
        next.push(children[i]);
        i += 1;
      }

      const closeToken = children[i];
      if (closeToken.type === "text") {
        const beforeClose = closeToken.content.slice(0, closeMap.offset);
        if (beforeClose) next.push(cloneText(closeToken, beforeClose));

        next.push(createClose(closeToken.level));

        const afterClose = closeToken.content.slice(
          closeMap.offset + closeMarker.length,
        );
        if (afterClose) next.push(cloneText(closeToken, afterClose));
      } else {
        next.push(createClose(closeToken.level));
        next.push(closeToken);
      }

      i += 1;
      matchIndex += 1;
      continue;
    }

    next.push(children[i]);
    i += 1;
  }

  children.splice(0, children.length, ...next);
  recurse();
}
