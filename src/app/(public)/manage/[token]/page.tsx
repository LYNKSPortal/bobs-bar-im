import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { ManageBookingClient } from "@/components/booking/manage-booking-client";
import { prisma } from "@/lib/prisma";
import { getBusinessSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Manage Your Booking" };

export default async function ManageBookingPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const booking = await prisma.booking.findUnique({
    where: { manageToken: token },
    include: { activity: true, resource: true },
  });

  if (!booking) notFound();

  const settings = await getBusinessSettings();

  return (
    <div className="mx-auto max-w-xl px-4 py-16 sm:px-6">
      <ManageBookingClient
        token={token}
        booking={{
          reference: booking.reference,
          status: booking.status,
          activityName: booking.activity.name,
          resourceName: booking.resource.name,
          startTime: booking.startTime.toISOString(),
          durationMinutes: booking.durationMinutes,
          priceTotal: booking.priceTotal,
          currency: booking.currency,
          activityId: booking.activityId,
        }}
        timezone={settings.timezone}
        cancellationDeadlineHours={settings.cancellationDeadlineHours}
      />
    </div>
  );
}
