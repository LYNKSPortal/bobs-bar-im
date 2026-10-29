import Image from "next/image";
import Link from "next/link";
import { Clock, ShieldCheck, Sparkles } from "lucide-react";

import { BookingWidget } from "@/components/booking/booking-widget";
import { Button } from "@/components/ui/button";
import { getActiveActivities } from "@/server/data/activities";

export default async function HomePage() {
  const activities = await getActiveActivities();

  return (
    <div>
      {/* Hero + booking widget, above the fold */}
      <section className="relative overflow-hidden bg-ink">
        <Image
          src="/hero-image.jpg"
          alt="Bob's Bar storefront at night"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/60 via-ink/85 to-ink" />

        <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-16 sm:px-6 sm:pb-20 sm:pt-20 lg:px-8 lg:pb-24 lg:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-gold">
              <Sparkles className="size-3.5" /> Book instantly, no account needed
            </span>
            <h1 className="mt-6 font-heading text-4xl font-bold leading-tight text-ink-foreground sm:text-5xl lg:text-6xl">
              Pool, Golf &amp; Billiards.
              <br />
              <span className="text-gold">Book your table in seconds.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base text-ink-foreground/70 sm:text-lg">
              Real-time availability for every table and simulator. Pick a time, confirm your details, and you&rsquo;re in &mdash;
              no phone calls required.
            </p>
          </div>

          <div className="mx-auto mt-10 max-w-5xl">
            <BookingWidget activities={activities} variant="dark" />
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-b border-border bg-secondary/40">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-8 sm:grid-cols-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Clock className="size-6 shrink-0 text-gold" />
            <div>
              <p className="font-semibold">Instant confirmation</p>
              <p className="text-sm text-muted-foreground">Your table is locked in the moment you book.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ShieldCheck className="size-6 shrink-0 text-gold" />
            <div>
              <p className="font-semibold">Always accurate</p>
              <p className="text-sm text-muted-foreground">Live availability &mdash; never double-booked.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Sparkles className="size-6 shrink-0 text-gold" />
            <div>
              <p className="font-semibold">No account required</p>
              <p className="text-sm text-muted-foreground">Book as a guest in under a minute.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-ink">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <h2 className="font-heading text-3xl font-bold text-ink-foreground sm:text-4xl">Ready for a game?</h2>
          <p className="mt-3 text-ink-foreground/70">Grab a table before it&rsquo;s gone &mdash; booking takes less than a minute.</p>
          <Button render={<Link href="/book" />} nativeButton={false} size="lg" className="mt-6 bg-gold text-gold-foreground hover:bg-gold/90">
            Book a table
          </Button>
        </div>
      </section>
    </div>
  );
}
