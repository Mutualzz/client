import type { PresenceActivity, PresencePayload } from "@mutualzz/types";

const MIN_LYRICS_DURATION_MS = 1000;
const MAX_LYRICS_DURATION_MS = 3_600_000;

export interface LyricLine {
  atMs: number;
  text: string;
}

export interface LyricsResult {
  instrumental: boolean;
  lines: LyricLine[] | null;
}

export interface LyricsTrack {
  trackName: string;
  artistName: string;
  startedAt: number;
  durationMs: number;
}

export const findLyricsActivity = (presence?: PresencePayload | null) =>
  presence?.activities.find(
    (activity) => activity.type === "listening" && activity.syncLyrics,
  ) ?? null;

export function getLyricsTrack(
  activity?: PresenceActivity | null,
): LyricsTrack | null {
  if (!activity || activity.type !== "listening" || !activity.syncLyrics) {
    return null;
  }
  const trackName = activity.details?.trim();
  const artistName = activity.state?.trim();
  const startedAt = activity.timestamps?.start;
  const endsAt = activity.timestamps?.end;
  if (
    !trackName ||
    !artistName ||
    startedAt === undefined ||
    endsAt === undefined
  ) {
    return null;
  }
  const durationMs = Math.round(endsAt - startedAt);
  if (
    durationMs < MIN_LYRICS_DURATION_MS ||
    durationMs > MAX_LYRICS_DURATION_MS
  ) {
    return null;
  }
  return { trackName, artistName, startedAt, durationMs };
}

export const lyricsQueryKey = (track: LyricsTrack) =>
  [
    "lyrics",
    track.trackName,
    track.artistName,
    Math.round(track.durationMs / 1000),
  ] as const;

export function currentLyric(lines: LyricLine[], elapsedMs: number) {
  let currentIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line || line.atMs > elapsedMs) break;
    currentIndex = i;
  }
  const nextLine = lines[currentIndex + 1];
  return {
    text: lines[currentIndex]?.text || null,
    nextInMs: nextLine ? nextLine.atMs - elapsedMs : null,
  };
}
