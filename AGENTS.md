<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Bob's Bar — Project Notes

Entertainment venue booking platform: Next.js 16 (App Router) + TypeScript + Tailwind + shadcn/ui (Base UI
primitives — use the `render` prop, not `asChild`) + Prisma ORM 6 + PostgreSQL (Neon).

### Stack decisions
- **Prisma**: pinned to classic v6.x (`prisma`/`@prisma/client`). Prisma 7 requires driver adapters and ESM-only
  output which is a much bigger migration than this project needs — do not upgrade without a deliberate decision.
- **Database**: Neon Postgres, managed via the Neon CLI + `neon.ts` (project `tiny-cell-11515019`, org
  `org-shy-queen-65602427`, branch `production`). `DATABASE_URL` (pooled, for the app — note `&pgbouncer=true`,
  required by Prisma 6 when going through Neon's PgBouncer pooler) and `DIRECT_URL` (unpooled, for `prisma migrate`
  and other session-level operations) are both required in `.env` (used by the Prisma CLI) and `.env.local` (used
  by Next.js). `neon deploy` / `neon env pull` only ever write `DATABASE_URL` and `DATABASE_URL_UNPOOLED` — after
  pulling, copy `DATABASE_URL_UNPOOLED`'s value into `DIRECT_URL` by hand (Prisma's schema key is `DIRECT_URL`,
  not `DATABASE_URL_UNPOOLED`). The Neon CLI lives at `~/.npm-global/bin/neon`, which may not be on `PATH` by
  default — add it or invoke the full path.
- **Double-booking prevention**: Postgres `EXCLUDE USING gist` constraints on `bookings` and `blocked_periods`
  (see `prisma/migrations/20261020141100_booking_exclusion_constraint`), backed by `pg_advisory_xact_lock` in
  `src/lib/booking-engine.ts`. All `DateTime` columns that represent absolute instants use `@db.Timestamptz(3)` —
  do **not** remove this, plain `timestamp` breaks the exclusion constraint (implicit cast isn't IMMUTABLE).
- **Auth**: NextAuth v5 (beta) credentials provider, `StaffUser` table, JWT sessions. Admin routes are protected by
  `src/proxy.ts` (Next 16 renamed `middleware.ts` to `proxy.ts`) and again inside
  `src/app/admin/(dashboard)/layout.tsx`.
- **shadcn/ui is on Base UI**, not Radix. Use `render={<Link href="..." />}` instead of `asChild` for
  Button/Trigger/Close components.

### Environment variables
See `.env.local` for the full list. Required to run locally: `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`,
`NEXTAUTH_URL`, `NEXT_PUBLIC_APP_URL`. Optional (feature gated, app works fine without them):
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — online payments. Without
  these, every activity behaves as pay-at-venue regardless of its configured payment mode. Webhook endpoint:
  `/api/webhooks/stripe`, listening for `checkout.session.completed` and `checkout.session.expired`.
- `RESEND_API_KEY` / `EMAIL_FROM` — transactional email. Without it, booking actions succeed but no email is sent.

### Commands
- `npm run dev` — start dev server
- `npx prisma migrate dev` — apply schema changes (loads env from `.env`)
- `npm run db:seed` — seed sample activities/resources/business settings/owner login
- `npm run db:studio` — Prisma Studio
- Default seeded owner login: `admin` / `admin` (login field accepts any string, not just email, since
  `StaffUser.email` is just a unique login identifier) — **this is a temporary placeholder, change it before
  going live.**

### Known simplifications (documented, not oversights)
- `Customer` records aren't created by the booking flow; the admin Customers page aggregates distinct
  phone/email from `Booking` rows instead of maintaining a separate CRM table.
- Recurring blocked periods are expanded on read (`src/lib/availability.ts`), not materialized as rows.
- Reports page aggregates on request (no pre-computed rollup tables) — fine at this scale, revisit if booking
  volume grows very large.

### Floor plan table picker (Pool, Snooker)
- `Resource` has optional `mapX/mapY/mapW/mapH/mapRotation/mapLabel` (percentages of a stylized room schematic,
  not a real architectural drawing). `Activity.floorPlanEnabled` + `Activity.floorPlanMarkers` (JSON
  `{label,x,y}[]`, e.g. Entrance/Bar) turn on the picker. Resources without map coordinates are simply omitted
  from the floor plan.
- `src/components/booking/floor-plan-picker.tsx` renders the schematic; `getAvailableSlots` /
  `fetchAvailability` accept an optional `resourceId` to restrict availability to exactly one table (used when a
  customer picks a specific table before choosing a time).
- Entry points: `/activities/[slug]` (`ActivityBookingSection` — pick a table on the floor plan first, which
  locks `BookingWidget` to that resource), and inline inside `BookingDetailsDialog` for any
  `floorPlanEnabled` activity booked via the homepage/`/book` widget.
- **Not yet exposed in the admin UI** — table positions are only set via `prisma/seed.ts` today. Adding new
  resources through the admin Activities page works fine, they just won't appear on the floor plan until given
  map coordinates (currently only possible via a DB/seed update).
