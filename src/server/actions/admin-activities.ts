"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { activitySchema, resourceSchema } from "@/lib/validations";

export interface ActionResult {
  ok: boolean;
  error?: string;
  id?: string;
}

export async function createActivity(input: unknown): Promise<ActionResult> {
  const parsed = activitySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid activity." };

  const existing = await prisma.activity.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) return { ok: false, error: "That URL slug is already in use." };

  const maxSort = await prisma.activity.aggregate({ _max: { sortOrder: true } });

  const activity = await prisma.activity.create({
    data: {
      ...parsed.data,
      imageUrl: parsed.data.imageUrl || undefined,
      shortDescription: parsed.data.shortDescription || undefined,
      sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
    },
  });

  revalidatePath("/admin/activities");
  revalidatePath("/activities");
  revalidatePath("/");
  return { ok: true, id: activity.id };
}

export async function updateActivity(id: string, input: unknown): Promise<ActionResult> {
  const parsed = activitySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid activity." };

  const existing = await prisma.activity.findFirst({ where: { slug: parsed.data.slug, NOT: { id } } });
  if (existing) return { ok: false, error: "That URL slug is already in use." };

  await prisma.activity.update({
    where: { id },
    data: { ...parsed.data, imageUrl: parsed.data.imageUrl || undefined, shortDescription: parsed.data.shortDescription || undefined },
  });

  revalidatePath("/admin/activities");
  revalidatePath(`/admin/activities/${id}`);
  revalidatePath("/activities");
  revalidatePath("/");
  return { ok: true, id };
}

export async function toggleActivityActive(id: string, active: boolean): Promise<ActionResult> {
  await prisma.activity.update({ where: { id }, data: { active } });
  revalidatePath("/admin/activities");
  revalidatePath("/activities");
  revalidatePath("/");
  return { ok: true };
}

export async function createResource(input: unknown): Promise<ActionResult> {
  const parsed = resourceSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid resource." };

  const maxSort = await prisma.resource.aggregate({
    where: { activityId: parsed.data.activityId },
    _max: { sortOrder: true },
  });

  const resource = await prisma.resource.create({
    data: { ...parsed.data, description: parsed.data.description || undefined, sortOrder: (maxSort._max.sortOrder ?? -1) + 1 },
  });

  revalidatePath(`/admin/activities/${parsed.data.activityId}`);
  revalidatePath("/admin/calendar");
  return { ok: true, id: resource.id };
}

export async function updateResourceStatus(
  id: string,
  status: "ACTIVE" | "UNAVAILABLE" | "MAINTENANCE" | "RETIRED"
): Promise<ActionResult> {
  const resource = await prisma.resource.update({ where: { id }, data: { status } });
  revalidatePath(`/admin/activities/${resource.activityId}`);
  revalidatePath("/admin/calendar");
  return { ok: true };
}

export async function updateResourceName(id: string, name: string): Promise<ActionResult> {
  const resource = await prisma.resource.update({ where: { id }, data: { name } });
  revalidatePath(`/admin/activities/${resource.activityId}`);
  return { ok: true };
}
