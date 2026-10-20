import { prisma } from "@/lib/prisma";

/**
 * BusinessSettings is a singleton row. This helper fetches it, creating a
 * sensible default row the first time the app runs against a fresh database.
 */
export async function getBusinessSettings() {
  const existing = await prisma.businessSettings.findFirst();
  if (existing) return existing;

  return prisma.businessSettings.create({
    data: {},
  });
}

export type BusinessSettings = Awaited<ReturnType<typeof getBusinessSettings>>;
