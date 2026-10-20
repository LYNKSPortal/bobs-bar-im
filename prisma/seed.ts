import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv();

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Bob's Bar...");

  // --- Business settings -----------------------------------------------
  const existingSettings = await prisma.businessSettings.findFirst();
  if (!existingSettings) {
    await prisma.businessSettings.create({
      data: {
        businessName: "Bob's Bar",
        addressLine: "12 Harbourfront Lane, London, E1 6AN",
        phone: "+44 20 7946 0958",
        email: "hello@bobsbar.example.com",
        timezone: "Europe/London",
        currency: "gbp",
        minAdvanceMinutes: 30,
        maxAdvanceDays: 60,
        bufferMinutes: 10,
        slotIntervalMinutes: 30,
        cancellationDeadlineHours: 12,
        facebookUrl: "https://facebook.com",
        instagramUrl: "https://instagram.com",
      },
    });
    console.log("Created business settings");
  }

  // --- Venue-wide opening hours (10:00 - 23:00 every day) ---------------
  for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
    const existing = await prisma.openingHours.findFirst({ where: { activityId: null, dayOfWeek } });
    if (!existing) {
      await prisma.openingHours.create({
        data: {
          activityId: null,
          dayOfWeek,
          isClosed: false,
          openTime: "10:00",
          closeTime: dayOfWeek === 5 || dayOfWeek === 6 ? "00:00" : "23:00",
        },
      });
    }
  }
  console.log("Set default venue opening hours");

  // --- Owner account ------------------------------------------------------
  const ownerEmail = "owner@bobsbar.example.com";
  const ownerPassword = "ChangeMe123!";
  const existingOwner = await prisma.staffUser.findUnique({ where: { email: ownerEmail } });
  if (!existingOwner) {
    await prisma.staffUser.create({
      data: {
        name: "Bob",
        email: ownerEmail,
        passwordHash: await bcrypt.hash(ownerPassword, 12),
        role: "OWNER",
      },
    });
    console.log(`Created owner account: ${ownerEmail} / ${ownerPassword}`);
  }

  // --- Activities & resources --------------------------------------------
  const pool = await upsertActivity({
    name: "Pool",
    slug: "pool",
    description:
      "American pool on tournament-grade tables. Perfect for a casual game with friends or a competitive grudge match.",
    shortDescription: "Tournament-grade pool tables.",
    imageUrl:
      "https://images.unsplash.com/photo-1716155249738-5d6db5d54400?q=80&w=1600&auto=format&fit=crop",
    allowResourceSelection: false,
    durationsMinutes: [30, 60, 90],
    defaultDurationMinutes: 60,
    basePriceHourly: 1600,
    paymentMode: "NONE",
    resourceNames: ["Pool Table 1", "Pool Table 2", "Pool Table 3"],
  });

  const golf = await upsertActivity({
    name: "Golf Simulator",
    slug: "golf-simulator",
    description:
      "Full-swing golf simulator bays with world-famous courses loaded and launch-monitor stats for every shot.",
    shortDescription: "Play world-famous courses indoors.",
    imageUrl:
      "https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=1600&auto=format&fit=crop",
    allowResourceSelection: true,
    durationsMinutes: [60, 90, 120],
    defaultDurationMinutes: 60,
    basePriceHourly: 3000,
    paymentMode: "DEPOSIT",
    depositPercent: 20,
    maxPartySize: 6,
    resourceNames: ["Golf Simulator 1", "Golf Simulator 2"],
  });

  const billiards = await upsertActivity({
    name: "Billiards",
    slug: "billiards",
    description: "Classic English billiards on a full-size table, in a quiet corner of the venue.",
    shortDescription: "Classic English billiards.",
    imageUrl:
      "https://images.unsplash.com/photo-1676333047876-0c5ee0716681?q=80&w=1600&auto=format&fit=crop",
    allowResourceSelection: false,
    durationsMinutes: [30, 60, 90],
    defaultDurationMinutes: 60,
    basePriceHourly: 1800,
    paymentMode: "NONE",
    resourceNames: ["Billiards Table 1"],
  });

  console.log("Upserted activities:", pool.slug, golf.slug, billiards.slug);
  console.log("Seed complete.");
}

async function upsertActivity(input: {
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  imageUrl: string;
  allowResourceSelection: boolean;
  durationsMinutes: number[];
  defaultDurationMinutes: number;
  basePriceHourly: number;
  paymentMode: "NONE" | "DEPOSIT" | "FULL";
  depositPercent?: number;
  maxPartySize?: number;
  resourceNames: string[];
}) {
  const activity = await prisma.activity.upsert({
    where: { slug: input.slug },
    update: {
      imageUrl: input.imageUrl,
      shortDescription: input.shortDescription,
    },
    create: {
      name: input.name,
      slug: input.slug,
      description: input.description,
      shortDescription: input.shortDescription,
      imageUrl: input.imageUrl,
      allowResourceSelection: input.allowResourceSelection,
      durationsMinutes: input.durationsMinutes,
      defaultDurationMinutes: input.defaultDurationMinutes,
      basePriceHourly: input.basePriceHourly,
      paymentMode: input.paymentMode,
      depositPercent: input.depositPercent,
      maxPartySize: input.maxPartySize,
    },
  });

  const existingResources = await prisma.resource.count({ where: { activityId: activity.id } });
  if (existingResources === 0) {
    await prisma.resource.createMany({
      data: input.resourceNames.map((name, i) => ({
        activityId: activity.id,
        name,
        sortOrder: i,
      })),
    });
  }

  return activity;
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
