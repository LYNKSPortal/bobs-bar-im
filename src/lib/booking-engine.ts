import { Prisma, type BlockReason, type BookingSource } from "@prisma/client";

import { getOpeningWindow } from "@/lib/availability";
import { BookingConflictError, ValidationFailedError } from "@/lib/errors";
import { calculatePrice } from "@/lib/pricing";
import { generateBookingReference, generateManageToken } from "@/lib/reference";
import { getBusinessSettings } from "@/lib/settings";
import { addMinutes, dayOfWeekInTz, localDateTimeToUtc, timeToMinutes } from "@/lib/time";
import { prisma } from "@/lib/prisma";

const EXCLUSION_VIOLATION = "23P01";

function lockKey(id: string) {
  // Deterministic 32-bit-safe key for pg_advisory_xact_lock from a cuid.
  return Prisma.sql`hashtext(${id})`;
}

export interface CreateBookingInput {
  activityId: string;
  resourceId?: string; // omit to auto-assign
  dateStr: string; // "yyyy-MM-dd" local
  startTimeStr: string; // "HH:mm" local
  durationMinutes: number;
  partySize?: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  notes?: string;
  source: BookingSource;
  createdById?: string;
  // Admin-only overrides
  status?: "PENDING" | "CONFIRMED";
}

export async function createBooking(input: CreateBookingInput) {
  const settings = await getBusinessSettings();
  const timezone = settings.timezone;

  const activity = await prisma.activity.findUnique({
    where: { id: input.activityId },
    include: { resources: { where: { status: "ACTIVE" }, orderBy: { sortOrder: "asc" } }, pricingRules: true },
  });
  if (!activity || !activity.active) throw new ValidationFailedError("This activity is not available for booking.");
  // Online customers are limited to the activity's published durations; staff
  // creating manual/phone/walk-in bookings may use any custom duration.
  if (input.source === "ONLINE" && !activity.durationsMinutes.includes(input.durationMinutes)) {
    throw new ValidationFailedError("That booking duration is not offered for this activity.");
  }

  const window = await getOpeningWindow(input.activityId, input.dateStr);
  if (window.closed || !window.open || !window.close) {
    throw new ValidationFailedError("The venue is closed on the selected date.");
  }
  const openMin = timeToMinutes(window.open);
  // A close time at or before the open time (e.g. "00:00") means the venue
  // closes after midnight, i.e. the following day.
  const rawCloseMin = timeToMinutes(window.close);
  const closeMin = rawCloseMin <= openMin ? rawCloseMin + 24 * 60 : rawCloseMin;
  const startMin = timeToMinutes(input.startTimeStr);
  if (startMin < openMin || startMin + input.durationMinutes > closeMin) {
    throw new ValidationFailedError("The selected time is outside opening hours.");
  }

  const startTime = localDateTimeToUtc(input.dateStr, input.startTimeStr, timezone);
  const endTime = addMinutes(startTime, input.durationMinutes);

  if (input.source === "ONLINE") {
    const earliest = addMinutes(new Date(), settings.minAdvanceMinutes || 0);
    const latest = addMinutes(new Date(), (settings.maxAdvanceDays || 60) * 24 * 60);
    if (startTime < earliest) throw new ValidationFailedError("This time is too soon to book online.");
    if (startTime > latest) throw new ValidationFailedError("This date is too far in the future to book online.");
  }

  const candidateResourceIds = input.resourceId
    ? [input.resourceId]
    : activity.resources.map((r) => r.id);

  if (candidateResourceIds.length === 0) {
    throw new ValidationFailedError("There are no resources configured for this activity.");
  }

  const price = calculatePrice(activity, activity.pricingRules, {
    durationMinutes: input.durationMinutes,
    dayOfWeek: dayOfWeekInTz(input.dateStr),
    startTime: input.startTimeStr,
  });

  const paymentStatus = activity.paymentMode === "NONE" ? "NOT_REQUIRED" : "UNPAID";

  try {
    return await prisma.$transaction(async (tx) => {
      // Serialize concurrent attempts against the same activity's resources.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${lockKey(input.activityId)})`;

      let chosenResourceId: string | null = null;
      for (const resourceId of candidateResourceIds) {
        const conflict = await tx.booking.findFirst({
          where: {
            resourceId,
            status: { in: ["PENDING", "CONFIRMED"] },
            startTime: { lt: endTime },
            endTime: { gt: startTime },
          },
          select: { id: true },
        });
        if (conflict) continue;

        const blockConflict = await tx.blockedPeriod.findFirst({
          where: {
            isRecurring: false,
            OR: [
              { resourceId, startTime: { lt: endTime }, endTime: { gt: startTime } },
              { activityId: input.activityId, resourceId: null, startTime: { lt: endTime }, endTime: { gt: startTime } },
            ],
          },
          select: { id: true },
        });
        if (blockConflict) continue;

        chosenResourceId = resourceId;
        break;
      }

      if (!chosenResourceId) {
        throw new BookingConflictError(
          input.resourceId
            ? "That table/resource is no longer available for the selected time."
            : "No resources are available for the selected time. Please choose another slot."
        );
      }

      const booking = await tx.booking.create({
        data: {
          reference: generateBookingReference(),
          manageToken: generateManageToken(),
          activityId: input.activityId,
          resourceId: chosenResourceId,
          customerName: input.customerName,
          customerEmail: input.customerEmail,
          customerPhone: input.customerPhone,
          notes: input.notes,
          startTime,
          endTime,
          durationMinutes: input.durationMinutes,
          partySize: input.partySize,
          status: input.status ?? "CONFIRMED",
          source: input.source,
          priceTotal: price,
          currency: settings.currency,
          paymentMode: activity.paymentMode,
          paymentStatus,
          createdById: input.createdById,
        },
      });

      await tx.bookingStatusEvent.create({
        data: { bookingId: booking.id, status: booking.status, changedById: input.createdById },
      });

      await tx.notification.create({
        data: {
          type: "NEW_BOOKING",
          title: "New booking",
          message: `${input.customerName ?? "A customer"} booked ${activity.name} on ${input.dateStr} at ${input.startTimeStr}.`,
          link: `/admin/bookings/${booking.id}`,
        },
      });

      return booking;
    });
  } catch (err) {
    if (isExclusionViolation(err)) {
      throw new BookingConflictError("That time was just booked by someone else. Please choose another slot.");
    }
    throw err;
  }
}

