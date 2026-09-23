import { PoolClient } from 'pg';
import { pool } from '../../config/db';

export interface DbProfile {
  id: number;
  created_at: Date;
  user_name: string;
  user_id: string;
  avatar_url: string | null;
  followers_number: number;
  artists_type: string | null;
}

export async function find_profile_by_user_name(
  user_name: string,
): Promise<DbProfile | null> {
  const result = await pool.query<DbProfile>(
    `
      SELECT
        id,
        created_at,
        user_name,
        user_id,
        avatar_url,
        followers_number,
        artists_type
      FROM profiles
      WHERE user_name = $1
      LIMIT 1
    `,
    [user_name],
  );

  return result.rows[0] ?? null;
}

export async function create_profile(
  client: PoolClient,
  user_id: string,
  user_name: string,
  artists_type: string | null,
): Promise<DbProfile> {
  const result = await client.query<DbProfile>(
    `
      INSERT INTO profiles (
        user_id,
        user_name,
        artists_type
      )
      VALUES ($1, $2, $3)
      RETURNING
        id,
        created_at,
        user_name,
        user_id,
        avatar_url,
        followers_number,
        artists_type
    `,
    [user_id, user_name, artists_type],
  );

  return result.rows[0];
}

// --- Emergency availability (card #25) --------------------------------
//
// Lives on `profiles`, not a separate `artist_profiles` table - the live
// schema only has `profiles` (see docs/DESIGN_DOC.md section 5a), so this
// reuses it rather than introducing a second per-artist table. Needs three
// new columns added via migration (see top-of-file-style comment in
// artists.service.ts for the exact SQL): `location geography(Point,4326)`,
// `is_emergency_available boolean`, `emergency_until timestamptz`.
//
// "Available" for search purposes is is_emergency_available = true AND
// (emergency_until IS NULL OR emergency_until is still in the future) -
// there's no background job flipping the boolean back off when it expires,
// the search query just filters expired rows out live. An artist can still
// explicitly turn it off early via the same PATCH.

export interface DbEmergencyStatus {
  user_id: string;
  is_emergency_available: boolean;
  emergency_until: Date | null;
  location_lat: number | null;
  location_lng: number | null;
}

export interface UpdateEmergencyStatusParams {
  isEmergencyAvailable: boolean;
  emergencyUntil: string | null;
  lat: number | null;
  lng: number | null;
}

export async function update_emergency_status(
  user_id: string,
  params: UpdateEmergencyStatusParams,
): Promise<DbEmergencyStatus | null> {
  const result = await pool.query<DbEmergencyStatus>(
    `
      UPDATE profiles
      SET
        is_emergency_available = $1,
        emergency_until = $2,
        location = CASE
          WHEN $3::double precision IS NULL OR $4::double precision IS NULL THEN location
          ELSE ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography
        END
      WHERE user_id = $5
      RETURNING
        user_id,
        is_emergency_available,
        emergency_until,
        ST_Y(location::geometry) AS location_lat,
        ST_X(location::geometry) AS location_lng
    `,
    [params.isEmergencyAvailable, params.emergencyUntil, params.lng, params.lat, user_id],
  );

  return result.rows[0] ?? null;
}

export async function find_emergency_status_for_user(
  user_id: string,
): Promise<DbEmergencyStatus | null> {
  const result = await pool.query<DbEmergencyStatus>(
    `
      SELECT
        user_id,
        is_emergency_available,
        emergency_until,
        ST_Y(location::geometry) AS location_lat,
        ST_X(location::geometry) AS location_lng
      FROM profiles
      WHERE user_id = $1
      LIMIT 1
    `,
    [user_id],
  );

  return result.rows[0] ?? null;
}

export interface DbEmergencyAvailableArtist {
  user_id: string;
  user_name: string;
  avatar_url: string | null;
  artists_type: string | null;
  emergency_until: Date | null;
  location_lat: number | null;
  location_lng: number | null;
  distance_km: number;
}

// ST_DWithin/ST_Distance both work in meters on a `geography` column - the
// $3 radius param here is converted from km to meters ($3 * 1000) rather
// than asking callers to pass meters, to match the km-facing query param
// (`radius_km`) the route accepts.
export async function find_emergency_available_near(
  lat: number,
  lng: number,
  radius_km: number,
): Promise<DbEmergencyAvailableArtist[]> {
  const result = await pool.query<DbEmergencyAvailableArtist>(
    `
      SELECT
        p.user_id,
        p.user_name,
        p.avatar_url,
        p.artists_type,
        p.emergency_until,
        ST_Y(p.location::geometry) AS location_lat,
        ST_X(p.location::geometry) AS location_lng,
        ST_Distance(p.location, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography) / 1000 AS distance_km
      FROM profiles p
      WHERE p.is_emergency_available = true
        AND (p.emergency_until IS NULL OR p.emergency_until > now())
        AND p.location IS NOT NULL
        AND ST_DWithin(
          p.location,
          ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography,
          $3 * 1000
        )
      ORDER BY distance_km ASC
    `,
    [lat, lng, radius_km],
  );

  return result.rows;
}
