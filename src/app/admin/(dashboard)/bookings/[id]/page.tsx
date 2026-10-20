import { notFound } from "next/navigation";

import { BookingDetailClient } from "@/components/admin/booking-detail-client";
import { getBookingDetail } from "@/server/data/bookings";

export default async function AdminBookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const booking = await getBookingDetail(id);
  if (!booking) notFound();

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
      <BookingDetailClient
        booking={{
          id: booking.id,
          reference: booking.reference,
          status: booking.status,
          customerName: booking.customerName,
          customerEmail: booking.customerEmail,
          customerPhone: booking.customerPhone,
          notes: booking.notes,
          partySize: booking.partySize,
          startTime: booking.startTime.toISOString(),
          durationMinutes: booking.durationMinutes,
          priceTotal: booking.priceTotal,
          currency: booking.currency,
          resourceId: booking.resourceId,
          activity: { id: booking.activity.id, name: booking.activity.name },
          resource: { id: booking.resource.id, name: booking.resource.name },
          resources: booking.activity.resources.map((r) => ({ id: r.id, name: r.name })),
          statusHistory: booking.statusHistory.map((h) => ({
            id: h.id,
            status: h.status,
            note: h.note,
            changedAt: h.changedAt.toISOString(),
            changedByName: h.changedBy?.name ?? null,
          })),
        }}
      />
    </div>
  );
}
