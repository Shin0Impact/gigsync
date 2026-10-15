-- Event search, urgent events, and user search.
-- Safe to re-run (everything is IF NOT EXISTS). Run in the Supabase SQL editor.

-- 1. Urgent events -----------------------------------------------------------
ALTER TABLE public.event
  ADD COLUMN IF NOT EXISTS is_urgent boolean NOT NULL DEFAULT false;

-- 2. Fast text search (ILIKE '%term%') --------------------------------------
-- pg_trgm lets Postgres use an index for substring matches. On Supabase the
-- extension lives in the "extensions" schema, which is already on search_path.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_event_title_trgm
  ON public.event USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_event_venue_name_trgm
  ON public.event USING gin (venue_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_event_descriptions_trgm
  ON public.event USING gin (descriptions gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_profiles_user_name_trgm
  ON public.profiles USING gin (user_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_profiles_name_trgm
  ON public.profiles USING gin (name gin_trgm_ops);

-- 3. Sorting / filtering helpers --------------------------------------------
CREATE INDEX IF NOT EXISTS idx_event_start_at ON public.event (start_at);
CREATE INDEX IF NOT EXISTS idx_event_created_at ON public.event (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_urgent ON public.event (start_at) WHERE is_urgent;
-- Distance search (ST_Distance on event.location::geography).
CREATE INDEX IF NOT EXISTS idx_event_location ON public.event USING gist ((location::geography));
