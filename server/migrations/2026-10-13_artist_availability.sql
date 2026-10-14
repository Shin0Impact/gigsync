-- Card #26 - artist availability calendar.
-- Run this once against the live database (Supabase SQL editor, or
-- `psql "$DATABASE_URL" -f server/migrations/2026-10-13_artist_availability.sql`)
-- before using the new /api/artists/.../availability endpoints - this
-- shell has no network path to Supabase, so it can't be run from here.
--
-- One row per (artist, day) they've marked themselves available on -
-- a day with no row for that artist just means "not marked available",
-- there's no separate "unavailable" state to store.
CREATE TABLE IF NOT EXISTS artist_availability (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  available_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, available_date)
);

-- Every read is "all of this one artist's available days" (their own
-- editable calendar, or someone else viewing it) - the UNIQUE constraint
-- above already gives that lookup a covering index, so no extra index is
-- needed here.
