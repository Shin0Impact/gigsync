import { PoolClient } from 'pg';
import { pool } from '../../config/db';
import { ApplicationStatus, ArtistCategory, EventStatus } from '../../types';

// Card #23 - Event CRUD + application endpoints.
//
// IMPORTANT: this queries the live `event` table (singular), not the
// `events` (plural) table described in server/src/db/schema.sql. Kareem's
// `event` table already existed for a different feature (see
// docs/DESIGN_DOC.md section 5a) and was extended in place with the columns
// the marketplace event/application flow needs, rather than creating a
// second competing "event" table. Column names below match what's actually
// live - notably `descriptions` (not `description` - a pre-existing typo on
// the live table, left as-is rather than renamed so nothing else that reads
// it breaks), and `id` is a bigint/number, not a UUID string.
//
// `location` is a PostGIS GEOGRAPHY(POINT) column - stored as
// ST_MakePoint(lng, lat), read back via ST_X/ST_Y (note the x/y ↔ lng/lat
// order). It's nullable on the live table, so all the SELECTs below use
// LEFT JOIN-safe ST_X/ST_Y calls that just come back null when location is
// null - no separate branching needed.

export interface DbEvent {
  id: number;
  organizer_id: string;
  title: string;
  descriptions: string;
  start_at: Date;
  end_at: Date;
  venue_name: string | null;
  location_lat: number | null;
  location_lng: number | null;
  is_recurring: boolean;
  recurring_rule: string | null;
  status: EventStatus;
  categories_needed: ArtistCategory[] | null;
  created_at: Date;
  updated_at: Date | null;
}

export interface DbEventApplication {
  id: string;
  event_id: number;
  artist_id: string;
  status: ApplicationStatus;
  cover_note: string | null;
  applied_at: Date;
  updated_at: Date;
}

const EVENT_COLUMNS = `
  id,
  organizer_id,
  title,
  descriptions,
  start_at,
  end_at,
  venue_name,
  ST_Y(location::geometry) AS location_lat,
  ST_X(location::geometry) AS location_lng,
  is_recurring,
  recurring_rule,
  status,
  categories_needed::text[] AS categories_needed,
  created_at,
  updated_at
`;

export interface CreateEventParams {
  organizerId: string;
  title: string;
  descriptions: string;
  startAt: string;
  endAt: string;
  venueName: string;
  lat: number;
  lng: number;
  isRecurring: boolean;
  recurringRule: string | null;
  categoriesNeeded: ArtistCategory[] | null;
}

export async function create_event(
  client: PoolClient,
  params: CreateEventParams,
): Promise<DbEvent> {
  const result = await client.query<DbEvent>(
    `
      INSERT INTO event (
        organizer_id,
        title,
        descriptions,
        start_at,
        end_at,
        venue_name,
        location,
        is_recurring,
        recurring_rule,
        categories_needed
      )
      VALUES (
        $1, $2, $3, $4, $5,
        $6, ST_SetSRID(ST_MakePoint($7, $8), 4326)::geography,
        $9, $10, 'open', $11::"ArtistCategory"[]
      )
      RETURNING ${EVENT_COLUMNS}
    `,
    [
      params.organizerId,
      params.title,
      params.descriptions,
      params.startAt,
      params.endAt,
      params.venueName,
      params.lng,
      params.lat,
      params.isRecurring,
      params.recurringRule,
      params.categoriesNeeded,
    ],
  );

  return result.rows[0];
}

export async function find_event_by_id(id: number): Promise<DbEvent | null> {
  const result = await pool.query<DbEvent>(
    `SELECT ${EVENT_COLUMNS} FROM event WHERE id = $1 LIMIT 1`,
    [id],
  );

  return result.rows[0] ?? null;
}

export interface ListEventsFilters {
  status?: EventStatus;
  organizerId?: string;
  category?: ArtistCategory;
}

export async function list_events(filters: ListEventsFilters): Promise<DbEvent[]> {
  const result = await pool.query<DbEvent>(
    `
      SELECT ${EVENT_COLUMNS}
      FROM event
      WHERE ($1::event_status IS NULL OR status = $1)
        AND ($2::uuid IS NULL OR organizer_id = $2)
        AND ($3::"ArtistCategory" IS NULL OR $3::"ArtistCategory" = ANY(categories_needed))
      ORDER BY start_at ASC
    `,
    [filters.status ?? null, filters.organizerId ?? null, filters.category ?? null],
  );

  return result.rows;
}

