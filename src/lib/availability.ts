import type { BlockedPeriod, Booking } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { calculatePrice } from "@/lib/pricing";
import type { BusinessSettings } from "@/lib/settings";
import {
  addMinutes,
  dayOfWeekInTz,
  localDateTimeToUtc,
  minutesToTime,
  timeToMinutes,
  utcToLocalDateStr,
  utcToLocalTimeStr,
} from "@/lib/time";

export interface OpeningWindow {
  closed: boolean;
  open: string | null; // "HH:mm"
  close: string | null; // "HH:mm"
}

/** Resolve the opening window for a given activity on a given calendar date. */
export async function getOpeningWindow(
  activityId: string,
  dateStr: string
): Promise<OpeningWindow> {
  const dayOfWeek = dayOfWeekInTz(dateStr);

  // 1. Date-specific override: activity-specific wins over venue-wide.
  const [activityOverride, venueOverride] = await Promise.all([
    prisma.dateOverride.findUnique({ where: { activityId_date: { activityId, date: new Date(dateStr) } } }),
    prisma.dateOverride.findFirst({ where: { activityId: null, date: new Date(dateStr) } }),
  ]);

  const override = activityOverride ?? venueOverride;
  if (override) {
    if (override.isClosed) return { closed: true, open: null, close: null };
    if (override.openTime && override.closeTime) {
      return { closed: false, open: override.openTime, close: override.closeTime };
    }
  }

  // 2. Weekly opening hours: activity-specific wins over venue-wide default.
  const [activityHours, venueHours] = await Promise.all([
    prisma.openingHours.findUnique({ where: { activityId_dayOfWeek: { activityId, dayOfWeek } } }),
    prisma.openingHours.findFirst({ where: { activityId: null, dayOfWeek } }),
  ]);

  const hours = activityHours ?? venueHours;
  if (!hours || hours.isClosed || !hours.openTime || !hours.closeTime) {
    return { closed: true, open: null, close: null };
  }

  return { closed: false, open: hours.openTime, close: hours.closeTime };
}

export interface SlotResult {
  time: string; // "HH:mm" local
  available: boolean;
  price: number;
  availableResourceIds: string[];
}

interface OverlapWindow {
  resourceId: string;
  start: Date;
  end: Date;
}

