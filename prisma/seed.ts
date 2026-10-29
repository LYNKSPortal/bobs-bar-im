import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv();

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ROOM_MARKERS = [
  { label: "Entrance", x: 15, y: 6 },
  { label: "Bar", x: 88, y: 94 },
];

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

  // --- Venue-wide opening hours (12:00 - 00:00 every day) ---------------
  for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
    const existing = await prisma.openingHours.findFirst({ where: { activityId: null, dayOfWeek } });
    if (!existing) {
      await prisma.openingHours.create({
        data: {
          activityId: null,
          dayOfWeek,
          isClosed: false,
          openTime: "12:00",
          closeTime: "00:00",
        },
      });
    }
  }
  console.log("Set default venue opening hours");

  // --- Owner account ------------------------------------------------------
  // NOTE: temporary simple credentials for initial setup/testing.
  // Change this before going live (see admin Settings or re-seed with new values).
  const ownerEmail = "info@bobsbar.im";
  const ownerPassword = "admin";
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
  // Pool and Snooker share one room (see the venue's floor plan), so they use
  // the same Entrance/Bar markers and a floor-plan-based table picker.
  const pool = await upsertActivity({
    name: "Pool",
    slug: "pool",
    description:
      "American pool on tournament-grade tables. Perfect for a casual game with friends or a competitive grudge match.",
    shortDescription: "Tournament-grade pool tables.",
    imageUrl: "https://images.unsplash.com/photo-1716155249738-5d6db5d54400?q=80&w=1600&auto=format&fit=crop",
    allowResourceSelection: true,
    floorPlanEnabled: true,
    floorPlanMarkers: ROOM_MARKERS,
    durationsMinutes: [60, 120, 180],
    defaultDurationMinutes: 60,
    basePriceHourly: 600,
    paymentMode: "NONE",
    resources: [
      { name: "Pool Table 1", mapLabel: "P1", mapX: 72, mapY: 14, mapW: 18, mapH: 13 },
      { name: "Pool Table 2", mapLabel: "P2", mapX: 63, mapY: 38, mapW: 15, mapH: 17 },
      { name: "Pool Table 3", mapLabel: "P3", mapX: 81, mapY: 38, mapW: 15, mapH: 17 },
      { name: "Pool Table 4", mapLabel: "P4", mapX: 72, mapY: 60, mapW: 18, mapH: 13 },
      { name: "Pool Table 5", mapLabel: "P5", mapX: 72, mapY: 80, mapW: 18, mapH: 13 },
    ],
  });

  const snooker = await upsertActivity({
    name: "Snooker",
    slug: "snooker",
    description:
      "Full-size snooker tables for a classic, precise game. Quieter corner of the venue, away from the bar.",
    shortDescription: "Full-size snooker tables.",
    imageUrl: "https://images.unsplash.com/photo-1716155249738-5d6db5d54400?q=80&w=1600&auto=format&fit=crop",
    allowResourceSelection: true,
    floorPlanEnabled: true,
    floorPlanMarkers: ROOM_MARKERS,
    durationsMinutes: [60, 120, 180],
    defaultDurationMinutes: 60,
    basePriceHourly: 900,
    paymentMode: "NONE",
    resources: [
      { name: "Snooker Table 1", mapLabel: "S1", mapX: 22, mapY: 18, mapW: 24, mapH: 13 },
      { name: "Snooker Table 2", mapLabel: "S2", mapX: 22, mapY: 42, mapW: 24, mapH: 13 },
      { name: "Snooker Table 3", mapLabel: "S3", mapX: 12, mapY: 75, mapW: 14, mapH: 22, mapRotation: 90 },
      { name: "Snooker Table 4", mapLabel: "S4", mapX: 30, mapY: 75, mapW: 14, mapH: 22, mapRotation: 90 },
    ],
  });

  const golf = await upsertActivity({
    name: "Golf Simulator",
    slug: "golf-simulator",
    description:
      "Full-swing golf simulator bays with world-famous courses loaded and launch-monitor stats for every shot.",
    shortDescription: "Play world-famous courses indoors.",
    imageUrl: "https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=1600&auto=format&fit=crop",
    allowResourceSelection: true,
    durationsMinutes: [60, 120, 180],
    defaultDurationMinutes: 60,
    basePriceHourly: 2000,
    paymentMode: "DEPOSIT",
    depositPercent: 20,
    maxPartySize: 6,
    resources: [{ name: "Golf Simulator 1" }, { name: "Golf Simulator 2" }],
  });

  const darts = await upsertActivity({
    name: "Virtual Steel Tip Darts",
    slug: "darts",
    description:
      "Electronic scoring steel-tip dartboards with built-in game modes, so you can focus on throwing while the board does the maths.",
    shortDescription: "Electronic scoring steel-tip dartboards.",
    imageUrl: "https://images.unsplash.com/photo-1756363212224-dca8af2eac90?q=80&w=1600&auto=format&fit=crop",
    allowResourceSelection: false,
    durationsMinutes: [60, 120, 180],
    defaultDurationMinutes: 60,
    basePriceHourly: 600,
    paymentMode: "NONE",
    resources: [{ name: "Dart Board 1" }, { name: "Dart Board 2" }],
  });

  console.log("Upserted activities:", pool.slug, snooker.slug, golf.slug, darts.slug);
  console.log("Seed complete.");
}

