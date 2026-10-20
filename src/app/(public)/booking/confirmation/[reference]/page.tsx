import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CalendarCheck, CheckCircle2, Clock, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";
import { getBusinessSettings } from "@/lib/settings";
import { formatInTz } from "@/lib/time";

export const metadata: Metadata = { title: "Booking Confirmed" };

export default async function ConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ reference: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { reference } = await params;
  const { t } = await searchParams;

  const booking = await prisma.booking.findUnique({
    where: { reference },
    include: { activity: true, resource: true },
  });

  if (!booking) notFound();

  const settings = await getBusinessSettings();
  const authorized = Boolean(t) && t === booking.manageToken;

  if (!authorized) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center sm:px-6">
        <CheckCircle2 className="mx-auto size-12 text-gold" />
        <h1 className="mt-4 font-heading text-2xl font-bold">Booking {reference}</h1>
        <p className="mt-2 text-muted-foreground">
          If this booking belongs to you, check your email for the confirmation and the link to manage it.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <CheckCircle2 className="mx-auto size-14 text-gold" />
        <h1 className="mt-4 font-heading text-3xl font-bold">You&rsquo;re all booked in!</h1>
        <p className="mt-2 text-muted-foreground">Reference <span className="font-mono font-semibold text-foreground">{booking.reference}</span></p>
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <p className="font-heading text-xl font-semibold">{booking.activity.name}</p>
            <p className="text-sm text-muted-foreground">{booking.resource.name}</p>
          </div>
          <span className="rounded-full bg-accent/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gold">
            {booking.status}
          </span>
        </div>

        <div className="mt-4 space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <CalendarCheck className="size-4 text-gold" />
            {formatInTz(booking.startTime, settings.timezone, "EEEE d MMMM yyyy")}
          </div>
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-gold" />
            {formatInTz(booking.startTime, settings.timezone, "h:mm a")} &middot; {booking.durationMinutes} minutes
          </div>
          {settings.addressLine && (
            <div className="flex items-center gap-2">
              <MapPin className="size-4 text-gold" />
              {settings.addressLine}
            </div>
          )}
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="font-heading text-xl font-bold text-gold">{formatPrice(booking.priceTotal, booking.currency)}</span>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button render={<Link href={`/manage/${booking.manageToken}`} />} className="flex-1 bg-gold text-gold-foreground hover:bg-gold/90">
          Manage booking
        </Button>
        <Button render={<Link href="/" />} variant="outline" className="flex-1">
          Back to home
        </Button>
      </div>
    </div>
  );
}
