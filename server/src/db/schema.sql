-- GigSync database schema
-- Run with: psql "$DATABASE_URL" -f server/src/db/schema.sql

-- Enable PostGIS extension for geospatial radius queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- Enum Types
CREATE TYPE user_role AS ENUM ('artist', 'organizer', 'fan', 'admin', 'moderator');
CREATE TYPE media_type AS ENUM ('image', 'video', 'audio');
CREATE TYPE event_status AS ENUM ('open', 'filled', 'completed', 'cancelled');
CREATE TYPE application_status AS ENUM ('pending', 'accepted', 'rejected');
CREATE TYPE report_status AS ENUM ('pending', 'investigating', 'resolved', 'dismissed');

-- 1. Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'fan',
  avatar_url TEXT,
  avatar_r2_key TEXT,
  location GEOGRAPHY(POINT, 4326),
  address_name TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Art Categories Table
CREATE TABLE art_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL
);

-- 3. Artist Profiles Table
CREATE TABLE artist_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  hourly_rate NUMERIC(10, 2) CHECK (hourly_rate >= 0),
  is_emergency_available BOOLEAN DEFAULT FALSE,
  emergency_until TIMESTAMP WITH TIME ZONE,
  rating_avg NUMERIC(3, 2) DEFAULT 0.0 CHECK (rating_avg >= 0.0 AND rating_avg <= 5.0),
  review_count INT DEFAULT 0 CHECK (review_count >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Artist Categories Junction Table
CREATE TABLE artist_categories (
  artist_profile_id UUID REFERENCES artist_profiles(id) ON DELETE CASCADE,
  category_id INT REFERENCES art_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (artist_profile_id, category_id)
);

-- 5. Portfolio / Showcase Items Table (Cloudflare R2 Integration)
CREATE TABLE showcase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_profile_id UUID NOT NULL REFERENCES artist_profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  media_url TEXT NOT NULL,
  r2_key VARCHAR(512) NOT NULL,
  type media_type NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Events Table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  venue_name VARCHAR(255) NOT NULL,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status event_status DEFAULT 'open',
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_rule VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Event Category Requirements Table
CREATE TABLE event_categories_needed (
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  category_id INT REFERENCES art_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, category_id)
);

-- 8. Event Applications Table
CREATE TABLE event_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  artist_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status application_status DEFAULT 'pending',
  cover_note TEXT,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (event_id, artist_id)
);

-- 9. Conversations Table (Socket.IO Messaging Foundation)
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Conversation Participants Table
CREATE TABLE conversation_participants (
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (conversation_id, user_id)
);

-- 11. Chat Messages Table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. Reviews & Ratings Table
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (event_id, reviewer_id, reviewee_id)
);

-- 13. Reports & Moderation Table
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reported_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reported_showcase_id UUID REFERENCES showcase_items(id) ON DELETE CASCADE,
  reported_event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status report_status DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SPATIAL & PERFORMANCE INDEXES
CREATE INDEX idx_users_location ON users USING GIST (location);
CREATE INDEX idx_events_location ON events USING GIST (location);
CREATE INDEX idx_artist_profiles_emergency ON artist_profiles (is_emergency_available) WHERE is_emergency_available = TRUE;
CREATE INDEX idx_messages_conversation ON messages (conversation_id, created_at DESC);
CREATE INDEX idx_applications_event ON event_applications (event_id);
CREATE INDEX idx_applications_artist ON event_applications (artist_id);
