import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";

import { ContactForm } from "@/components/site/contact-form";
import { getBusinessSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Contact" };

export default async function ContactPage() {
  const settings = await getBusinessSettings();

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="font-heading text-4xl font-bold">Get in touch</h1>
        <p className="mt-3 text-muted-foreground">Questions about a booking, a private event, or anything else? We&rsquo;d love to hear from you.</p>
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-2">
        <div className="space-y-6">
          {settings.addressLine && (
            <div className="flex gap-3">
              <MapPin className="size-5 shrink-0 text-gold" />
              <div>
                <p className="font-medium">Address</p>
                <p className="text-muted-foreground">{settings.addressLine}</p>
              </div>
            </div>
          )}
          {settings.phone && (
            <div className="flex gap-3">
              <Phone className="size-5 shrink-0 text-gold" />
              <div>
                <p className="font-medium">Phone</p>
                <a href={`tel:${settings.phone}`} className="text-muted-foreground hover:text-gold">
                  {settings.phone}
                </a>
              </div>
            </div>
          )}
          {settings.email && (
            <div className="flex gap-3">
              <Mail className="size-5 shrink-0 text-gold" />
              <div>
                <p className="font-medium">Email</p>
                <a href={`mailto:${settings.email}`} className="text-muted-foreground hover:text-gold">
                  {settings.email}
                </a>
              </div>
            </div>
          )}
        </div>

        <ContactForm />
      </div>
    </div>
  );
}
