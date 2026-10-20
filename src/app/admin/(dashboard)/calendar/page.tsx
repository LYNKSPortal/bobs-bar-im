import { endOfMonth, endOfWeek, format, parseISO, startOfMonth, startOfWeek } from "date-fns";

import { BlockFullDayDialog } from "@/components/admin/block-full-day-dialog";
import { BlockTimeDialog } from "@/components/admin/block-time-dialog";
import { CalendarNav } from "@/components/admin/calendar-nav";
import { MonthView } from "@/components/admin/month-view";
import { NewBookingDialog } from "@/components/admin/new-booking-dialog";
import { ScheduleView } from "@/components/admin/schedule-view";
import { WeekView } from "@/components/admin/week-view";
import { prisma } from "@/lib/prisma";
import { getDaySchedule, getRangeCounts } from "@/server/data/schedule";

export default async function AdminCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; date?: string }>;
}) {
  const sp = await searchParams;
  const view = (sp.view as "day" | "week" | "month") || "day";
  const dateStr = sp.date || format(new Date(), "yyyy-MM-dd");
  const date = parseISO(dateStr);

  const activities = await prisma.activity.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
    include: { resources: { where: { status: { not: "RETIRED" } }, orderBy: { sortOrder: "asc" } } },
  });

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="font-heading text-2xl font-bold sm:text-3xl">Calendar</h1>
        <div className="flex flex-wrap gap-2">
          <NewBookingDialog activities={activities} defaultDate={date} />
          <BlockTimeDialog activities={activities} defaultDate={date} />
          <BlockFullDayDialog defaultDate={date} />
        </div>
      </div>

      <CalendarNav date={dateStr} view={view} />

      {view === "day" && <DayView dateStr={dateStr} date={date} />}
      {view === "week" && <WeekViewContainer date={date} />}
      {view === "month" && <MonthViewContainer date={date} />}
    </div>
  );
}

async function DayView({ dateStr, date }: { dateStr: string; date: Date }) {
  const schedule = await getDaySchedule(dateStr);
  const bookingIds = schedule.items.filter((i) => i.kind === "booking").map((i) => i.id);
  const bookings = await prisma.booking.findMany({
    where: { id: { in: bookingIds } },
    select: { id: true, priceTotal: true, currency: true, customerEmail: true, customerPhone: true },
  });
  const byId = new Map(bookings.map((b) => [b.id, b]));
  const items = schedule.items.map((item) => ({ ...item, ...byId.get(item.id) }));

  if (schedule.closedAllDay) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
        The venue is closed on this day{schedule.closedReason ? ` (${schedule.closedReason})` : ""}.
      </div>
    );
  }

  return <ScheduleView activities={schedule.activities} items={items} date={date} />;
}

async function WeekViewContainer({ date }: { date: Date }) {
  const start = startOfWeek(date);
  const end = endOfWeek(date);
  const counts = await getRangeCounts(format(start, "yyyy-MM-dd"), format(new Date(end.getTime() + 86400000), "yyyy-MM-dd"));
  return <WeekView week={date} counts={counts} />;
}

async function MonthViewContainer({ date }: { date: Date }) {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  const counts = await getRangeCounts(format(start, "yyyy-MM-dd"), format(new Date(end.getTime() + 86400000), "yyyy-MM-dd"));
  return <MonthView month={date} counts={counts} />;
}
