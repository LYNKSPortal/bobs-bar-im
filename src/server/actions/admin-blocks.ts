"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { blockFullDay, createBlockedPeriod, removeBlockedPeriod } from "@/lib/booking-engine";
import { BookingConflictError, ValidationFailedError } from "@/lib/errors";
import { blockTimeSchema } from "@/lib/validations";

export interface BlockActionResult {
  ok: boolean;
  error?: string;
  conflicts?: Array<{ type: string; label: string }>;
}

async function currentStaffId() {
  const session = await auth();
  return session?.user?.id;
}

export async function createAdminBlock(input: unknown): Promise<BlockActionResult> {
  const parsed = blockTimeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid request." };
  const data = parsed.data;

  try {
    const staffId = await currentStaffId();
    await createBlockedPeriod({
      resourceId: data.scope === "resource" ? data.resourceId : undefined,
      activityId: data.scope === "activity" ? data.activityId : undefined,
      dateStr: data.date,
      startTimeStr: data.startTime,
      endTimeStr: data.endTime,
      reason: data.reason,
      note: data.note || undefined,
      isRecurring: data.isRecurring,
      recurrenceUntil: data.recurrenceUntil ? new Date(data.recurrenceUntil) : undefined,
      createdById: staffId,
    });

    revalidatePath("/admin");
    revalidatePath("/admin/calendar");
    return { ok: true };
  } catch (err) {
    if (err instanceof BookingConflictError) {
      return { ok: false, error: err.message, conflicts: err.conflicts };
    }
    if (err instanceof ValidationFailedError) {
      return { ok: false, error: err.message };
    }
    console.error("createAdminBlock failed", err);
    return { ok: false, error: "Something went wrong." };
  }
}

export async function removeAdminBlock(id: string): Promise<BlockActionResult> {
  await removeBlockedPeriod(id);
  revalidatePath("/admin");
  revalidatePath("/admin/calendar");
  return { ok: true };
}

export async function blockFullDayAction(input: {
  date: string;
  reason: "MAINTENANCE" | "PRIVATE_EVENT" | "STAFF_USE" | "RESERVED" | "OTHER";
  note?: string;
}): Promise<BlockActionResult> {
  try {
    await blockFullDay(input.date, input.reason, input.note);
    revalidatePath("/admin");
    revalidatePath("/admin/calendar");
    return { ok: true };
  } catch (err) {
    if (err instanceof BookingConflictError) {
      return { ok: false, error: err.message, conflicts: err.conflicts };
    }
    console.error("blockFullDayAction failed", err);
    return { ok: false, error: "Something went wrong." };
  }
}
