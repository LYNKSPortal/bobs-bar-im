"use server";

import { getAvailableSlots } from "@/lib/availability";
import { getBusinessSettings } from "@/lib/settings";
import { availabilityQuerySchema } from "@/lib/validations";

export interface AvailabilityActionResult {
  ok: boolean;
  error?: string;
  slots?: Awaited<ReturnType<typeof getAvailableSlots>>;
  currency?: string;
}

export async function fetchAvailability(input: {
  activityId: string;
  date: string;
  durationMinutes: number;
  resourceId?: string;
}): Promise<AvailabilityActionResult> {
  const parsed = availabilityQuerySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid request." };
  }

  const settings = await getBusinessSettings();
  const slots = await getAvailableSlots({
    activityId: parsed.data.activityId,
    dateStr: parsed.data.date,
    durationMinutes: parsed.data.durationMinutes,
    resourceId: parsed.data.resourceId,
    settings,
  });

  return { ok: true, slots, currency: settings.currency };
}
