"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { getBusinessSettings } from "@/lib/settings";
import { businessSettingsSchema } from "@/lib/validations";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export async function updateBusinessSettings(input: unknown): Promise<ActionResult> {
  const parsed = businessSettingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid settings." };

  const settings = await getBusinessSettings();
  await prisma.businessSettings.update({
    where: { id: settings.id },
    data: {
      ...parsed.data,
      addressLine: parsed.data.addressLine || null,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      facebookUrl: parsed.data.facebookUrl || null,
      instagramUrl: parsed.data.instagramUrl || null,
    },
  });

  revalidatePath("/admin/settings");
  revalidatePath("/");
  return { ok: true };
}

export interface OpeningHourInput {
  dayOfWeek: number;
  isClosed: boolean;
  openTime: string;
  closeTime: string;
}

export async function updateOpeningHours(days: OpeningHourInput[]): Promise<ActionResult> {
  for (const day of days) {
    const existing = await prisma.openingHours.findFirst({ where: { activityId: null, dayOfWeek: day.dayOfWeek } });
    const data = {
      isClosed: day.isClosed,
      openTime: day.isClosed ? null : day.openTime,
      closeTime: day.isClosed ? null : day.closeTime,
    };
    if (existing) {
      await prisma.openingHours.update({ where: { id: existing.id }, data });
    } else {
      await prisma.openingHours.create({ data: { activityId: null, dayOfWeek: day.dayOfWeek, ...data } });
    }
  }

  revalidatePath("/admin/settings");
  revalidatePath("/");
  return { ok: true };
}
