import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Clock, Users } from "lucide-react";

import { BookingWidget } from "@/components/booking/booking-widget";
import { getActiveActivities, getActivityBySlug } from "@/server/data/activities";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const activity = await getActivityBySlug(slug);
  if (!activity) return {};
  return { title: activity.name, description: activity.shortDescription ?? activity.description };
}

export default async function ActivityDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [activity, allActivities] = await Promise.all([getActivityBySlug(slug), getActiveActivities()]);

  if (!activity || !activity.active) notFound();

  return (
    <div>
      <section className="relative h-72 w-full overflow-hidden sm:h-96">
        {activity.imageUrl && <Image src={activity.imageUrl} alt={activity.name} fill priority className="object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
          <h1 className="font-heading text-4xl font-bold text-white sm:text-5xl">{activity.name}</h1>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-3 lg:px-8">
        <div className="lg:col-span-2">
          <p className="text-lg text-muted-foreground">{activity.description}</p>

          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border p-4">
              <Clock className="size-5 text-gold" />
              <p className="mt-2 text-sm font-medium">Durations</p>
              <p className="text-sm text-muted-foreground">{activity.durationsMinutes.join(", ")} min</p>
            </div>
            {activity.maxPartySize && (
              <div className="rounded-xl border border-border p-4">
                <Users className="size-5 text-gold" />
                <p className="mt-2 text-sm font-medium">Party size</p>
                <p className="text-sm text-muted-foreground">
                  {activity.minPartySize ?? 1}&ndash;{activity.maxPartySize} people
                </p>
              </div>
            )}
            <div className="rounded-xl border border-border p-4">
              <p className="text-sm font-medium">Resources</p>
              <p className="mt-1 text-sm text-muted-foreground">{activity.resources.length} available</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">From</p>
          <p className="font-heading text-3xl font-bold text-gold">£{(activity.basePriceHourly / 100).toFixed(0)}/hr</p>
        </div>
      </div>

      <section className="border-t border-border bg-secondary/40 py-14">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-6 text-center font-heading text-2xl font-bold">Book {activity.name}</h2>
          <BookingWidget activities={allActivities} defaultActivityId={activity.id} />
        </div>
      </section>
    </div>
  );
}
