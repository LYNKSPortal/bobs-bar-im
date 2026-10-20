import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatPrice } from "@/lib/pricing";
import { getCustomerBookings } from "@/server/data/customers";

export default async function CustomerDetailPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const bookings = await getCustomerBookings(decodeURIComponent(key));
  if (bookings.length === 0) notFound();

  const first = bookings[0];

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="font-heading text-2xl font-bold sm:text-3xl">{first.customerName || "Guest"}</h1>
        <p className="text-sm text-muted-foreground">
          {first.customerPhone} {first.customerEmail ? `\u00b7 ${first.customerEmail}` : ""}
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference</TableHead>
              <TableHead>Activity</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Price</TableHead>
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
                <TableCell>
                  {b.activity.name} &middot; {b.resource.name}
                </TableCell>
                <TableCell>{format(b.startTime, "d MMM yyyy, h:mm a")}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{b.status}</Badge>
                </TableCell>
                <TableCell className="text-right">{formatPrice(b.priceTotal, b.currency)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
