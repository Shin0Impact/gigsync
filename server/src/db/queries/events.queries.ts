import { PoolClient } from "pg";
import { pool } from "../../config/db";
import { ApplicationStatus, ArtistCategory, DbEventApplicationWithEvent, EventStatus } from "../../types";

// Card #23 - Event CRUD + application endpoints.
//
// IMPORTANT: this queries the live `event` table (singular), not the
// `events` (plural) table described in server/src/db/schema.sql. Kareem's
// `event` table already existed for a different feature (see
// docs/DESIGN_DOC.md section 5a) and was extended in place with the columns
// the marketplace event/application flow needs, rather than creating a
// second competing "event" table.
//
// Column names below match what's actually live - notably `descriptions`
// (not `description` - a pre-existing typo on the live table, left as-is
// rather than renamed so nothing else that reads it breaks), and `id` is a
// bigint/number, not a UUID string.
//
// `location` is a PostGIS GEOGRAPHY(POINT) column - stored as
// ST_MakePoint(lng, lat), read back via ST_X/ST_Y (note the x/y ↔ lng/lat
// order). It's nullable on the live table, so all the SELECTs below use
// LEFT JOIN-safe ST_X/ST_Y calls that just come back null when location is
// null - no separate branching needed.

export interface DbEvent {
	id: number;
	parent_event_id: number | null;
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
	is_urgent: boolean;
	created_at: Date;
	updated_at: Date | null;
	distance_km?: number | null;
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
  parent_event_id,
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
  is_urgent,
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
	isUrgent: boolean;
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
        status,
        categories_needed,
        is_urgent
      )
      VALUES (
        $1, $2, $3, $4, $5,
        $6, ST_SetSRID(ST_MakePoint($7, $8), 4326)::geography,
        $9, $10, 'open', $11::"ArtistCategory"[], $12
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
			params.isUrgent,
		],
	);

	return result.rows[0];
}

/**
 * Creates the next occurrence from an existing recurring event.
 *
 * The new event copies all event data from the source occurrence,
 * while replacing only the occurrence-specific start/end timestamps.
 *
 * Each occurrence points to the occurrence that generated it through
 * parent_event_id:
 *
 *   Event #1 -> parent_event_id = NULL
 *   Event #2 -> parent_event_id = #1
 *   Event #3 -> parent_event_id = #2
 *   Event #4 -> parent_event_id = #3
 *
 * This means every occurrence is self-contained and can generate its
 * own next occurrence without needing the original event to exist.
 */
export async function create_next_recurring_event(
	event: DbEvent,
	startAt: Date,
	endAt: Date,
): Promise<DbEvent> {
	const result = await pool.query<DbEvent>(
		`
      INSERT INTO event (
        parent_event_id,
        organizer_id,
        title,
        descriptions,
        start_at,
        end_at,
        venue_name,
        location,
        is_recurring,
        recurring_rule,
        status,
        categories_needed
      )
      SELECT
        id,
        organizer_id,
        title,
        descriptions,
        $2,
        $3,
        venue_name,
        location,
        is_recurring,
        recurring_rule,
        'open',
        categories_needed
      FROM event
      WHERE id = $1
        AND is_recurring = true
      RETURNING ${EVENT_COLUMNS}
    `,
		[event.id, startAt, endAt],
	);

	if (result.rows.length === 0) {
		throw new Error("Event is no longer recurring");
	}

	return result.rows[0];
}

export async function find_event_by_id(id: number): Promise<DbEvent | null> {
	const result = await pool.query<DbEvent>(
		`SELECT ${EVENT_COLUMNS} FROM event WHERE id = $1 LIMIT 1`,
		[id],
	);

	return result.rows[0] ?? null;
}

/**
 * Finds recurring event occurrences that are ready to generate
 * their next occurrence.
 *
 * An event is ready when:
 *
 *   - it is recurring
 *   - its start time has arrived
 *   - it has not been cancelled or completed
 *   - it does not already have a child occurrence
 *
 * The last condition is important because the scheduler may run
 * repeatedly. Once an event has generated its child, it must not
 * generate another copy of the same occurrence.
 *
 * Example:
 *
 *   #100 -> #101
 *
 * Once #101 exists, #100 is no longer returned by this query.
 *
 * Later, when #101 starts:
 *
 *   #101 -> #102
 *
 * #101 becomes eligible because it has no child yet.
 */
export async function find_recurring_events_ready_to_generate(): Promise<DbEvent[]> {
	const result = await pool.query<DbEvent>(
		`
      SELECT ${EVENT_COLUMNS}
      FROM event e
      WHERE e.is_recurring = true
        AND e.start_at <= NOW()
        AND e.status NOT IN ('cancelled', 'completed')
        AND NOT EXISTS (
          SELECT 1
          FROM event child
          WHERE child.parent_event_id = e.id
        )
      ORDER BY e.start_at ASC
    `,
	);

	return result.rows;
}

export type EventSort = "date" | "newest" | "title" | "distance";

export interface ListEventsFilters {
	status?: EventStatus;
	organizerId?: string;
	category?: ArtistCategory;
	// Free-text search across title, venue name and description.
	q?: string;
	urgentOnly?: boolean;
	sort?: EventSort;
	// Optional "near me" centre. Required for sort=distance and radiusKm.
	lat?: number;
	lng?: number;
	radiusKm?: number;
}

