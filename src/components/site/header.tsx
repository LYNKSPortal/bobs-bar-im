"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, Martini } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/activities", label: "Activities" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/faq", label: "FAQ" },
];

export function SiteHeader({ businessName }: { businessName: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-ink/95 backdrop-blur supports-[backdrop-filter]:bg-ink/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 text-ink-foreground">
          <span className="flex size-9 items-center justify-center rounded-full bg-gold text-gold-foreground">
            <Martini className="size-5" />
          </span>
          <span className="font-heading text-xl font-semibold tracking-tight">{businessName}</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium text-ink-foreground/70 transition-colors hover:text-gold",
                pathname === link.href && "text-gold"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Button render={<Link href="/book" />} className="bg-gold text-gold-foreground hover:bg-gold/90">
            Book Now
          </Button>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger render={<Button variant="ghost" size="icon" className="text-ink-foreground md:hidden" />}>
            <Menu className="size-6" />
          </SheetTrigger>
          <SheetContent side="right" className="bg-ink text-ink-foreground">
            <SheetHeader>
              <SheetTitle className="font-heading text-ink-foreground">{businessName}</SheetTitle>
            </SheetHeader>
            <nav className="mt-4 flex flex-col gap-1 px-4">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "rounded-md px-3 py-3 text-base font-medium text-ink-foreground/80 hover:bg-white/5 hover:text-gold",
                    pathname === link.href && "text-gold"
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <Button
                render={<Link href="/book" onClick={() => setOpen(false)} />}
                className="mt-4 bg-gold text-gold-foreground hover:bg-gold/90"
              >
                Book Now
              </Button>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
