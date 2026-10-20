-- Prevent double-booking at the database level.
-- An exclusion constraint guarantees that two ACTIVE bookings (PENDING or
-- CONFIRMED) for the same resource can never overlap in time, even under
-- concurrent writes. This is the last line of defense behind the
-- application-level advisory-lock + overlap check in the booking engine.

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "bookings"
  ADD CONSTRAINT "bookings_no_overlap_per_resource"
  EXCLUDE USING gist (
    "resourceId" WITH =,
    tstzrange("startTime", "endTime", '[)') WITH &&
  )
  WHERE (status IN ('PENDING', 'CONFIRMED'));

-- Same guarantee for manual availability blocks tied to a specific resource.
-- (Recurring blocks are expanded into concrete occurrences by the
-- availability engine at write time, so this still applies to them.)
ALTER TABLE "blocked_periods"
  ADD CONSTRAINT "blocked_periods_no_overlap_per_resource"
  EXCLUDE USING gist (
    "resourceId" WITH =,
    tstzrange("startTime", "endTime", '[)') WITH &&
  )
  WHERE ("resourceId" IS NOT NULL);
