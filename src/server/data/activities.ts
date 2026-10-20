import { prisma } from "@/lib/prisma";

export async function getActiveActivities() {
  return prisma.activity.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
    include: { resources: { where: { status: "ACTIVE" } } },
  });
}

export async function getActivityBySlug(slug: string) {
  return prisma.activity.findUnique({
    where: { slug },
    include: { resources: { where: { status: "ACTIVE" }, orderBy: { sortOrder: "asc" } } },
  });
}

export type ActiveActivity = Awaited<ReturnType<typeof getActiveActivities>>[number];