// Escape LIKE wildcards so a user typing "50%" or "_" searches literally.
function escape_like(value: string): string {
	return value.replace(/[\\%_]/g, (ch) => `\\${ch}`);
}

export async function list_events(filters: ListEventsFilters): Promise<DbEvent[]> {
	const hasCentre = filters.lat !== undefined && filters.lng !== undefined;
	const pattern = filters.q ? `%${escape_like(filters.q)}%` : null;

	// Distance is only meaningful when the caller supplied a centre point;
	// events without a stored location get NULL and sort last.
	// Always references $5/$6 (Postgres can't infer unreferenced params).
	const distanceExpr = `CASE WHEN $5::float8 IS NULL OR $6::float8 IS NULL THEN NULL::float8
      ELSE ST_Distance(location::geography, ST_SetSRID(ST_MakePoint($6::float8, $5::float8), 4326)::geography) / 1000 END`;

	const orderBy =
		filters.sort === "newest"
			? "created_at DESC"
			: filters.sort === "title"
				? "LOWER(title) ASC, start_at ASC"
				: filters.sort === "distance" && hasCentre
					? "distance_km ASC NULLS LAST, start_at ASC"
					: "start_at ASC";

	const result = await pool.query<DbEvent>(
		`
      SELECT * FROM (
        SELECT ${EVENT_COLUMNS}, ${distanceExpr} AS distance_km
        FROM event
        WHERE ($1::event_status IS NULL OR status = $1)
          AND ($2::uuid IS NULL OR organizer_id = $2)
          AND ($3::"ArtistCategory" IS NULL OR $3::"ArtistCategory" = ANY(categories_needed))
          AND ($4::text IS NULL OR title ILIKE $4 OR venue_name ILIKE $4 OR descriptions ILIKE $4)
          AND (NOT $8::boolean OR is_urgent)
      ) matched
      WHERE ($7::float8 IS NULL OR distance_km <= $7)
      ORDER BY ${orderBy}
    `,
		[
			filters.status ?? null,
			filters.organizerId ?? null,
			filters.category ?? null,
			pattern,
			hasCentre ? filters.lat : null,
			hasCentre ? filters.lng : null,
			hasCentre ? (filters.radiusKm ?? null) : null,
			filters.urgentOnly ?? false,
		],
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
	isUrgent?: boolean;
}

export async function update_event(id: number, patch: UpdateEventParams): Promise<DbEvent | null> {
	const set_clauses: string[] = [];
	const values: unknown[] = [];
	let i = 1;

	function add(column: string, value: unknown) {
		set_clauses.push(`${column} = $${i}`);
		values.push(value);
		i += 1;
	}

	if (patch.title !== undefined) add("title", patch.title);

	if (patch.descriptions !== undefined) {
		add("descriptions", patch.descriptions);
	}

	if (patch.startAt !== undefined) {
		add("start_at", patch.startAt);
	}

	if (patch.endAt !== undefined) {
		add("end_at", patch.endAt);
	}

	if (patch.venueName !== undefined) {
		add("venue_name", patch.venueName);
	}

	if (patch.isRecurring !== undefined) {
		add("is_recurring", patch.isRecurring);
	}

	if (patch.isUrgent !== undefined) {
		add("is_urgent", patch.isUrgent);
	}

	if (patch.recurringRule !== undefined) {
		add("recurring_rule", patch.recurringRule);
	}

	if (patch.status !== undefined) {
		add("status", patch.status);
	}

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

	set_clauses.push("updated_at = NOW()");

	if (set_clauses.length === 1) {
		// Only updated_at would change - nothing was actually provided.
		return find_event_by_id(id);
	}

	values.push(id);

	const result = await pool.query<DbEvent>(
		`
      UPDATE event
      SET ${set_clauses.join(", ")}
      WHERE id = $${i}
      RETURNING ${EVENT_COLUMNS}
    `,
		values,
	);

	return result.rows[0] ?? null;
}

export async function delete_event(id: number): Promise<boolean> {
	const result = await pool.query("DELETE FROM event WHERE id = $1", [id]);

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

export async function find_application_by_id(id: string): Promise<DbEventApplication | null> {
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

export async function list_applications_for_event(eventId: number): Promise<DbEventApplication[]> {
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

// An artist's own application history across every event they've applied
// to - joined with the event so the artist-facing "my gigs" page can show
// title/date/status without a second round trip per row. Unlike
// list_applications_for_event (organizer-only, one event), this is
// artist-scoped and spans events - different access pattern, so it's a
// separate query rather than a filter bolted onto that one.

export async function list_applications_for_artist(
	artistId: string,
): Promise<DbEventApplicationWithEvent[]> {
	const result = await pool.query<DbEventApplicationWithEvent>(
		`
      SELECT
        ea.id, ea.event_id, ea.artist_id, ea.status, ea.cover_note,
        ea.applied_at, ea.updated_at,
        e.title AS event_title,
        e.start_at AS event_start_at,
        e.venue_name AS event_venue_name,
        e.status AS event_status
      FROM event_applications ea
      JOIN event e ON e.id = ea.event_id
      WHERE ea.artist_id = $1
      ORDER BY ea.applied_at DESC
    `,
		[artistId],
	);

	return result.rows;
}
