import { addMinutes, format, isBefore, parseISO } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";

/** "HH:mm" -> minutes since midnight */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** minutes since midnight -> "HH:mm" */
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

/**
 * Combine a calendar date ("yyyy-MM-dd") and a wall-clock time ("HH:mm") in
 * the business's timezone into the correct absolute UTC instant.
 */
export function localDateTimeToUtc(dateStr: string, time: string, timezone: string): Date {
  return fromZonedTime(`${dateStr}T${time}:00`, timezone);
}

/** The calendar date ("yyyy-MM-dd") of a UTC instant, in the business timezone. */
export function utcToLocalDateStr(date: Date, timezone: string): string {
  return format(toZonedTime(date, timezone), "yyyy-MM-dd");
}

/** The wall-clock time ("HH:mm") of a UTC instant, in the business timezone. */
export function utcToLocalTimeStr(date: Date, timezone: string): string {
  return format(toZonedTime(date, timezone), "HH:mm");
}

export function formatInTz(date: Date, timezone: string, fmt: string): string {
  return format(toZonedTime(date, timezone), fmt);
}

/** Day of week in the business timezone: 0 = Sunday .. 6 = Saturday. */
export function dayOfWeekInTz(dateStr: string): number {
  // dateStr is a plain calendar date (yyyy-MM-dd); weekday is timezone-agnostic
  // once we're working with a calendar date rather than an instant.
  const d = parseISO(dateStr);
  return d.getUTCDay();
}

export function nowInTz(timezone: string): Date {
  return toZonedTime(new Date(), timezone);
}

export function isPast(date: Date): boolean {
  return isBefore(date, new Date());
}

export { addMinutes };
