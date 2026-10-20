import { prisma } from "@/lib/prisma";
import { getBusinessSettings } from "@/lib/settings";
import { addMinutes, localDateTimeToUtc, utcToLocalDateStr } from "@/lib/time";

export interface ScheduleItem {
  id: string;
  kind: "booking" | "block";
  resourceId: string;
  startTime: Date;
  endTime: Date;
  label: string;
  subLabel?: string;
  status?: string;
  reason?: string;
}

export async function getDaySchedule(dateStr: string) {
  const settings = await getBusinessSettings();
  const dayStart = localDateTimeToUtc(dateStr, "00:00", settings.timezone);
  const dayEnd = addMinutes(dayStart, 24 * 60);

  const activities = await prisma.activity.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
    include: {
      resources: { where: { status: { not: "RETIRED" } }, orderBy: { sortOrder: "asc" } },
    },
  });

  const resourceIds = activities.flatMap((a) => a.resources.map((r) => r.id));

  const [bookings, blocks, venueOverride] = await Promise.all([
    prisma.booking.findMany({
      where: {
        resourceId: { in: resourceIds },
        status: { in: ["PENDING", "CONFIRMED", "COMPLETED", "NO_SHOW"] },
        startTime: { lt: dayEnd },
        endTime: { gt: dayStart },
      },
      orderBy: { startTime: "asc" },
    }),
    prisma.blockedPeriod.findMany({
      where: {
        OR: [
          { resourceId: { in: resourceIds }, startTime: { lt: dayEnd }, endTime: { gt: dayStart } },
          { activityId: { in: activities.map((a) => a.id) }, resourceId: null },
        ],
      },
    }),
    prisma.dateOverride.findFirst({ where: { activityId: null, date: new Date(dateStr) } }),
  ]);

  const items: ScheduleItem[] = [];

  for (const b of bookings) {
    items.push({
      id: b.id,
      kind: "booking",
      resourceId: b.resourceId,
      startTime: b.startTime,
      endTime: b.endTime,
      label: b.customerName || "Guest",
      subLabel: `${b.reference}`,
      status: b.status,
    });
  }

  for (const blk of blocks) {
    if (blk.resourceId) {
      items.push({
        id: blk.id,
        kind: "block",
        resourceId: blk.resourceId,
        startTime: blk.startTime,
        endTime: blk.endTime,
        label: blk.reason.replace("_", " "),
        subLabel: blk.note ?? undefined,
        reason: blk.reason,
      });
    } else if (blk.activityId) {
      const activity = activities.find((a) => a.id === blk.activityId);
      for (const r of activity?.resources ?? []) {
        items.push({
          id: `${blk.id}-${r.id}`,
          kind: "block",
          resourceId: r.id,
          startTime: blk.startTime,
          endTime: blk.endTime,
          label: blk.reason.replace("_", " "),
          subLabel: blk.note ?? undefined,
          reason: blk.reason,
        });
      }
    }
  }

  return {
    settings,
    activities,
    items,
    closedAllDay: Boolean(venueOverride?.isClosed),
    closedReason: venueOverride?.reason ?? undefined,
  };
}

export async function getRangeCounts(startDateStr: string, endDateStr: string) {
  const settings = await getBusinessSettings();
  const start = localDateTimeToUtc(startDateStr, "00:00", settings.timezone);
  const end = localDateTimeToUtc(endDateStr, "00:00", settings.timezone);

  const bookings = await prisma.booking.findMany({
    where: {
      status: { in: ["PENDING", "CONFIRMED", "COMPLETED", "NO_SHOW"] },
      startTime: { gte: start, lt: end },
    },
    select: { startTime: true },
  });

  const counts = new Map<string, number>();
  for (const b of bookings) {
    const key = utcToLocalDateStr(b.startTime, settings.timezone);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

export async function getDashboardStats(dateStr: string) {
  const { items, activities } = await getDaySchedule(dateStr);
  const now = new Date();

  const totalResources = activities.reduce((sum, a) => sum + a.resources.filter((r) => r.status === "ACTIVE").length, 0);
  const bookingsToday = items.filter((i) => i.kind === "booking" && i.status !== "CANCELLED");
  const currentlyOccupied = items.filter(
    (i) => i.kind === "booking" && i.status !== "CANCELLED" && i.startTime <= now && i.endTime > now
  ).length;
  const upcoming = bookingsToday
    .filter((i) => i.startTime > now)
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())[0];

  return {
    totalBookings: bookingsToday.length,
    currentlyOccupied,
    availableResources: Math.max(totalResources - currentlyOccupied, 0),
    totalResources,
    nextBooking: upcoming,
  };
}
