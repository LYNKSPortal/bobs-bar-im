import { z } from "zod";

export const availabilityQuerySchema = z.object({
  activityId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  durationMinutes: z.coerce.number().int().positive(),
});

export const createBookingSchema = z.object({
  activityId: z.string().min(1),
  resourceId: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time"),
  durationMinutes: z.coerce.number().int().positive(),
  partySize: z.coerce.number().int().positive().optional(),
  customerName: z.string().min(1, "Name is required").max(120),
  customerEmail: z.string().email("Enter a valid email").optional().or(z.literal("")),
  customerPhone: z.string().min(5, "Enter a valid phone number").max(32),
  notes: z.string().max(1000).optional().or(z.literal("")),
});

export const adminBookingSchema = z.object({
  activityId: z.string().min(1),
  resourceId: z.string().min(1, "Select a resource"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time"),
  durationMinutes: z.coerce.number().int().positive(),
  partySize: z.coerce.number().int().positive().optional(),
  customerName: z.string().max(120).optional().or(z.literal("")),
  customerEmail: z.string().email().optional().or(z.literal("")),
  customerPhone: z.string().max(32).optional().or(z.literal("")),
  notes: z.string().max(1000).optional().or(z.literal("")),
  sendConfirmation: z.boolean().optional(),
});

export const blockTimeSchema = z.object({
  scope: z.enum(["resource", "activity"]),
  resourceId: z.string().optional(),
  activityId: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  reason: z.enum(["MAINTENANCE", "PRIVATE_EVENT", "STAFF_USE", "RESERVED", "OTHER"]),
  note: z.string().max(500).optional().or(z.literal("")),
  isRecurring: z.boolean().optional(),
  recurrenceUntil: z.string().optional(),
});

export const activitySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only"),
  description: z.string().min(1, "Description is required"),
  shortDescription: z.string().max(200).optional().or(z.literal("")),
  imageUrl: z.string().optional().or(z.literal("")),
  active: z.boolean().optional(),
  allowResourceSelection: z.boolean().optional(),
  durationsMinutes: z.array(z.number().int().positive()).min(1, "Add at least one duration"),
  defaultDurationMinutes: z.coerce.number().int().positive(),
  minPartySize: z.coerce.number().int().positive().optional(),
  maxPartySize: z.coerce.number().int().positive().optional(),
  basePriceHourly: z.coerce.number().int().nonnegative(),
  paymentMode: z.enum(["NONE", "DEPOSIT", "FULL"]),
  depositPercent: z.coerce.number().int().min(1).max(100).optional(),
});

export const resourceSchema = z.object({
  activityId: z.string().min(1),
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional().or(z.literal("")),
  status: z.enum(["ACTIVE", "UNAVAILABLE", "MAINTENANCE", "RETIRED"]),
});

export const businessSettingsSchema = z.object({
  businessName: z.string().min(1).max(120),
  addressLine: z.string().max(300).optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  timezone: z.string().min(1),
  currency: z.string().min(3).max(3),
  minAdvanceMinutes: z.coerce.number().int().min(0),
  maxAdvanceDays: z.coerce.number().int().min(1),
  bufferMinutes: z.coerce.number().int().min(0),
  slotIntervalMinutes: z.coerce.number().int().min(5),
  cancellationDeadlineHours: z.coerce.number().int().min(0),
  facebookUrl: z.string().optional().or(z.literal("")),
  instagramUrl: z.string().optional().or(z.literal("")),
});

export const openingHoursSchema = z.object({
  activityId: z.string().nullable(),
  days: z.array(
    z.object({
      dayOfWeek: z.number().int().min(0).max(6),
      isClosed: z.boolean(),
      openTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
      closeTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    })
  ),
});

export const contactFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  email: z.string().email("Enter a valid email"),
  message: z.string().min(1, "Message is required").max(2000),
});

export type CreateBookingValues = z.infer<typeof createBookingSchema>;
export type AdminBookingValues = z.infer<typeof adminBookingSchema>;
export type BlockTimeValues = z.infer<typeof blockTimeSchema>;
export type ActivityValues = z.infer<typeof activitySchema>;
export type ResourceValues = z.infer<typeof resourceSchema>;
export type BusinessSettingsValues = z.infer<typeof businessSettingsSchema>;
