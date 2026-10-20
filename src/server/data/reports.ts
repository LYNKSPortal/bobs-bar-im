import { prisma } from "@/lib/prisma";

export async function getReportsSummary(days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const bookings = await prisma.booking.findMany({
    where: { createdAt: { gte: since } },
    include: { activity: true },
  });

  const totalBookings = bookings.length;
  const cancelled = bookings.filter((b) => b.status === "CANCELLED").length;
  const noShows = bookings.filter((b) => b.status === "NO_SHOW").length;
  const revenue = bookings.filter((b) => b.status !== "CANCELLED").reduce((sum, b) => sum + b.priceTotal, 0);

  const byActivity = new Map<string, { name: string; count: number; revenue: number }>();
  for (const b of bookings) {
    if (b.status === "CANCELLED") continue;
    const entry = byActivity.get(b.activityId) ?? { name: b.activity.name, count: 0, revenue: 0 };
    entry.count += 1;
    entry.revenue += b.priceTotal;
    byActivity.set(b.activityId, entry);
  }

  const activityBreakdown = Array.from(byActivity.values()).sort((a, b) => b.count - a.count);
  const currency = bookings[0]?.currency ?? "gbp";

  return {
    days,
    totalBookings,
    cancelled,
    noShows,
    cancellationRate: totalBookings > 0 ? (cancelled / totalBookings) * 100 : 0,
    revenue,
    currency,
    activityBreakdown,
    bySource: {
      online: bookings.filter((b) => b.source === "ONLINE").length,
      manual: bookings.filter((b) => b.source !== "ONLINE").length,
    },
  };
}
