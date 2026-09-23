import {
  DbEmergencyAvailableArtist,
  DbEmergencyStatus,
  find_emergency_available_near,
  find_emergency_status_for_user,
  update_emergency_status,
} from '../db/queries/profiles.queries';
import { getIO, broadcastEmergencyStatusChange } from '../sockets';

// Card #25 - emergency availability toggle + search.
//
// Migration needed on the live `profiles` table (not run yet):
//
//   ALTER TABLE profiles
//     ADD COLUMN location geography(Point, 4326),
//     ADD COLUMN is_emergency_available boolean NOT NULL DEFAULT false,
//     ADD COLUMN emergency_until timestamptz;
//
//   CREATE INDEX idx_profiles_location ON profiles USING GIST (location);
//   CREATE INDEX idx_profiles_emergency_available
//     ON profiles (is_emergency_available)
//     WHERE is_emergency_available = true;
//
// See docs/DESIGN_DOC.md section 5a - artist-level location for #24/#25
// wasn't addressed yet as of the last schema-drift update, this is that.

const MAX_RADIUS_KM = 200;

export interface UpdateEmergencyStatusInput {
  isEmergencyAvailable: boolean;
  emergencyUntil?: string | null;
  lat?: number;
  lng?: number;
}

// is_emergency_available never gets flipped back to false by a background
// job once emergency_until passes (see the query-layer comment) - so the
// raw column alone is stale, not the truth. This is what "actually
// available right now" means, and it's what both the public status read
// and the PATCH response should report - not the raw column.
function is_currently_available(row: Pick<DbEmergencyStatus, 'is_emergency_available' | 'emergency_until'>): boolean {
  if (!row.is_emergency_available) {
    return false;
  }
  return row.emergency_until === null || row.emergency_until.getTime() > Date.now();
}

function to_response(row: DbEmergencyStatus) {
  const available = is_currently_available(row);
  return {
    userId: row.user_id,
    isEmergencyAvailable: available,
    emergencyUntil: row.emergency_until,
    // Only expose coordinates while actually available. Turning
    // availability off deliberately leaves the `location` column alone
    // (see update_emergency_status), so without this check a public,
    // unauthenticated GET could be used to look up any artist's
    // last-known location forever, long after they turned availability
    // off - a real privacy leak, not just stale data.
    location:
      available && row.location_lat !== null && row.location_lng !== null
        ? { lat: row.location_lat, lng: row.location_lng }
        : null,
  };
}

export async function set_emergency_status(userId: string, input: UpdateEmergencyStatusInput) {
  const { isEmergencyAvailable, emergencyUntil = null, lat, lng } = input;

  if (typeof isEmergencyAvailable !== 'boolean') {
    throw new Error('isEmergencyAvailable is required and must be a boolean');
  }

  if (isEmergencyAvailable) {
    // Turning it on needs a location to search against - turning it off
    // doesn't (the existing location, if any, is left alone).
    // Number.isFinite (not typeof) so NaN/Infinity - which can slip
    // through as valid `number`-typed values - are rejected too.
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      throw new Error('lat and lng are required when isEmergencyAvailable is true');
    }
    if ((lat as number) < -90 || (lat as number) > 90 || (lng as number) < -180 || (lng as number) > 180) {
      throw new Error('lat/lng out of range');
    }
  }

  if (emergencyUntil !== null) {
    const until = new Date(emergencyUntil);
    if (Number.isNaN(until.getTime())) {
      throw new Error('emergencyUntil must be a valid ISO timestamp');
    }
    if (until.getTime() <= Date.now()) {
      throw new Error('emergencyUntil must be in the future');
    }
  }

  const row = await update_emergency_status(userId, {
    isEmergencyAvailable,
    emergencyUntil,
    lat: lat ?? null,
    lng: lng ?? null,
  });

  if (!row) {
    throw new Error('Profile not found');
  }

  // Best-effort: a socket broadcast failure shouldn't fail the request that
  // already succeeded in the DB. Mirrors the delete_object try/catch
  // pattern used elsewhere for non-critical side effects.
  try {
    broadcastEmergencyStatusChange(getIO(), {
      artistId: row.user_id,
      isEmergencyAvailable: row.is_emergency_available,
      emergencyUntil: row.emergency_until ? row.emergency_until.toISOString() : null,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[artists] failed to broadcast emergency status change:', (err as Error).message);
  }

  return to_response(row);
}

export async function get_emergency_status(userId: string) {
  const row = await find_emergency_status_for_user(userId);
  if (!row) {
    throw new Error('Profile not found');
  }
  return to_response(row);
}

export interface SearchEmergencyAvailableInput {
  lat: number;
  lng: number;
  radiusKm: number;
}

function to_search_result(row: DbEmergencyAvailableArtist) {
  return {
    userId: row.user_id,
    userName: row.user_name,
    avatarUrl: row.avatar_url,
    artistsType: row.artists_type,
    emergencyUntil: row.emergency_until,
    location: row.location_lat !== null && row.location_lng !== null
      ? { lat: row.location_lat, lng: row.location_lng }
      : null,
    distanceKm: Math.round(row.distance_km * 10) / 10,
  };
}

export async function search_emergency_available(input: SearchEmergencyAvailableInput) {
  const { lat, lng, radiusKm } = input;

  // Number.isFinite, not typeof: the controller does Number(req.query.x) on
  // a plain HTTP query string, so a missing or malformed param becomes NaN
  // - which is still `typeof 'number'`, so a typeof-only check here would
  // silently let NaN/Infinity through and hit the database with them.
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(radiusKm)) {
    throw new Error('lat, lng, and radius_km are required and must be numbers');
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    throw new Error('lat/lng out of range');
  }
  if (radiusKm <= 0 || radiusKm > MAX_RADIUS_KM) {
    throw new Error(`radius_km must be between 0 and ${MAX_RADIUS_KM}`);
  }

  const rows = await find_emergency_available_near(lat, lng, radiusKm);
  return rows.map(to_search_result);
}
