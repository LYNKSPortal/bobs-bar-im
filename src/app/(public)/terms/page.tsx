import type { Metadata } from "next";

import { getBusinessSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Terms & Conditions" };

export default async function TermsPage() {
  const settings = await getBusinessSettings();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-heading text-4xl font-bold">Terms &amp; Conditions</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

      <div className="prose prose-neutral mt-8 max-w-none text-muted-foreground">
        <p className="rounded-lg border border-dashed border-gold/50 bg-accent/10 p-4 text-sm text-foreground">
          <strong>Note to the business owner:</strong> this is placeholder terms text. Please review it with a
          qualified advisor and update cancellation, no-show, and payment terms to match your actual policies before
          publishing this site.
        </p>

        <h2 className="mt-8 font-heading text-xl font-semibold text-foreground">Bookings</h2>
        <p>
          All bookings made through {settings.businessName}&rsquo;s website are subject to real-time availability.
          A booking is only confirmed once you receive a confirmation with a unique booking reference.
        </p>

        <h2 className="mt-6 font-heading text-xl font-semibold text-foreground">Cancellations</h2>
        <p>
          You may cancel or reschedule your booking online up to {settings.cancellationDeadlineHours} hours before
          your scheduled start time using the link in your confirmation email. After this window, please contact us
          directly.
        </p>

        <h2 className="mt-6 font-heading text-xl font-semibold text-foreground">Payments</h2>
        <p>
          Some activities require full or partial payment at the time of booking; others can be paid for at the
          venue. Any required payment will be clearly shown before you confirm your booking.
        </p>

        <h2 className="mt-6 font-heading text-xl font-semibold text-foreground">Conduct</h2>
        <p>
          We reserve the right to refuse service or end a session without refund in cases of damage to equipment,
          abusive behaviour, or breach of venue rules.
        </p>
      </div>
    </div>
  );
}
