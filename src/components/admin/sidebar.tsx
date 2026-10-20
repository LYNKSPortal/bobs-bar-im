"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Martini,
  Menu,
  Settings,
  Users,
  Wallet,
  BarChart3,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { adminSignOut } from "@/server/actions/admin-auth-signout";

const NAV = [
  { href: "/admin", label: "Today", icon: LayoutDashboard, exact: true },
  { href: "/admin/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/admin/bookings", label: "Bookings", icon: ListChecks },
  { href: "/admin/activities", label: "Activities", icon: Martini },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/payments", label: "Payments", icon: Wallet },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {NAV.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              active && "bg-sidebar-accent text-sidebar-primary"
            )}
          >
            <Icon className="size-4.5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminSidebar({ staffName }: { staffName: string }) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-5">
        <span className="flex size-8 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground">
          <Martini className="size-4" />
        </span>
        <span className="font-heading text-lg font-semibold">Admin</span>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <NavLinks />
      </div>
      <div className="border-t border-sidebar-border p-4">
        <p className="truncate text-xs text-sidebar-foreground/50">Signed in as</p>
        <p className="truncate text-sm font-medium">{staffName}</p>
        <form action={adminSignOut}>
          <Button type="submit" variant="ghost" size="sm" className="mt-2 w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-accent-foreground">
            <LogOut className="mr-2 size-4" /> Sign out
          </Button>
        </form>
      </div>
    </aside>
  );
}

export function AdminMobileNav({ staffName }: { staffName: string }) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-sidebar px-4 text-sidebar-foreground md:hidden">
      <Link href="/admin" className="flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground">
          <Martini className="size-3.5" />
        </span>
        <span className="font-heading text-base font-semibold">Admin</span>
      </Link>
      <Sheet>
        <SheetTrigger render={<Button variant="ghost" size="icon" className="text-sidebar-foreground" />}>
          <Menu className="size-5" />
        </SheetTrigger>
        <SheetContent side="right" className="bg-sidebar text-sidebar-foreground">
          <SheetHeader>
            <SheetTitle className="text-sidebar-foreground">{staffName}</SheetTitle>
          </SheetHeader>
          <div className="mt-2 flex flex-1 flex-col">
            <NavLinks />
          </div>
          <div className="border-t border-sidebar-border p-4">
            <form action={adminSignOut}>
              <Button type="submit" variant="ghost" size="sm" className="w-full justify-start text-sidebar-foreground/70">
                <LogOut className="mr-2 size-4" /> Sign out
              </Button>
            </form>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
