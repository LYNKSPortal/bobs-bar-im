import Link from "next/link";
import { MapPin, Martini, Phone } from "lucide-react";

import type { BusinessSettings } from "@/lib/settings";

function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M13.5 21v-7.5h2.5l.5-3h-3V8.5c0-.9.3-1.5 1.6-1.5H16.6V4.3C16.1 4.2 15 4 13.9 4c-2.4 0-4 1.5-4 4.1V10.5H7.5v3h2.4V21h3.6Z" />
    </svg>
  );
}

function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function SiteFooter({ settings }: { settings: BusinessSettings }) {
  return (
    <footer className="border-t border-white/10 bg-ink text-ink-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div>
          <Link href="/" className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-full bg-gold text-gold-foreground">
              <Martini className="size-5" />
            </span>
            <span className="font-heading text-xl font-semibold">{settings.businessName}</span>
          </Link>
          <p className="mt-4 max-w-xs text-sm text-ink-foreground/60">
            Pool, golf simulators, and billiards in the heart of the city. Walk in or book online in seconds.
          </p>
          <div className="mt-5 flex gap-3">
            {settings.facebookUrl && (
              <a
                href={settings.facebookUrl}
                target="_blank"
                rel="noreferrer"
                className="flex size-9 items-center justify-center rounded-full bg-white/5 text-ink-foreground/70 transition hover:bg-gold hover:text-gold-foreground"
                aria-label="Facebook"
              >
                <FacebookIcon className="size-4" />
              </a>
            )}
            {settings.instagramUrl && (
              <a
                href={settings.instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="flex size-9 items-center justify-center rounded-full bg-white/5 text-ink-foreground/70 transition hover:bg-gold hover:text-gold-foreground"
                aria-label="Instagram"
              >
                <InstagramIcon className="size-4" />
              </a>
            )}
          </div>
        </div>

        <div>
          <h3 className="font-heading text-sm font-semibold uppercase tracking-wider text-gold">Explore</h3>
          <ul className="mt-4 space-y-2 text-sm text-ink-foreground/70">
            <li><Link href="/activities" className="hover:text-gold">Activities</Link></li>
            <li><Link href="/book" className="hover:text-gold">Book Now</Link></li>
            <li><Link href="/about" className="hover:text-gold">About Us</Link></li>
            <li><Link href="/faq" className="hover:text-gold">FAQ</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="font-heading text-sm font-semibold uppercase tracking-wider text-gold">Legal</h3>
          <ul className="mt-4 space-y-2 text-sm text-ink-foreground/70">
            <li><Link href="/contact" className="hover:text-gold">Contact</Link></li>
            <li><Link href="/privacy" className="hover:text-gold">Privacy Policy</Link></li>
            <li><Link href="/terms" className="hover:text-gold">Terms &amp; Conditions</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="font-heading text-sm font-semibold uppercase tracking-wider text-gold">Visit Us</h3>
          <ul className="mt-4 space-y-3 text-sm text-ink-foreground/70">
            {settings.addressLine && (
              <li className="flex gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-gold" />
                <span>{settings.addressLine}</span>
              </li>
            )}
            {settings.phone && (
              <li className="flex gap-2">
                <Phone className="mt-0.5 size-4 shrink-0 text-gold" />
                <a href={`tel:${settings.phone}`} className="hover:text-gold">{settings.phone}</a>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 py-6 text-center text-xs text-ink-foreground/50">
        &copy; {new Date().getFullYear()} {settings.businessName}. All rights reserved.
      </div>
    </footer>
  );
}
