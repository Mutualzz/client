import { MAX_REMINDER_AHEAD_MS } from "@mutualzz/validators";

export type ReminderPreset = "20m" | "1h" | "3h" | "tomorrow" | "1w";

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const MORNING_HOUR = 9;

export const REMINDER_PRESETS: ReminderPreset[] = [
  "20m",
  "1h",
  "3h",
  "tomorrow",
  "1w",
];

export function resolveReminderPreset(
  preset: ReminderPreset,
  now = new Date(),
) {
  switch (preset) {
    case "20m":
      return new Date(now.getTime() + 20 * MINUTE_MS);
    case "1h":
      return new Date(now.getTime() + HOUR_MS);
    case "3h":
      return new Date(now.getTime() + 3 * HOUR_MS);
    case "tomorrow": {
      const target = new Date(now);
      target.setDate(target.getDate() + 1);
      target.setHours(MORNING_HOUR, 0, 0, 0);
      return target;
    }
    case "1w": {
      const target = new Date(now);
      target.setDate(target.getDate() + 7);
      return target;
    }
  }
}

export type MessageSchedulePreset =
  | "tomorrowMorning"
  | "tomorrowAfternoon"
  | "nextMonday";

export const MESSAGE_SCHEDULE_PRESETS: MessageSchedulePreset[] = [
  "tomorrowMorning",
  "tomorrowAfternoon",
  "nextMonday",
];

const AFTERNOON_HOUR = 13;
const MONDAY = 1;
const DAYS_PER_WEEK = 7;

export function resolveMessageSchedulePreset(
  preset: MessageSchedulePreset,
  now = new Date(),
) {
  const target = new Date(now);

  switch (preset) {
    case "tomorrowMorning":
      target.setDate(target.getDate() + 1);
      target.setHours(MORNING_HOUR, 0, 0, 0);
      return target;
    case "tomorrowAfternoon":
      target.setDate(target.getDate() + 1);
      target.setHours(AFTERNOON_HOUR, 0, 0, 0);
      return target;
    case "nextMonday": {
      const daysUntilMonday =
        (MONDAY - target.getDay() + DAYS_PER_WEEK) % DAYS_PER_WEEK ||
        DAYS_PER_WEEK;
      target.setDate(target.getDate() + daysUntilMonday);
      target.setHours(MORNING_HOUR, 0, 0, 0);
      return target;
    }
  }
}

export const MIN_CUSTOM_REMINDER_AHEAD_MS = MINUTE_MS;

export function isValidCustomReminder(remindAt: Date, now = new Date()) {
  const delayMs = remindAt.getTime() - now.getTime();
  return (
    !Number.isNaN(delayMs) &&
    delayMs >= MIN_CUSTOM_REMINDER_AHEAD_MS &&
    delayMs <= MAX_REMINDER_AHEAD_MS
  );
}

export function toDatetimeLocalValue(date: Date) {
  const pad = (value: number) => value.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
