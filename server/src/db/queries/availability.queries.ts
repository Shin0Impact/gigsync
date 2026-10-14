import { pool } from '../../config/db';

// Card #26 - artist availability calendar (see
// server/migrations/2026-10-13_artist_availability.sql for the table).
// A date with no row just means "not marked available" - there's no
// separate "unavailable" row to toggle off, so adding is an upsert and
// removing is a plain delete.

interface DbAvailabilityRow {
  available_date: string;
}

// TO_CHAR rather than selecting the DATE column directly - node-postgres
// hands back a DATE column as a JS Date at UTC midnight, and converting
// that back to a 'YYYY-MM-DD' string client-side re-introduces exactly
// the timezone-shift bug this is trying to avoid. Doing the formatting
// in SQL sidesteps the whole problem.
export async function list_availability_for_user(user_id: string): Promise<string[]> {
  const result = await pool.query<DbAvailabilityRow>(
    `
      SELECT TO_CHAR(available_date, 'YYYY-MM-DD') AS available_date
      FROM artist_availability
      WHERE user_id = $1
      ORDER BY available_date ASC
    `,
    [user_id],
  );

  return result.rows.map((row) => row.available_date);
}

export async function add_availability_date(user_id: string, date: string): Promise<string> {
  const result = await pool.query<DbAvailabilityRow>(
    `
      INSERT INTO artist_availability (user_id, available_date)
      VALUES ($1, $2::date)
      ON CONFLICT (user_id, available_date) DO NOTHING
      RETURNING TO_CHAR(available_date, 'YYYY-MM-DD') AS available_date
    `,
    [user_id, date],
  );

  // ON CONFLICT DO NOTHING returns no row when the date was already
  // marked available - that's not a failure, the day ends up available
  // either way, so fall back to echoing the input date back instead of
  // treating an empty result as an error.
  return result.rows[0]?.available_date ?? date;
}

export async function remove_availability_date(user_id: string, date: string): Promise<void> {
  await pool.query(
    `
      DELETE FROM artist_availability
      WHERE user_id = $1
        AND available_date = $2::date
    `,
    [user_id, date],
  );
}
