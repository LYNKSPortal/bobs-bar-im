import type { Activity, PricingRule } from "@prisma/client";

import { timeToMinutes } from "@/lib/time";

/**
 * Compute the total price (in smallest currency unit) for a booking.
 * Pricing rules are optional overrides of the activity's base hourly price,
 * scoped by duration, day of week, and/or time-of-day window. The rule
 * matching the most specific combination of criteria wins.
 */
export function calculatePrice(
  activity: Pick<Activity, "basePriceHourly">,
  pricingRules: PricingRule[],
  params: { durationMinutes: number; dayOfWeek: number; startTime: string }
): number {
  const slotMinutes = timeToMinutes(params.startTime);

  let bestRule: PricingRule | null = null;
  let bestScore = -1;

  for (const rule of pricingRules) {
    if (rule.durationMinutes !== null && rule.durationMinutes !== params.durationMinutes) continue;
    if (rule.dayOfWeek !== null && rule.dayOfWeek !== params.dayOfWeek) continue;
    if (rule.startTime !== null && rule.endTime !== null) {
      const start = timeToMinutes(rule.startTime);
      const end = timeToMinutes(rule.endTime);
      if (slotMinutes < start || slotMinutes >= end) continue;
    }

    const score =
      (rule.durationMinutes !== null ? 1 : 0) +
      (rule.dayOfWeek !== null ? 1 : 0) +
      (rule.startTime !== null ? 1 : 0);

    if (score > bestScore) {
      bestScore = score;
      bestRule = rule;
    }
  }

  if (bestRule) return bestRule.priceOverride;

  return Math.round((activity.basePriceHourly * params.durationMinutes) / 60);
}

export function formatPrice(amountMinor: number, currency: string): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amountMinor / 100);
}
