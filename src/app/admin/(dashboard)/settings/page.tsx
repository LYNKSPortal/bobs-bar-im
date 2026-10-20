import { OpeningHoursForm } from "@/components/admin/opening-hours-form";
import { SettingsForm } from "@/components/admin/settings-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { getBusinessSettings } from "@/lib/settings";

export default async function AdminSettingsPage() {
  const settings = await getBusinessSettings();
  const openingHours = await prisma.openingHours.findMany({ where: { activityId: null } });

  const days = Array.from({ length: 7 }, (_, dayOfWeek) => {
    const existing = openingHours.find((h) => h.dayOfWeek === dayOfWeek);
    return {
      dayOfWeek,
      isClosed: existing?.isClosed ?? true,
      openTime: existing?.openTime ?? "10:00",
      closeTime: existing?.closeTime ?? "22:00",
    };
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6 lg:p-8">
      <h1 className="font-heading text-2xl font-bold sm:text-3xl">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Business &amp; booking rules</CardTitle>
        </CardHeader>
        <CardContent>
          <SettingsForm
            initial={{
              businessName: settings.businessName,
              addressLine: settings.addressLine ?? "",
              phone: settings.phone ?? "",
              email: settings.email ?? "",
              timezone: settings.timezone,
              currency: settings.currency,
              minAdvanceMinutes: settings.minAdvanceMinutes,
              maxAdvanceDays: settings.maxAdvanceDays,
              bufferMinutes: settings.bufferMinutes,
              slotIntervalMinutes: settings.slotIntervalMinutes,
              cancellationDeadlineHours: settings.cancellationDeadlineHours,
              facebookUrl: settings.facebookUrl ?? "",
              instagramUrl: settings.instagramUrl ?? "",
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Venue opening hours</CardTitle>
        </CardHeader>
        <CardContent>
          <OpeningHoursForm initial={days} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Integrations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">Payments (Stripe):</strong>{" "}
            {process.env.STRIPE_SECRET_KEY ? "Connected" : "Not configured \u2014 set STRIPE_SECRET_KEY to enable online payments."}
          </p>
          <p>
            <strong className="text-foreground">Email (Resend):</strong>{" "}
            {process.env.RESEND_API_KEY ? "Connected" : "Not configured \u2014 set RESEND_API_KEY to enable confirmation emails."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
