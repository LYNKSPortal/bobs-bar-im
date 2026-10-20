"use server";

import { revalidatePath } from "next/cache";

import { createBooking, cancelBooking, rescheduleBooking } from "@/lib/booking-engine";
import { sendBookingCancellationEmail, sendBookingConfirmationEmail, sendBookingRescheduledEmail } from "@/lib/email";
import { BookingConflictError, ValidationFailedError } from "@/lib/errors";
import { createCheckoutSessionForBooking, stripeEnabled } from "@/lib/payments";
import { prisma } from "@/lib/prisma";
import { getBusinessSettings } from "@/lib/settings";
import { createBookingSchema } from "@/lib/validations";
import { formatInTz } from "@/lib/time";

export interface BookingActionResult {
  ok: boolean;
  error?: string;
  reference?: string;
  manageToken?: string;
  checkoutUrl?: string;
}

export async function submitBooking(input: unknown): Promise<BookingActionResult> {
  const parsed = createBookingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid booking details." };
  }
  const data = parsed.data;

  try {
    const activity = await prisma.activity.findUniqueOrThrow({ where: { id: data.activityId } });
    const requiresPayment = stripeEnabled && activity.paymentMode !== "NONE";

    const booking = await createBooking({
      activityId: data.activityId,
      resourceId: data.resourceId,
      dateStr: data.date,
      startTimeStr: data.startTime,
      durationMinutes: data.durationMinutes,
      partySize: data.partySize,
      customerName: data.customerName,
      customerEmail: data.customerEmail || undefined,
      customerPhone: data.customerPhone,
      notes: data.notes || undefined,
      source: "ONLINE",
      status: requiresPayment ? "PENDING" : "CONFIRMED",
    });

    if (requiresPayment) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
      const session = await createCheckoutSessionForBooking(
        booking.id,
        `${appUrl}/booking/confirmation/${booking.reference}?t=${booking.manageToken}`,
        `${appUrl}/book?activity=${activity.slug}`
      );
      revalidatePath("/admin");
      return { ok: true, reference: booking.reference, manageToken: booking.manageToken, checkoutUrl: session.url ?? undefined };
    }

    await sendConfirmation(booking.id);

    revalidatePath("/admin");
    return { ok: true, reference: booking.reference, manageToken: booking.manageToken };
  } catch (err) {
    if (err instanceof BookingConflictError || err instanceof ValidationFailedError) {
      return { ok: false, error: err.message };
    }
    console.error("submitBooking failed", err);
    return { ok: false, error: "Something went wrong creating your booking. Please try again." };
  }
}

async function sendConfirmation(bookingId: string) {
  const [booking, settings] = await Promise.all([
    prisma.booking.findUnique({ where: { id: bookingId }, include: { activity: true, resource: true } }),
    getBusinessSettings(),
  ]);
  if (!booking || !booking.customerEmail) return;

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

export async function cancelBookingByToken(token: string): Promise<BookingActionResult> {
  const booking = await prisma.booking.findUnique({ where: { manageToken: token } });
  if (!booking) return { ok: false, error: "Booking not found." };
  if (booking.status === "CANCELLED") return { ok: false, error: "This booking is already cancelled." };

  const settings = await getBusinessSettings();
  const deadline = new Date(booking.startTime.getTime() - settings.cancellationDeadlineHours * 60 * 60 * 1000);
  if (new Date() > deadline) {
    return {
      ok: false,
      error: `Online cancellation closed ${settings.cancellationDeadlineHours}h before your booking. Please call us.`,
    };
  }

  const updated = await cancelBooking(booking.id, { reason: "Cancelled by customer" });

  const [full] = await Promise.all([
    prisma.booking.findUnique({ where: { id: updated.id }, include: { activity: true, resource: true } }),
  ]);
  if (full?.customerEmail) {
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
  return { ok: true };
}

export async function rescheduleBookingByToken(
  token: string,
  input: { date: string; startTime: string }
): Promise<BookingActionResult> {
  const booking = await prisma.booking.findUnique({ where: { manageToken: token } });
  if (!booking) return { ok: false, error: "Booking not found." };
  if (booking.status === "CANCELLED") return { ok: false, error: "This booking is cancelled." };

  const settings = await getBusinessSettings();
  const deadline = new Date(booking.startTime.getTime() - settings.cancellationDeadlineHours * 60 * 60 * 1000);
  if (new Date() > deadline) {
    return {
      ok: false,
      error: `Online rescheduling closed ${settings.cancellationDeadlineHours}h before your booking. Please call us.`,
    };
  }

  try {
    const updated = await rescheduleBooking({
      bookingId: booking.id,
      dateStr: input.date,
      startTimeStr: input.startTime,
      durationMinutes: booking.durationMinutes,
    });

    const full = await prisma.booking.findUnique({ where: { id: updated.id }, include: { activity: true, resource: true } });
    if (full?.customerEmail) {
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
        manageUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/manage/${token}`,
      });
    }

    revalidatePath("/admin");
    return { ok: true, reference: updated.reference };
  } catch (err) {
    if (err instanceof BookingConflictError || err instanceof ValidationFailedError) {
      return { ok: false, error: err.message };
    }
    console.error("rescheduleBookingByToken failed", err);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
