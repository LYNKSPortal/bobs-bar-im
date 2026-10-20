import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 25;

export interface BookingListFilters {
  q?: string;
  status?: string;
  activityId?: string;
  page?: number;
}

export async function listBookings(filters: BookingListFilters) {
  const where: Prisma.BookingWhereInput = {};

  if (filters.status && filters.status !== "ALL") {
    where.status = filters.status as Prisma.EnumBookingStatusFilter["equals"];
  }
  if (filters.activityId && filters.activityId !== "ALL") {
    where.activityId = filters.activityId;
  }
  if (filters.q) {
    where.OR = [
      { reference: { contains: filters.q, mode: "insensitive" } },
      { customerName: { contains: filters.q, mode: "insensitive" } },
      { customerEmail: { contains: filters.q, mode: "insensitive" } },
      { customerPhone: { contains: filters.q, mode: "insensitive" } },
    ];
  }

  const page = Math.max(1, filters.page ?? 1);

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: { activity: true, resource: true },
      orderBy: { startTime: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.booking.count({ where }),
  ]);

  return { bookings, total, page, pageSize: PAGE_SIZE, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function getBookingDetail(id: string) {
  return prisma.booking.findUnique({
    where: { id },
    include: {
      activity: { include: { resources: { where: { status: "ACTIVE" } } } },
      resource: true,
      customer: true,
      statusHistory: { orderBy: { changedAt: "desc" }, include: { changedBy: true } },
      payments: true,
    },
  });
}
