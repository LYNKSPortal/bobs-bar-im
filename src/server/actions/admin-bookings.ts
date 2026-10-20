"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import {
  cancelBooking,
  createBooking,
  markArrived,
  markBookingStatus,
  rescheduleBooking,
} from "@/lib/booking-engine";
import { sendBookingCancellationEmail, sendBookingConfirmationEmail, sendBookingRescheduledEmail } from "@/lib/email";
import { BookingConflictError, ValidationFailedError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { getBusinessSettings } from "@/lib/settings";
import { formatInTz } from "@/lib/time";
import { adminBookingSchema } from "@/lib/validations";

export interface ActionResult {
  ok: boolean;
  error?: string;
  id?: string;
}

async function currentStaffId() {
  const session = await auth();
  return session?.user?.id;
}

export async function createAdminBooking(input: unknown): Promise<ActionResult> {
  const parsed = adminBookingSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid booking." };
  const data = parsed.data;

  try {
    const staffId = await currentStaffId();
    const booking = await createBooking({
      activityId: data.activityId,
      resourceId: data.resourceId,
      dateStr: data.date,
      startTimeStr: data.startTime,
      durationMinutes: data.durationMinutes,
      partySize: data.partySize,
      customerName: data.customerName || undefined,
      customerEmail: data.customerEmail || undefined,
      customerPhone: data.customerPhone || undefined,
      notes: data.notes || undefined,
      source: "ADMIN_MANUAL",
      createdById: staffId,
    });

    if (data.sendConfirmation && data.customerEmail) {
      await sendAdminConfirmation(booking.id);
    }

    revalidatePath("/admin");
    revalidatePath("/admin/calendar");
    revalidatePath("/admin/bookings");
    return { ok: true, id: booking.id };
  } catch (err) {
    if (err instanceof BookingConflictError || err instanceof ValidationFailedError) {
      return { ok: false, error: err.message };
    }
    console.error("createAdminBooking failed", err);
    return { ok: false, error: "Something went wrong creating the booking." };
  }
}

async function sendAdminConfirmation(bookingId: string) {
  const [booking, settings] = await Promise.all([
    prisma.booking.findUnique({ where: { id: bookingId }, include: { activity: true, resource: true } }),
    getBusinessSettings(),
  ]);
  if (!booking?.customerEmail) return;
  await sendBookingConfirmationEmail({
    to: booking.customerEmail,
    customerName: booking.customerName ?? "",
    reference: booking.reference,
    activityName: booking.activity.name,
    resourceName: booking.resource.name,
    dateLabel: formatInTz(booking.startTime, settings.timezone, "EEEE d MMMM yyyy"),
    timeLabel: formatInTz(booking.startTime, settings.timezone, "h:mm a"),
    durationMinutes: booking.durationMinutes,
    priceTotal: booking.priceTotal,
    currency: booking.currency,
    manageUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/manage/${booking.manageToken}`,
  });
}

export async function cancelAdminBooking(bookingId: string, reason?: string): Promise<ActionResult> {
  const staffId = await currentStaffId();
  const updated = await cancelBooking(bookingId, { reason, changedById: staffId });

  const full = await prisma.booking.findUnique({ where: { id: updated.id }, include: { activity: true, resource: true } });
  if (full?.customerEmail) {
    const settings = await getBusinessSettings();
    await sendBookingCancellationEmail({
      to: full.customerEmail,
      customerName: full.customerName ?? "",
      reference: full.reference,
      activityName: full.activity.name,
      resourceName: full.resource.name,
      dateLabel: formatInTz(full.startTime, settings.timezone, "EEEE d MMMM yyyy"),
      timeLabel: formatInTz(full.startTime, settings.timezone, "h:mm a"),
      durationMinutes: full.durationMinutes,
      priceTotal: full.priceTotal,
      currency: full.currency,
      manageUrl: "",
    });
  }

  revalidatePath("/admin");
  revalidatePath("/admin/calendar");
  revalidatePath("/admin/bookings");
  return { ok: true };
}

export async function updateBookingDetails(
  bookingId: string,
  data: { customerName?: string; customerEmail?: string; customerPhone?: string; notes?: string; partySize?: number }
): Promise<ActionResult> {
  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      customerName: data.customerName || null,
      customerEmail: data.customerEmail || null,
      customerPhone: data.customerPhone || null,
      notes: data.notes || null,
      partySize: data.partySize,
    },
  });
  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath("/admin/bookings");
  return { ok: true };
}

export async function markBookingArrived(bookingId: string): Promise<ActionResult> {
  await markArrived(bookingId);
  revalidatePath("/admin");
  revalidatePath("/admin/bookings");
  return { ok: true };
}

export async function updateBookingStatusAction(
  bookingId: string,
  status: "CONFIRMED" | "COMPLETED" | "NO_SHOW" | "PENDING"
): Promise<ActionResult> {
  const staffId = await currentStaffId();
  await markBookingStatus(bookingId, status, { changedById: staffId });
  revalidatePath("/admin");
  revalidatePath("/admin/bookings");
  return { ok: true };
}

export async function rescheduleAdminBooking(input: {
  bookingId: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  resourceId?: string;
}): Promise<ActionResult> {
  try {
    const staffId = await currentStaffId();
    const updated = await rescheduleBooking({
      bookingId: input.bookingId,
      dateStr: input.date,
      startTimeStr: input.startTime,
      durationMinutes: input.durationMinutes,
      resourceId: input.resourceId,
      changedById: staffId,
    });

    const full = await prisma.booking.findUnique({ where: { id: updated.id }, include: { activity: true, resource: true } });
    if (full?.customerEmail) {
      const settings = await getBusinessSettings();
      await sendBookingRescheduledEmail({
        to: full.customerEmail,
        customerName: full.customerName ?? "",
        reference: full.reference,
        activityName: full.activity.name,
        resourceName: full.resource.name,
        dateLabel: formatInTz(full.startTime, settings.timezone, "EEEE d MMMM yyyy"),
        timeLabel: formatInTz(full.startTime, settings.timezone, "h:mm a"),
        durationMinutes: full.durationMinutes,
        priceTotal: full.priceTotal,
        currency: full.currency,
        manageUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/manage/${full.manageToken}`,
      });
    }

    revalidatePath("/admin");
    revalidatePath("/admin/calendar");
    revalidatePath("/admin/bookings");
    return { ok: true, id: updated.id };
  } catch (err) {
    if (err instanceof BookingConflictError || err instanceof ValidationFailedError) {
      return { ok: false, error: err.message };
    }
    console.error("rescheduleAdminBooking failed", err);
    return { ok: false, error: "Something went wrong." };
  }
}
