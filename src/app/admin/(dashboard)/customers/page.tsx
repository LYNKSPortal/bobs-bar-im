import Link from "next/link";
import { format } from "date-fns";

import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatPrice } from "@/lib/pricing";
import { listCustomers } from "@/server/data/customers";

export default async function AdminCustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const customers = await listCustomers(q);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="font-heading text-2xl font-bold sm:text-3xl">Customers</h1>
        <p className="text-sm text-muted-foreground">{customers.length} customers</p>
      </div>

      <form method="GET" className="max-w-sm">
        <Input name="q" placeholder="Search by name, email, or phone" defaultValue={q} />
      </form>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Bookings</TableHead>
              <TableHead>Last booking</TableHead>
              <TableHead className="text-right">Total spend</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((c) => (
              <TableRow key={c.key}>
                <TableCell>
                  <Link href={`/admin/customers/${encodeURIComponent(c.key)}`} className="font-medium hover:text-gold">
                    {c.name}
                  </Link>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {c.phone} {c.email ? `\u00b7 ${c.email}` : ""}
                </TableCell>
                <TableCell>{c.totalBookings}</TableCell>
                <TableCell>{format(c.lastBookingAt, "d MMM yyyy")}</TableCell>
                <TableCell className="text-right">{formatPrice(c.totalSpend, c.currency)}</TableCell>
              </TableRow>
            ))}
            {customers.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  No customers found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
