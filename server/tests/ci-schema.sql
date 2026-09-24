-- CI-only schema for the ephemeral Postgres/PostGIS service container.
--
-- This is NOT server/src/db/schema.sql - that file drifted from the real
-- Supabase database a while ago (different table names, missing tables,
-- different columns) and isn't safe to build CI on. Everything below was
-- reconstructed from live `information_schema.columns` /
-- `information_schema.table_constraints` / `pg_enum` queries run directly
-- against the real Supabase DB, not guessed from schema.sql or app code.
--
-- Two deliberate deviations from what's live, both because CI runs
-- against a vanilla Postgres/PostGIS container instead of Supabase:
--   1. `works.user_id` drops its live `DEFAULT auth.uid()` - `auth.uid()`
--      is a Supabase-specific function that doesn't exist here, and the
--      app always sets user_id explicitly anyway.
--   2. A handful of FK/id columns (event.organizer_id, followings.user_id,
--      followings.followed_id, work_likes.user_id) drop their live
--      `DEFAULT gen_random_uuid()` - that default is nonsensical for a
--      column that's supposed to point at an existing row, the app always
--      sets these explicitly, and keeping it would just let bugs that
--      forget to set the FK silently insert a garbage random uuid instead
--      of failing loudly.
-- Nullability, types, PK/FK/UNIQUE constraints, and every other default
-- are kept exactly as they are live, typos included (event.descriptions).

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TYPE user_role AS ENUM ('admin', 'moderator', 'artist', 'fan', 'organizer');
CREATE TYPE application_status AS ENUM ('pending', 'accepted', 'rejected');
CREATE TYPE event_status AS ENUM ('open', 'filled', 'completed', 'cancelled');
CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE "ArtistCategory" AS ENUM ('painter', 'photographer', 'designer', 'musician');

-- 1. Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 2. Roles (one row per user - PK is user_id itself, not a separate id)
CREATE TABLE roles (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  role user_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 3. Profiles
CREATE TABLE profiles (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  user_name TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL UNIQUE REFERENCES users(id),
  avatar_url TEXT,
  followers_number BIGINT NOT NULL DEFAULT 0,
  artists_type "ArtistCategory",
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  location GEOGRAPHY(Point, 4326),
  is_emergency_available BOOLEAN NOT NULL DEFAULT FALSE,
  emergency_until TIMESTAMP WITH TIME ZONE
);

-- 4. Event (singular - this is the live table name, not "events")
CREATE TABLE event (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  start_at TIMESTAMP,
  end_at TIMESTAMP,
  organizer_id UUID REFERENCES users(id),
  descriptions TEXT,
  title TEXT,
  venue_name TEXT,
  location GEOGRAPHY(Point, 4326),
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_rule VARCHAR,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  categories_needed "ArtistCategory"[],
  status event_status DEFAULT 'open',
  parent_event_id BIGINT REFERENCES event(id)
);

-- 5. Event applications
CREATE TABLE event_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id BIGINT NOT NULL REFERENCES event(id),
  artist_id UUID NOT NULL REFERENCES users(id),
  status application_status DEFAULT 'pending',
  cover_note TEXT,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (event_id, artist_id)
);

-- 6. Event media
CREATE TABLE event_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id BIGINT NOT NULL REFERENCES event(id),
  media_type VARCHAR NOT NULL,
  object_key TEXT NOT NULL,
  alt_text TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 7. Works (see header note: DEFAULT auth.uid() dropped from user_id)
CREATE TABLE works (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  description TEXT,
  user_id UUID REFERENCES users(id),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- 8. Work updates
CREATE TABLE work_updates (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE,
  work_id BIGINT REFERENCES works(id),
  version_number BIGINT,
  description TEXT
);

-- 9. Update media
CREATE TABLE update_media (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  update_id BIGINT REFERENCES work_updates(id),
  media_type TEXT,
  r2_key TEXT,
  mime_type TEXT,
  file_size BIGINT,
  sort_order BIGINT
);

-- 10. Work comments
CREATE TABLE work_comments (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  work_id BIGINT REFERENCES works(id),
  user_id UUID REFERENCES users(id),
  content TEXT,
  updated_at TIMESTAMP WITH TIME ZONE
);

-- 11. Work likes (see header note: DEFAULT gen_random_uuid() dropped from user_id)
CREATE TABLE work_likes (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  work_id BIGINT REFERENCES works(id),
  user_id UUID REFERENCES users(id),
  UNIQUE (work_id, user_id)
);

-- 12. Showcase items
CREATE TABLE showcase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  event_id BIGINT REFERENCES event(id),
  work_id BIGINT REFERENCES works(id)
);

-- 13. Social links
CREATE TABLE social_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  platform VARCHAR NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, platform)
);

-- 14. Verification requests
CREATE TABLE verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  status verification_status NOT NULL DEFAULT 'pending',
  id_document_key TEXT NOT NULL,
  notes TEXT,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 15. Followings (see header note: DEFAULT gen_random_uuid() dropped from
-- both user_id and followed_id; followed_id points at profiles.user_id,
-- not users.id directly - that's what the live FK constraint says)
CREATE TABLE followings (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  user_id UUID REFERENCES users(id),
  followed_id UUID NOT NULL REFERENCES profiles(user_id)
);

-- 16-18. Conversations / participants / messages - not live in Supabase
-- yet (conversations REST is still a 501 stub), but the socket gateway
-- (src/index.ts) and sockets.conversation-auth.test.ts both depend on
-- this exact shape already, reused from schema.sql with one fix:
-- schema.sql's `conversations.event_id` was typed UUID against a
-- `events(id)` that doesn't exist live - the real `event.id` is BIGINT,
-- so this points at `event(id)` as BIGINT instead.
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id BIGINT REFERENCES event(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE conversation_participants (
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