function isExclusionViolation(err: unknown): boolean {
  if (err instanceof BookingConflictError) return false;
  const message = err instanceof Error ? err.message : String(err);
  return message.includes(EXCLUSION_VIOLATION) || message.toLowerCase().includes("exclusion constraint");
}

export async function cancelBooking(bookingId: string, opts: { reason?: string; changedById?: string }) {
  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.update({
      where: { id: bookingId },
      data: { status: "CANCELLED", cancelledAt: new Date(), cancelReason: opts.reason },
    });
    await tx.bookingStatusEvent.create({
      data: { bookingId, status: "CANCELLED", note: opts.reason, changedById: opts.changedById },
    });
    return booking;
  });
}

export async function markBookingStatus(
  bookingId: string,
  status: "CONFIRMED" | "COMPLETED" | "NO_SHOW" | "PENDING",
  opts: { changedById?: string; note?: string } = {}
) {
  return prisma.$transaction(async (tx) => {
    const data: Prisma.BookingUpdateInput = { status };
    if (status === "COMPLETED") data.completedAt = new Date();
    const booking = await tx.booking.update({ where: { id: bookingId }, data });
    await tx.bookingStatusEvent.create({
      data: { bookingId, status, note: opts.note, changedById: opts.changedById },
    });
    return booking;
  });
}

export async function markArrived(bookingId: string) {
  return prisma.booking.update({ where: { id: bookingId }, data: { arrivedAt: new Date() } });
}

export interface RescheduleInput {
  bookingId: string;
  dateStr: string;
  startTimeStr: string;
  durationMinutes: number;
  resourceId?: string;
  changedById?: string;
}

