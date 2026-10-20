import { Resend } from "resend";

import { formatPrice } from "@/lib/pricing";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.EMAIL_FROM || "Bookings <bookings@example.com>";

export interface BookingEmailData {
  to: string;
  customerName: string;
  reference: string;
  activityName: string;
  resourceName: string;
  dateLabel: string;
  timeLabel: string;
  durationMinutes: number;
  priceTotal: number;
  currency: string;
  manageUrl: string;
}

function emailShell(title: string, bodyHtml: string) {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f5f3ef;font-family:Georgia,'Times New Roman',serif;color:#1c1a17;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 0;">
      <tr>
        <td align="center">
          <table width="560" cellpadding="0" cellspacing="0" style="background:#fffdf9;border-radius:12px;overflow:hidden;border:1px solid #e7e1d6;">
            <tr>
              <td style="background:#1c1a17;padding:24px 32px;">
                <span style="color:#f2c879;font-size:20px;letter-spacing:0.08em;text-transform:uppercase;">Bob's Bar</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="font-size:22px;margin:0 0 16px;">${title}</h1>
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px;background:#f5f3ef;color:#8a8375;font-size:12px;">
                Bob's Bar &middot; This is an automated message, please do not reply directly to this email.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function detailsTable(data: BookingEmailData) {
  return `<table cellpadding="0" cellspacing="0" style="width:100%;margin:16px 0;font-size:14px;">
    <tr><td style="padding:6px 0;color:#8a8375;">Reference</td><td style="padding:6px 0;text-align:right;font-weight:bold;">${data.reference}</td></tr>
    <tr><td style="padding:6px 0;color:#8a8375;">Activity</td><td style="padding:6px 0;text-align:right;">${data.activityName} &mdash; ${data.resourceName}</td></tr>
    <tr><td style="padding:6px 0;color:#8a8375;">Date</td><td style="padding:6px 0;text-align:right;">${data.dateLabel}</td></tr>
    <tr><td style="padding:6px 0;color:#8a8375;">Time</td><td style="padding:6px 0;text-align:right;">${data.timeLabel} (${data.durationMinutes} min)</td></tr>
    <tr><td style="padding:6px 0;color:#8a8375;">Total</td><td style="padding:6px 0;text-align:right;font-weight:bold;">${formatPrice(data.priceTotal, data.currency)}</td></tr>
  </table>`;
}

export async function sendBookingConfirmationEmail(data: BookingEmailData) {
  if (!resend || !data.to) return { skipped: true };

  return resend.emails.send({
    from: FROM,
    to: data.to,
    subject: `Booking confirmed \u2014 ${data.reference}`,
    html: emailShell(
      `Hi ${data.customerName || "there"}, your booking is confirmed!`,
      `${detailsTable(data)}<p style="margin:24px 0 0;"><a href="${data.manageUrl}" style="background:#1c1a17;color:#f2c879;padding:12px 20px;border-radius:8px;text-decoration:none;font-size:14px;">Manage your booking</a></p>`
    ),
  });
}

export async function sendBookingCancellationEmail(data: BookingEmailData) {
  if (!resend || !data.to) return { skipped: true };

  return resend.emails.send({
    from: FROM,
    to: data.to,
    subject: `Booking cancelled \u2014 ${data.reference}`,
    html: emailShell(`Your booking has been cancelled`, detailsTable(data)),
  });
}

export async function sendBookingRescheduledEmail(data: BookingEmailData) {
  if (!resend || !data.to) return { skipped: true };

  return resend.emails.send({
    from: FROM,
    to: data.to,
    subject: `Booking updated \u2014 ${data.reference}`,
    html: emailShell(
      `Your booking has been rescheduled`,
      `${detailsTable(data)}<p style="margin:24px 0 0;"><a href="${data.manageUrl}" style="background:#1c1a17;color:#f2c879;padding:12px 20px;border-radius:8px;text-decoration:none;font-size:14px;">View your booking</a></p>`
    ),
  });
}

export async function sendContactMessageEmail(data: { to: string; fromName: string; fromEmail: string; message: string }) {
  if (!resend) return { skipped: true };

  return resend.emails.send({
    from: FROM,
    to: data.to,
    replyTo: data.fromEmail,
    subject: `New contact form message from ${data.fromName}`,
    html: emailShell(
      `New message from ${data.fromName}`,
      `<p style="white-space:pre-wrap;">${escapeHtml(data.message)}</p><p style="margin-top:16px;color:#8a8375;">${escapeHtml(data.fromEmail)}</p>`
    ),
  });
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export const emailEnabled = Boolean(resend);
