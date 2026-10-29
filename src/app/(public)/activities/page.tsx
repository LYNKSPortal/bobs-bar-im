import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";

import { getActiveActivities } from "@/server/data/activities";

export const metadata: Metadata = { title: "Activities" };

export default async function ActivitiesPage() {
  const activities = await getActiveActivities();

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="font-heading text-4xl font-bold">Our Activities</h1>
        <p className="mt-3 text-muted-foreground">
          Pick an activity to see pricing, available tables, and book instantly.
        </p>
      </div>

      <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {activities.map((activity) => (
          <Link
            key={activity.id}
            href={`/activities/${activity.slug}`}
            className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-lg"
          >
            <div className="relative h-56 w-full overflow-hidden">
              {activity.imageUrl && (
                <Image
                  src={activity.imageUrl}
                  alt={activity.name}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              )}
            </div>
            <div className="p-6">
              <h2 className="font-heading text-xl font-semibold">{activity.name}</h2>
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{activity.description}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm font-semibold text-gold">From £{(activity.basePriceHourly / 100).toFixed(0)}/hr</span>
                <span className="inline-flex items-center text-sm font-medium group-hover:text-gold">
                  View &amp; book <ArrowRight className="ml-1 size-3.5" />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
