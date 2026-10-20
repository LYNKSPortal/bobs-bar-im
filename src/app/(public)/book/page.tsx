import type { Metadata } from "next";

import { BookingWidget } from "@/components/booking/booking-widget";
import { getActiveActivities } from "@/server/data/activities";

export const metadata: Metadata = { title: "Book Now" };

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ activity?: string }>;
}) {
  const { activity } = await searchParams;
  const activities = await getActiveActivities();
  const defaultActivityId = activities.find((a) => a.slug === activity)?.id;

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="font-heading text-4xl font-bold">Book a table</h1>
        <p className="mt-3 text-muted-foreground">Choose an activity, pick a time, and you&rsquo;re booked.</p>
      </div>
      <div className="mt-10">
        <BookingWidget activities={activities} defaultActivityId={defaultActivityId} />
      </div>
    </div>
  );
}
