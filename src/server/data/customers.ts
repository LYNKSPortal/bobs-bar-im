import { prisma } from "@/lib/prisma";

export interface CustomerSummary {
  key: string;
  name: string;
  email: string | null;
  phone: string | null;
  totalBookings: number;
  cancelledBookings: number;
  lastBookingAt: Date;
  totalSpend: number;
  currency: string;
}

export async function listCustomers(q?: string) {
  const bookings = await prisma.booking.findMany({
    where: {
      OR: [{ customerPhone: { not: null } }, { customerEmail: { not: null } }],
    },
    select: {
      customerName: true,
      customerEmail: true,
      customerPhone: true,
      startTime: true,
      status: true,
      priceTotal: true,
      currency: true,
    },
    orderBy: { startTime: "desc" },
  });

  const map = new Map<string, CustomerSummary>();

  for (const b of bookings) {
    const key = (b.customerPhone || b.customerEmail || "").toLowerCase().trim();
    if (!key) continue;

    const existing = map.get(key);
    if (existing) {
      existing.totalBookings += 1;
      if (b.status === "CANCELLED") existing.cancelledBookings += 1;
      if (b.status !== "CANCELLED") existing.totalSpend += b.priceTotal;
      if (b.startTime > existing.lastBookingAt) existing.lastBookingAt = b.startTime;
    } else {
      map.set(key, {
        key,
        name: b.customerName || "Guest",
        email: b.customerEmail,
        phone: b.customerPhone,
        totalBookings: 1,
        cancelledBookings: b.status === "CANCELLED" ? 1 : 0,
        lastBookingAt: b.startTime,
        totalSpend: b.status === "CANCELLED" ? 0 : b.priceTotal,
        currency: b.currency,
      });
    }
  }

  let customers = Array.from(map.values()).sort((a, b) => b.lastBookingAt.getTime() - a.lastBookingAt.getTime());

  if (q) {
    const needle = q.toLowerCase();
    customers = customers.filter(
      (c) => c.name.toLowerCase().includes(needle) || c.email?.toLowerCase().includes(needle) || c.phone?.includes(needle)
    );
  }

  return customers;
}

export async function getCustomerBookings(key: string) {
  return prisma.booking.findMany({
    where: {
      OR: [
        { customerPhone: { equals: key, mode: "insensitive" } },
        { customerEmail: { equals: key, mode: "insensitive" } },
      ],
    },
    include: { activity: true, resource: true },
    orderBy: { startTime: "desc" },
  });
}