/** Expand recurring weekly blocks into concrete occurrences overlapping [rangeStart, rangeEnd). */
function materializeBlocks(
  blocks: BlockedPeriod[],
  dateStr: string,
  timezone: string
): OverlapWindow[] {
  const out: OverlapWindow[] = [];
  const targetDow = dayOfWeekInTz(dateStr);

  for (const block of blocks) {
    if (!block.resourceId) continue;

    if (!block.isRecurring) {
      out.push({ resourceId: block.resourceId, start: block.startTime, end: block.endTime });
      continue;
    }

    const originalLocalDateStr = utcToLocalDateStr(block.startTime, timezone);
    const originalLocalDow = dayOfWeekInTz(originalLocalDateStr);
    if (originalLocalDow !== targetDow) continue;
    if (block.recurrenceUntil && new Date(dateStr) > block.recurrenceUntil) continue;
    if (new Date(dateStr) < new Date(originalLocalDateStr)) continue;

    const startTimeStr = utcToLocalTimeStr(block.startTime, timezone);
    const endTimeStr = utcToLocalTimeStr(block.endTime, timezone);
    const start = localDateTimeToUtc(dateStr, startTimeStr, timezone);
    let end = localDateTimeToUtc(dateStr, endTimeStr, timezone);
    if (end <= start) end = addMinutes(end, 24 * 60); // overnight block
    out.push({ resourceId: block.resourceId, start, end });
  }

  return out;
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Compute bookable time slots for an activity on a given date.
 * This is the single source of truth used by both the public booking widget
 * and (indirectly) by the admin calendar's "what's free" view.
 */
export async function getAvailableSlots(params: {
  activityId: string;
  dateStr: string;
  durationMinutes: number;
  settings: BusinessSettings;
  /** Restrict availability to one specific resource, e.g. a table chosen on the floor plan. */
  resourceId?: string;
}): Promise<SlotResult[]> {
  const { activityId, dateStr, durationMinutes, settings, resourceId: onlyResourceId } = params;
  const timezone = settings.timezone;

  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
    include: {
      resources: { where: { status: "ACTIVE" }, orderBy: { sortOrder: "asc" } },
      pricingRules: true,
    },
  });
  if (!activity || !activity.active || activity.resources.length === 0) return [];

  const window = await getOpeningWindow(activityId, dateStr);
  if (window.closed || !window.open || !window.close) return [];

  const dayStart = localDateTimeToUtc(dateStr, "00:00", timezone);
  const dayEnd = addMinutes(dayStart, 24 * 60);
  const resourceIds = onlyResourceId
    ? activity.resources.filter((r) => r.id === onlyResourceId).map((r) => r.id)
    : activity.resources.map((r) => r.id);
  if (resourceIds.length === 0) return [];

  const [bookings, blocks] = await Promise.all([
    prisma.booking.findMany({
      where: {
        resourceId: { in: resourceIds },
        status: { in: ["PENDING", "CONFIRMED"] },
        startTime: { lt: dayEnd },
        endTime: { gt: dayStart },
      },
    }),
    prisma.blockedPeriod.findMany({
      where: {
        OR: [
          { resourceId: { in: resourceIds }, isRecurring: false, startTime: { lt: dayEnd }, endTime: { gt: dayStart } },
          { resourceId: { in: resourceIds }, isRecurring: true },
          { activityId, resourceId: null },
        ],
      },
    }),
  ]);

  const activityWideBlocked = blocks.some(
    (b) => b.activityId === activityId && !b.resourceId && overlaps(b.startTime, b.endTime, dayStart, dayEnd)
  );
  if (activityWideBlocked) return [];

  const materializedBlocks = materializeBlocks(
    blocks.filter((b) => b.resourceId),
    dateStr,
    timezone
  );

  const busyByResource = new Map<string, OverlapWindow[]>();
  for (const id of resourceIds) busyByResource.set(id, []);
  for (const b of bookings as Booking[]) {
    busyByResource.get(b.resourceId)?.push({ resourceId: b.resourceId, start: b.startTime, end: b.endTime });
  }
  for (const b of materializedBlocks) {
    busyByResource.get(b.resourceId)?.push(b);
  }

  const openMinutes = timeToMinutes(window.open);
  const closeMinutes = timeToMinutes(window.close);
  const interval = settings.slotIntervalMinutes || 30;
  const buffer = settings.bufferMinutes || 0;

  const now = new Date();
  const earliestStart = addMinutes(now, settings.minAdvanceMinutes || 0);
  const latestDate = addMinutes(now, (settings.maxAdvanceDays || 60) * 24 * 60);

  const results: SlotResult[] = [];

  for (let m = openMinutes; m + durationMinutes <= closeMinutes; m += interval) {
    const timeStr = minutesToTime(m);
    const slotStart = localDateTimeToUtc(dateStr, timeStr, timezone);
    const slotEnd = addMinutes(slotStart, durationMinutes);

    if (slotStart < earliestStart || slotStart > latestDate) continue;

    const freeResourceIds = resourceIds.filter((rid) => {
      const busy = busyByResource.get(rid) ?? [];
      const bufferedStart = addMinutes(slotStart, -buffer);
      const bufferedEnd = addMinutes(slotEnd, buffer);
      return !busy.some((w) => overlaps(bufferedStart, bufferedEnd, w.start, w.end));
    });

    const price = calculatePrice(activity, activity.pricingRules, {
      durationMinutes,
      dayOfWeek: dayOfWeekInTz(dateStr),
      startTime: timeStr,
    });

    results.push({
      time: timeStr,
      available: freeResourceIds.length > 0,
      price,
      availableResourceIds: freeResourceIds,
    });
  }

  return results;
}