export interface UpdateEventParams {
  title?: string;
  descriptions?: string;
  startAt?: string;
  endAt?: string;
  venueName?: string;
  lat?: number;
  lng?: number;
  isRecurring?: boolean;
  recurringRule?: string | null;
  status?: EventStatus;
  categoriesNeeded?: ArtistCategory[] | null;
}

export async function update_event(
  id: number,
  patch: UpdateEventParams,
): Promise<DbEvent | null> {
  const set_clauses: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  function add(column: string, value: unknown) {
    set_clauses.push(`${column} = $${i}`);
    values.push(value);
    i += 1;
  }

  if (patch.title !== undefined) add('title', patch.title);
  if (patch.descriptions !== undefined) add('descriptions', patch.descriptions);
  if (patch.startAt !== undefined) add('start_at', patch.startAt);
  if (patch.endAt !== undefined) add('end_at', patch.endAt);
  if (patch.venueName !== undefined) add('venue_name', patch.venueName);
  if (patch.isRecurring !== undefined) add('is_recurring', patch.isRecurring);
  if (patch.recurringRule !== undefined) add('recurring_rule', patch.recurringRule);
  if (patch.status !== undefined) add('status', patch.status);
  if (patch.categoriesNeeded !== undefined) {
    set_clauses.push(`categories_needed = $${i}::"ArtistCategory"[]`);
    values.push(patch.categoriesNeeded);
    i += 1;
  }

  // lat/lng only make sense together - both or neither.
  if (patch.lat !== undefined && patch.lng !== undefined) {
    set_clauses.push(`location = ST_SetSRID(ST_MakePoint($${i}, $${i + 1}), 4326)::geography`);
    values.push(patch.lng, patch.lat);
    i += 2;
  }

  set_clauses.push('updated_at = NOW()');

  if (set_clauses.length === 1) {
    // Only updated_at would change - nothing was actually provided.
    return find_event_by_id(id);
  }

  values.push(id);

  const result = await pool.query<DbEvent>(
    `
      UPDATE event
      SET ${set_clauses.join(', ')}
      WHERE id = $${i}
      RETURNING ${EVENT_COLUMNS}
    `,
    values,
  );

  return result.rows[0] ?? null;
}

export async function delete_event(id: number): Promise<boolean> {
  const result = await pool.query('DELETE FROM event WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}

// --- event_applications -------------------------------------------------

export async function create_application(
  eventId: number,
  artistId: string,
  coverNote: string | null,
): Promise<DbEventApplication> {
  const result = await pool.query<DbEventApplication>(
    `
      INSERT INTO event_applications (event_id, artist_id, cover_note)
      VALUES ($1, $2, $3)
      RETURNING id, event_id, artist_id, status, cover_note, applied_at, updated_at
    `,
    [eventId, artistId, coverNote],
  );

  return result.rows[0];
}

export async function find_application_by_id(
  id: string,
): Promise<DbEventApplication | null> {
  const result = await pool.query<DbEventApplication>(
    `
      SELECT id, event_id, artist_id, status, cover_note, applied_at, updated_at
      FROM event_applications
      WHERE id = $1
      LIMIT 1
    `,
    [id],
  );

  return result.rows[0] ?? null;
}

export async function list_applications_for_event(
  eventId: number,
): Promise<DbEventApplication[]> {
  const result = await pool.query<DbEventApplication>(
    `
      SELECT id, event_id, artist_id, status, cover_note, applied_at, updated_at
      FROM event_applications
      WHERE event_id = $1
      ORDER BY applied_at ASC
    `,
    [eventId],
  );

  return result.rows;
}

export async function update_application_status(
  id: string,
  status: ApplicationStatus,
): Promise<DbEventApplication | null> {
  const result = await pool.query<DbEventApplication>(
    `
      UPDATE event_applications
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, event_id, artist_id, status, cover_note, applied_at, updated_at
    `,
    [status, id],
  );

  return result.rows[0] ?? null;
}
