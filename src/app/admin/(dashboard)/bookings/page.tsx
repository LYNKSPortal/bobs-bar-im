import Link from "next/link";
import { format } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatPrice } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";
import { listBookings } from "@/server/data/bookings";

const STATUS_OPTIONS = ["ALL", "PENDING", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"];

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; activityId?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const [{ bookings, total, page, totalPages }, activities] = await Promise.all([
    listBookings({ q: sp.q, status: sp.status, activityId: sp.activityId, page: sp.page ? Number(sp.page) : 1 }),
    prisma.activity.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="font-heading text-2xl font-bold sm:text-3xl">Bookings</h1>
        <p className="text-sm text-muted-foreground">{total} total bookings</p>
      </div>

      <form className="flex flex-wrap gap-3" method="GET">
        <Input name="q" placeholder="Search by name, email, phone, or reference" defaultValue={sp.q} className="max-w-xs" />
        <Select name="status" defaultValue={sp.status ?? "ALL"}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {s === "ALL" ? "All statuses" : s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select name="activityId" defaultValue={sp.activityId ?? "ALL"}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All activities</SelectItem>
            {activities.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit">Filter</Button>
      </form>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Activity</TableHead>
              <TableHead>Date &amp; time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Price</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((booking) => (
              <TableRow key={booking.id} className="cursor-pointer">
                <TableCell className="font-mono text-xs">
                  <Link href={`/admin/bookings/${booking.id}`} className="hover:text-gold">
                    {booking.reference}
                  </Link>
                </TableCell>
                <TableCell>
                  <p className="font-medium">{booking.customerName || "Guest"}</p>
                  <p className="text-xs text-muted-foreground">{booking.customerPhone || booking.customerEmail}</p>
                </TableCell>
                <TableCell>
                  {booking.activity.name} &middot; {booking.resource.name}
                </TableCell>
                <TableCell className="text-sm">{format(booking.startTime, "d MMM yyyy, h:mm a")}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{booking.status}</Badge>
                </TableCell>
                <TableCell className="text-right">{formatPrice(booking.priceTotal, booking.currency)}</TableCell>
              </TableRow>
            ))}
            {bookings.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  No bookings match your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Button
              key={p}
              variant={p === page ? "default" : "outline"}
              size="sm"
              render={
                <Link
                  href={`/admin/bookings?${new URLSearchParams({ ...sp, page: String(p) } as Record<string, string>).toString()}`}
                />
              }
            >
              {p}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
