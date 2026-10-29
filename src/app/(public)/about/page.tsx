import Image from "next/image";
import type { Metadata } from "next";

import { getBusinessSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "About" };

export default async function AboutPage() {
  const settings = await getBusinessSettings();

  return (
    <div>
      <section className="relative h-72 w-full overflow-hidden sm:h-96">
        <Image
          src="https://images.unsplash.com/photo-1559519529-0936e4058364?q=80&w=2000&auto=format&fit=crop"
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 mx-auto max-w-5xl px-4 pb-10 sm:px-6">
          <h1 className="font-heading text-4xl font-bold text-white sm:text-5xl">About {settings.businessName}</h1>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <p className="text-lg leading-relaxed text-muted-foreground">
          {settings.businessName} is the city&rsquo;s premier spot for pool, golf simulation, and billiards. We built this
          place for people who love a good game as much as a good night out &mdash; tournament-grade tables, full-swing
          simulator bays, and a space designed for friends, dates, and corporate nights alike.
        </p>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          Whether you&rsquo;re here for a quick lunchtime game or booking the whole venue for a private event, our online
          booking system shows you exactly what&rsquo;s available, right now &mdash; no phone calls, no guesswork.
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          <div className="rounded-xl border border-border p-5 text-center">
            <p className="font-heading text-3xl font-bold text-gold">6</p>
            <p className="mt-1 text-sm text-muted-foreground">Tables &amp; simulators</p>
          </div>
          <div className="rounded-xl border border-border p-5 text-center">
            <p className="font-heading text-3xl font-bold text-gold">7</p>
            <p className="mt-1 text-sm text-muted-foreground">Days a week</p>
          </div>
          <div className="rounded-xl border border-border p-5 text-center">
            <p className="font-heading text-3xl font-bold text-gold">60s</p>
            <p className="mt-1 text-sm text-muted-foreground">To book online</p>
          </div>
        </div>
      </section>
    </div>
  );
}
