import type { Metadata } from "next";

import { getBusinessSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Privacy Policy" };

export default async function PrivacyPage() {
  const settings = await getBusinessSettings();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-heading text-4xl font-bold">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

      <div className="prose prose-neutral mt-8 max-w-none text-muted-foreground">
        <p className="rounded-lg border border-dashed border-gold/50 bg-accent/10 p-4 text-sm text-foreground">
          <strong>Note to the business owner:</strong> this is placeholder policy text. Please review it with a
          qualified advisor and update it with your actual data practices, retention periods, and legal basis before
          publishing this site.
        </p>

        <h2 className="mt-8 font-heading text-xl font-semibold text-foreground">Information we collect</h2>
        <p>
          When you make a booking, we collect your name, email address, phone number, and any notes you provide. We
          also store details of the booking itself (activity, resource, date, time, and price).
        </p>

        <h2 className="mt-6 font-heading text-xl font-semibold text-foreground">How we use your information</h2>
        <p>
          We use this information to confirm, manage, and fulfil your booking, to communicate with you about your
          booking, and, where you have opted in, to send you updates about {settings.businessName}.
        </p>

        <h2 className="mt-6 font-heading text-xl font-semibold text-foreground">Data retention</h2>
        <p>
          We retain booking records for as long as necessary for operational, accounting, and legal purposes. You may
          request deletion of your personal data at any time by contacting us.
        </p>

        <h2 className="mt-6 font-heading text-xl font-semibold text-foreground">Payments</h2>
        <p>
          Where online payment is required, payment is processed securely by Stripe. We do not store your card
          details on our servers.
        </p>

        <h2 className="mt-6 font-heading text-xl font-semibold text-foreground">Contact us</h2>
        <p>
          If you have any questions about this policy or your personal data, please contact us at{" "}
          {settings.email ?? "the email address on our Contact page"}.
        </p>
      </div>
    </div>
  );
}
