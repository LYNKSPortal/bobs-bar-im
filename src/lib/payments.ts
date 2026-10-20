import type Stripe from "stripe";

import { prisma } from "@/lib/prisma";
import { stripe, stripeEnabled } from "@/lib/stripe";

/** Amount (in the booking's smallest currency unit) that must be paid online now. */
export function amountDueNow(priceTotal: number, paymentMode: string, depositPercent: number | null) {
  if (paymentMode === "FULL") return priceTotal;
  if (paymentMode === "DEPOSIT") return Math.round((priceTotal * (depositPercent ?? 20)) / 100);
  return 0;
}

/**
 * Create a Stripe Checkout Session for a pending booking. The booking is
 * already held (status PENDING) in the database before this is called, so
 * the resource is unavailable to other customers while checkout is open.
 */
export async function createCheckoutSessionForBooking(bookingId: string, successUrl: string, cancelUrl: string) {
  if (!stripe) throw new Error("Stripe is not configured.");

  const booking = await prisma.booking.findUniqueOrThrow({
    where: { id: bookingId },
    include: { activity: true, resource: true },
  });

  const amount = amountDueNow(booking.priceTotal, booking.paymentMode, booking.activity.depositPercent);

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: booking.currency,
          unit_amount: amount,
          product_data: {
            name: `${booking.activity.name} \u2014 ${booking.resource.name}`,
            description: `${booking.paymentMode === "DEPOSIT" ? "Deposit for" : "Payment for"} booking ${booking.reference}`,
          },
        },
        quantity: 1,
      },
    ],
    customer_email: booking.customerEmail || undefined,
    client_reference_id: booking.id,
    metadata: { bookingId: booking.id, reference: booking.reference },
    success_url: successUrl,
    cancel_url: cancelUrl,
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 minute hold
  });

  await prisma.booking.update({ where: { id: booking.id }, data: { stripePaymentIntentId: session.id } });

  return session;
}

/** Idempotently apply a completed Stripe Checkout Session to its booking. */
export async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const bookingId = session.metadata?.bookingId || session.client_reference_id;
  if (!bookingId) return;

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) return;

  // Idempotency: if we've already recorded a payment for this session, skip.
  const existingPayment = await prisma.payment.findUnique({ where: { stripePaymentIntentId: session.id } });
  if (existingPayment) return;

  const amountPaid = session.amount_total ?? 0;
  const paymentStatus = booking.paymentMode === "DEPOSIT" ? "DEPOSIT_PAID" : "PAID";

  await prisma.$transaction([
    prisma.payment.create({
      data: {
        bookingId: booking.id,
        stripePaymentIntentId: session.id,
        amount: amountPaid,
        currency: booking.currency,
        status: paymentStatus,
      },
    }),
    prisma.booking.update({
      where: { id: booking.id },
      data: { status: "CONFIRMED", paymentStatus },
    }),
    prisma.bookingStatusEvent.create({
      data: { bookingId: booking.id, status: "CONFIRMED", note: "Payment received via Stripe" },
    }),
  ]);
}

/** Release the resource hold if a customer abandons Stripe Checkout. */
export async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  const bookingId = session.metadata?.bookingId || session.client_reference_id;
  if (!bookingId) return;

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking || booking.status !== "PENDING" || booking.paymentStatus === "PAID" || booking.paymentStatus === "DEPOSIT_PAID") {
    return;
  }

  await prisma.$transaction([
    prisma.booking.update({
      where: { id: booking.id },
      data: { status: "CANCELLED", cancelledAt: new Date(), cancelReason: "Payment not completed" },
    }),
    prisma.bookingStatusEvent.create({
      data: { bookingId: booking.id, status: "CANCELLED", note: "Checkout session expired without payment" },
    }),
  ]);
}

export { stripeEnabled };
