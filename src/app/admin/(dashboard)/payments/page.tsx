import Link from "next/link";
import { format } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatPrice } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";

export default async function AdminPaymentsPage() {
  const bookings = await prisma.booking.findMany({
    where: { paymentMode: { not: "NONE" } },
    include: { activity: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const stripeEnabled = Boolean(process.env.STRIPE_SECRET_KEY);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="font-heading text-2xl font-bold sm:text-3xl">Payments</h1>
        <p className="text-sm text-muted-foreground">
          {stripeEnabled ? "Stripe is connected." : "Stripe is not configured \u2014 these bookings are pending manual payment at the venue."}
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference</TableHead>
              <TableHead>Activity</TableHead>
              <TableHead>Mode</TableHead>
              <TableHead>Payment status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((b) => (
              <TableRow key={b.id}>
                <TableCell className="font-mono text-xs">
                  <Link href={`/admin/bookings/${b.id}`} className="hover:text-gold">
                    {b.reference}
                  </Link>
                </TableCell>
                <TableCell>{b.activity.name}</TableCell>
                <TableCell>{b.paymentMode}</TableCell>
                <TableCell>
                  <Badge variant={b.paymentStatus === "PAID" ? "default" : "outline"}>{b.paymentStatus}</Badge>
                </TableCell>
                <TableCell className="text-sm">{format(b.createdAt, "d MMM yyyy")}</TableCell>
                <TableCell className="text-right">{formatPrice(b.priceTotal, b.currency)}</TableCell>
              </TableRow>
            ))}
            {bookings.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  No bookings requiring payment yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
