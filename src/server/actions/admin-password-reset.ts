"use server";

import crypto from "node:crypto";

import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail, emailEnabled } from "@/lib/email";

// Password resets are intentionally restricted to this single admin login,
// regardless of how many StaffUser rows exist in the database.
const ALLOWED_RESET_EMAIL = "accounts@bobsbar.im";

export async function requestPasswordReset(
  _prevState: { message?: string; error?: string; devResetUrl?: string } | undefined,
  formData: FormData
) {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Enter your admin email/username." };

  // Always show the same success message, whether or not the account exists,
  // so this form can't be used to enumerate valid admin logins.
  const genericMessage = "If that account exists, a password reset link has been sent.";

  if (email.toLowerCase() !== ALLOWED_RESET_EMAIL) {
    return { message: genericMessage };
  }

  const user = await prisma.staffUser.findUnique({ where: { email: ALLOWED_RESET_EMAIL } });

  if (!user || !user.active) {
    return { message: genericMessage };
  }

  const token = crypto.randomBytes(32).toString("hex");
  const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.staffUser.update({
    where: { id: user.id },
    data: { resetToken: token, resetTokenExpiry },
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const resetUrl = `${baseUrl}/admin/reset-password/${token}`;

  if (emailEnabled) {
    await sendPasswordResetEmail({ to: user.email, resetUrl });
    return { message: genericMessage };
  }

  // No email provider configured (e.g. local dev) — surface the link directly
  // so the flow is still usable without Resend set up.
  return { message: genericMessage, devResetUrl: resetUrl };
}

export async function resetPassword(
  _prevState: { error?: string; success?: boolean } | undefined,
  formData: FormData
) {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!token) return { error: "Missing reset token." };
  if (password.length < 4) return { error: "Password must be at least 4 characters." };
  if (password !== confirmPassword) return { error: "Passwords do not match." };

  const user = await prisma.staffUser.findUnique({ where: { resetToken: token } });
  if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
    return { error: "This reset link is invalid or has expired. Request a new one." };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.staffUser.update({
    where: { id: user.id },
    data: { passwordHash, resetToken: null, resetTokenExpiry: null },
  });

  return { success: true };
}
