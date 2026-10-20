import Link from "next/link";
import { format } from "date-fns";
import { CalendarDays, CheckCircle2, Users } from "lucide-react";

import { BlockFullDayDialog } from "@/components/admin/block-full-day-dialog";
import { BlockTimeDialog } from "@/components/admin/block-time-dialog";
import { NewBookingDialog } from "@/components/admin/new-booking-dialog";
import { ScheduleView } from "@/components/admin/schedule-view";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getDashboardStats, getDaySchedule } from "@/server/data/schedule";

export default async function AdminDashboardPage() {
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const [schedule, stats] = await Promise.all([getDaySchedule(todayStr), getDashboardStats(todayStr)]);

  const bookingDetails = await enrichItems(schedule.items);

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-heading text-2xl font-bold sm:text-3xl">Today&rsquo;s Schedule</h1>
          <p className="text-sm text-muted-foreground">{format(new Date(), "EEEE d MMMM yyyy")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <NewBookingDialog activities={schedule.activities} />
          <BlockTimeDialog activities={schedule.activities} />
          <BlockFullDayDialog />
          <Button variant="outline" render={<Link href="/admin/calendar" />}>
            <CalendarDays className="mr-2 size-4" /> View Calendar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Today's bookings" value={stats.totalBookings} icon={CalendarDays} />
        <StatCard label="Currently occupied" value={stats.currentlyOccupied} icon={Users} />
        <StatCard label="Available resources" value={`${stats.availableResources}/${stats.totalResources}`} icon={CheckCircle2} />
        <StatCard
          label="Next arrival"
          value={stats.nextBooking ? format(stats.nextBooking.startTime, "h:mm a") : "\u2014"}
          icon={CalendarDays}
        />
      </div>

      {schedule.closedAllDay ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
          The venue is closed today{schedule.closedReason ? ` (${schedule.closedReason})` : ""}. Online bookings are disabled.
        </div>
      ) : (
        <ScheduleView activities={schedule.activities} items={bookingDetails} date={new Date()} />
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ElementType }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent/20 text-gold">
          <Icon className="size-5" />
        </span>
        <div>
          <p className="font-heading text-xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

async function enrichItems(items: Awaited<ReturnType<typeof getDaySchedule>>["items"]) {
  const { prisma } = await import("@/lib/prisma");
  const bookingIds = items.filter((i) => i.kind === "booking").map((i) => i.id);
  const bookings = await prisma.booking.findMany({
    where: { id: { in: bookingIds } },
    select: { id: true, priceTotal: true, currency: true, customerEmail: true, customerPhone: true },
  });
  const byId = new Map(bookings.map((b) => [b.id, b]));

  return items.map((item) => {
    const extra = byId.get(item.id);
    return { ...item, ...extra };
  });
}