interface ResourceDef {
  name: string;
  mapLabel?: string;
  mapX?: number;
  mapY?: number;
  mapW?: number;
  mapH?: number;
  mapRotation?: number;
}

async function upsertActivity(input: {
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  imageUrl: string;
  allowResourceSelection: boolean;
  floorPlanEnabled?: boolean;
  floorPlanMarkers?: { label: string; x: number; y: number }[];
  durationsMinutes: number[];
  defaultDurationMinutes: number;
  basePriceHourly: number;
  paymentMode: "NONE" | "DEPOSIT" | "FULL";
  depositPercent?: number;
  maxPartySize?: number;
  resources: ResourceDef[];
}) {
  const activity = await prisma.activity.upsert({
    where: { slug: input.slug },
    update: {
      imageUrl: input.imageUrl,
      shortDescription: input.shortDescription,
      allowResourceSelection: input.allowResourceSelection,
      floorPlanEnabled: input.floorPlanEnabled ?? false,
      floorPlanMarkers: input.floorPlanMarkers ?? undefined,
    },
    create: {
      name: input.name,
      slug: input.slug,
      description: input.description,
      shortDescription: input.shortDescription,
      imageUrl: input.imageUrl,
      allowResourceSelection: input.allowResourceSelection,
      floorPlanEnabled: input.floorPlanEnabled ?? false,
      floorPlanMarkers: input.floorPlanMarkers ?? undefined,
      durationsMinutes: input.durationsMinutes,
      defaultDurationMinutes: input.defaultDurationMinutes,
      basePriceHourly: input.basePriceHourly,
      paymentMode: input.paymentMode,
      depositPercent: input.depositPercent,
      maxPartySize: input.maxPartySize,
    },
  });

  for (let i = 0; i < input.resources.length; i++) {
    const def = input.resources[i];
    const existing = await prisma.resource.findFirst({ where: { activityId: activity.id, name: def.name } });
    const mapData = {
      mapLabel: def.mapLabel,
      mapX: def.mapX,
      mapY: def.mapY,
      mapW: def.mapW,
      mapH: def.mapH,
      mapRotation: def.mapRotation ?? 0,
    };
    if (existing) {
      await prisma.resource.update({ where: { id: existing.id }, data: mapData });
    } else {
      await prisma.resource.create({ data: { activityId: activity.id, name: def.name, sortOrder: i, ...mapData } });
    }
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
