-- Postgres unique indexes treat NULL as distinct, so the compound
-- @@unique([activityId, dayOfWeek]) / @@unique([activityId, date]) indexes
-- do not stop multiple "venue-wide" rows (activityId IS NULL) for the same
-- day/date. Add partial unique indexes to close that gap.

CREATE UNIQUE INDEX "opening_hours_venue_wide_day_key"
  ON "opening_hours" ("dayOfWeek")
  WHERE "activityId" IS NULL;

CREATE UNIQUE INDEX "date_overrides_venue_wide_date_key"
  ON "date_overrides" ("date")
  WHERE "activityId" IS NULL;
