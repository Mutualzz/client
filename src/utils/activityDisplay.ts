import type { PresenceActivity, PresenceActivityType } from "@mutualzz/types";

export function activityTypeLabelKey(
  type: PresenceActivityType,
): "activity.playing" | "activity.listening" | null {
  if (type === "playing") return "activity.playing";
  if (type === "listening") return "activity.listening";
  return null;
}

export function formatActivityPrimary(activity: PresenceActivity): string {
  return activity.name;
}

export function formatActivitySecondary(
  activity: PresenceActivity,
): string | null {
  const details = activity.details?.trim();
  const state = activity.state?.trim();
  if (details && state && details !== state) return `${details} · ${state}`;
  return details || state || null;
}

export function formatActivityCompact(activity: PresenceActivity): string {
  const secondary = formatActivitySecondary(activity);
  if (secondary) return `${activity.name} · ${secondary}`;
  return activity.name;
}

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

export function formatActivityElapsedClock(
  start: number | undefined,
  now: number,
): string | null {
  if (start == null || !Number.isFinite(start) || start > now) return null;
  return formatTrackClock(now - start);
}

export function formatActivityDuration(
  startedAt: number | null | undefined,
  endedAt: number,
): string | null {
  if (startedAt == null || !Number.isFinite(startedAt) || startedAt > endedAt) {
    return null;
  }
  return formatActivityElapsedClock(startedAt, endedAt);
}

export function formatTrackClock(totalMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(totalMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return hours > 0
    ? `${hours}:${pad2(minutes)}:${pad2(seconds)}`
    : `${minutes}:${pad2(seconds)}`;
}

export interface ActivityProgress {
  elapsedMs: number;
  durationMs: number;
  fraction: number;
}

export function getActivityProgress(
  activity: PresenceActivity,
  now: number,
): ActivityProgress | null {
  const start = activity.timestamps?.start;
  const end = activity.timestamps?.end;
  if (start == null || end == null || end <= start) return null;

  const durationMs = end - start;
  const elapsedMs = Math.min(Math.max(now - start, 0), durationMs);
  return { elapsedMs, durationMs, fraction: elapsedMs / durationMs };
}

export function activityLinkHost(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}