export async function rescheduleBooking(input: RescheduleInput) {
  const settings = await getBusinessSettings();
  const existing = await prisma.booking.findUniqueOrThrow({ where: { id: input.bookingId } });
  const startTime = localDateTimeToUtc(input.dateStr, input.startTimeStr, settings.timezone);
  const endTime = addMinutes(startTime, input.durationMinutes);
  const resourceId = input.resourceId ?? existing.resourceId;

  try {
    return await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${lockKey(resourceId)})`;

      const conflict = await tx.booking.findFirst({
        where: {
          id: { not: input.bookingId },
          resourceId,
          status: { in: ["PENDING", "CONFIRMED"] },
          startTime: { lt: endTime },
          endTime: { gt: startTime },
        },
      });
      if (conflict) throw new BookingConflictError("That resource is already booked at the new time.");

      const blockConflict = await tx.blockedPeriod.findFirst({
        where: {
          isRecurring: false,
          resourceId,
          startTime: { lt: endTime },
          endTime: { gt: startTime },
        },
      });
      if (blockConflict) throw new BookingConflictError("That resource is blocked at the new time.");

      const booking = await tx.booking.update({
        where: { id: input.bookingId },
        data: { startTime, endTime, durationMinutes: input.durationMinutes, resourceId },
      });

      await tx.bookingStatusEvent.create({
        data: { bookingId: booking.id, status: booking.status, note: "Rescheduled", changedById: input.changedById },
      });

      return booking;
    });
  } catch (err) {
    if (isExclusionViolation(err)) {
      throw new BookingConflictError("That time was just booked by someone else.");
    }
    throw err;
  }
}

export interface CreateBlockInput {
  resourceId?: string;
  activityId?: string;
  dateStr: string;
  startTimeStr: string;
  endTimeStr: string;
  reason: BlockReason;
  note?: string;
  isRecurring?: boolean;
  recurrenceUntil?: Date;
  createdById?: string;
}

export async function createBlockedPeriod(input: CreateBlockInput) {
  const settings = await getBusinessSettings();
  const timezone = settings.timezone;
  const startTime = localDateTimeToUtc(input.dateStr, input.startTimeStr, timezone);
  let endTime = localDateTimeToUtc(input.dateStr, input.endTimeStr, timezone);
  if (endTime <= startTime) endTime = addMinutes(endTime, 24 * 60);

  const resourceIds = input.resourceId
    ? [input.resourceId]
    : input.activityId
      ? (await prisma.resource.findMany({ where: { activityId: input.activityId }, select: { id: true } })).map((r) => r.id)
      : [];

  if (resourceIds.length === 0 && !input.activityId) {
    throw new ValidationFailedError("Select a resource or an activity to block.");
  }

  return prisma.$transaction(async (tx) => {
    for (const resourceId of resourceIds) {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${lockKey(resourceId)})`;

      const conflicts = await tx.booking.findMany({
        where: {
          resourceId,
          status: { in: ["PENDING", "CONFIRMED"] },
          startTime: { lt: endTime },
          endTime: { gt: startTime },
        },
        select: { id: true, reference: true, customerName: true, startTime: true, endTime: true },
      });

      if (conflicts.length > 0) {
        throw new BookingConflictError(
          `This time overlaps ${conflicts.length} existing booking(s). Cancel or move them first.`,
          conflicts.map((c) => ({ type: "booking" as const, label: `${c.reference} (${c.customerName ?? "guest"})` }))
        );
      }
    }

    if (input.resourceId) {
      return tx.blockedPeriod.create({
        data: {
          resourceId: input.resourceId,
          startTime,
          endTime,
          reason: input.reason,
          note: input.note,
          isRecurring: input.isRecurring ?? false,
          recurrenceUntil: input.recurrenceUntil,
          createdById: input.createdById,
        },
      });
    }

    // Whole-activity block (every resource, for the duration of the block).
    return tx.blockedPeriod.create({
      data: {
        activityId: input.activityId,
        startTime,
        endTime,
        reason: input.reason,
        note: input.note,
        isRecurring: input.isRecurring ?? false,
        recurrenceUntil: input.recurrenceUntil,
        createdById: input.createdById,
      },
    });
  });
}

export async function removeBlockedPeriod(id: string) {
  return prisma.blockedPeriod.delete({ where: { id } });
}

export async function blockFullDay(dateStr: string, reason: BlockReason, note: string | undefined) {
  const settings = await getBusinessSettings();
  const startTime = localDateTimeToUtc(dateStr, "00:00", settings.timezone);
  const endTime = addMinutes(startTime, 24 * 60);

  return prisma.$transaction(async (tx) => {
    const conflicts = await tx.booking.findMany({
      where: { status: { in: ["PENDING", "CONFIRMED"] }, startTime: { lt: endTime }, endTime: { gt: startTime } },
      select: { id: true, reference: true, customerName: true },
    });
    if (conflicts.length > 0) {
      throw new BookingConflictError(
        `This day has ${conflicts.length} existing booking(s). Cancel or move them first, or block individual resources instead.`,
        conflicts.map((c) => ({ type: "booking" as const, label: `${c.reference} (${c.customerName ?? "guest"})` }))
      );
    }

    const existing = await tx.dateOverride.findFirst({ where: { activityId: null, date: new Date(dateStr) } });
    if (existing) {
      return tx.dateOverride.update({ where: { id: existing.id }, data: { isClosed: true, reason: note ?? reason } });
    }
    return tx.dateOverride.create({ data: { activityId: null, date: new Date(dateStr), isClosed: true, reason: note ?? reason } });
  });
}
