import { pool } from '../../config/db';

// Showcase items are a PIN, not an upload: a user stars an existing piece
// of media they already own (an event_media row if they're an organizer,
// or an update_media row from their own work if they're an artist) onto
// their profile. There's no separate upload flow here - showcasing never
// creates a new R2 object, it just references one that already exists.
//
// Table shape (already redefined via the ALTER below, replacing the old
// upload-based columns):
//   id uuid pk, user_id uuid references users(id),
//   event_media_id uuid references event_media(id) on delete cascade,
//   update_media_id bigint references update_media(id) on delete cascade,
//   sort_order int, created_at
// - exactly one of event_media_id / update_media_id is set per row
//   (enforced by a CHECK constraint, not app code, so a bad row can't
//   land even if a future caller forgets to check).
//
// Run this against Supabase (SQL Editor) before this feature works:
//
//   ALTER TABLE showcase_items
//     DROP COLUMN media_type,
//     DROP COLUMN object_key,
//     DROP COLUMN alt_text,
//     ADD COLUMN event_media_id uuid REFERENCES event_media(id) ON DELETE CASCADE,
//     ADD COLUMN update_media_id bigint REFERENCES update_media(id) ON DELETE CASCADE,
//     ADD CONSTRAINT showcase_items_exactly_one_source CHECK (
//       (event_media_id IS NOT NULL AND update_media_id IS NULL) OR
//       (event_media_id IS NULL AND update_media_id IS NOT NULL)
//     );

export type ShowcaseSourceType = 'event_media' | 'update_media';

export interface DbShowcaseItem {
  id: string;
  user_id: string;
  event_media_id: string | null;
  update_media_id: number | null;
  sort_order: number;
  created_at: Date;
}

export interface CreateShowcaseItemParams {
  userId: string;
  sourceType: ShowcaseSourceType;
  sourceId: string | number;
  sortOrder: number;
}

export async function create_showcase_item(
  params: CreateShowcaseItemParams,
): Promise<DbShowcaseItem> {
  const eventMediaId = params.sourceType === 'event_media' ? params.sourceId : null;
  const updateMediaId = params.sourceType === 'update_media' ? params.sourceId : null;

  const result = await pool.query<DbShowcaseItem>(
    `
      INSERT INTO showcase_items (user_id, event_media_id, update_media_id, sort_order)
      VALUES ($1, $2, $3, $4)
      RETURNING id, user_id, event_media_id, update_media_id, sort_order, created_at
    `,
    [params.userId, eventMediaId, updateMediaId, params.sortOrder],
  );

  return result.rows[0];
}

export async function count_showcase_items_for_user(userId: string): Promise<number> {
  const result = await pool.query<{ count: string }>(
    'SELECT COUNT(*)::text AS count FROM showcase_items WHERE user_id = $1',
    [userId],
  );
  return Number(result.rows[0]?.count ?? 0);
}

export async function list_showcase_items_for_user(userId: string): Promise<DbShowcaseItem[]> {
  const result = await pool.query<DbShowcaseItem>(
    `
      SELECT id, user_id, event_media_id, update_media_id, sort_order, created_at
      FROM showcase_items
      WHERE user_id = $1
      ORDER BY sort_order ASC, created_at ASC
    `,
    [userId],
  );

  return result.rows;
}

export async function find_showcase_item_by_id(id: string): Promise<DbShowcaseItem | null> {
  const result = await pool.query<DbShowcaseItem>(
    `
      SELECT id, user_id, event_media_id, update_media_id, sort_order, created_at
      FROM showcase_items
      WHERE id = $1
      LIMIT 1
    `,
    [id],
  );

  return result.rows[0] ?? null;
}

// Prevents pinning the same underlying media twice (e.g. double-clicking
// "pin" shouldn't create two rows for the same event_media_id).
export async function find_showcase_item_by_source(
  userId: string,
  sourceType: ShowcaseSourceType,
  sourceId: string | number,
): Promise<DbShowcaseItem | null> {
  const column = sourceType === 'event_media' ? 'event_media_id' : 'update_media_id';
  const result = await pool.query<DbShowcaseItem>(
    `
      SELECT id, user_id, event_media_id, update_media_id, sort_order, created_at
      FROM showcase_items
      WHERE user_id = $1 AND ${column} = $2
      LIMIT 1
    `,
    [userId, sourceId],
  );

  return result.rows[0] ?? null;
}

export async function delete_showcase_item(id: string): Promise<boolean> {
  const result = await pool.query('DELETE FROM showcase_items WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}
