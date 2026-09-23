import { pool } from '../../config/db';

// Showcase items pin a whole entity, not a single media file or a single
// version: either an artist's `work` (a project, which renders with its
// full version history and all attached media across every work_update)
// or an organizer's `event` (with all its event_media). A work has many
// work_updates over time, so pinning a specific update would freeze the
// showcase on one version - pinning the work itself means it always
// reflects the project's current state.
//
// Table shape (already redefined via the ALTER below):
//   id uuid pk, user_id uuid references users(id),
//   event_id bigint references event(id) on delete cascade,
//   work_id bigint references works(id) on delete cascade,
//   sort_order int, created_at
// - exactly one of event_id / work_id is set per row.
//
// Run this against Supabase (SQL Editor) before this feature works. This
// supersedes the work_update_id version from the previous iteration -
// drop the old constraint by name before dropping the column it
// references, or Postgres will refuse the DROP COLUMN:
//
//   ALTER TABLE showcase_items
//     DROP CONSTRAINT showcase_items_exactly_one_source,
//     DROP COLUMN work_update_id,
//     ADD COLUMN work_id bigint REFERENCES works(id) ON DELETE CASCADE,
//     ADD CONSTRAINT showcase_items_exactly_one_source CHECK (
//       (event_id IS NOT NULL AND work_id IS NULL) OR
//       (event_id IS NULL AND work_id IS NOT NULL)
//     );

export type ShowcaseSourceType = 'event' | 'work';

export interface DbShowcaseItem {
  id: string;
  user_id: string;
  event_id: number | null;
  work_id: number | null;
  sort_order: number;
  created_at: Date;
}

export interface CreateShowcaseItemParams {
  userId: string;
  sourceType: ShowcaseSourceType;
  sourceId: number;
  sortOrder: number;
}

export async function create_showcase_item(
  params: CreateShowcaseItemParams,
): Promise<DbShowcaseItem> {
  const eventId = params.sourceType === 'event' ? params.sourceId : null;
  const workId = params.sourceType === 'work' ? params.sourceId : null;

  const result = await pool.query<DbShowcaseItem>(
    `
      INSERT INTO showcase_items (user_id, event_id, work_id, sort_order)
      VALUES ($1, $2, $3, $4)
      RETURNING id, user_id, event_id, work_id, sort_order, created_at
    `,
    [params.userId, eventId, workId, params.sortOrder],
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
      SELECT id, user_id, event_id, work_id, sort_order, created_at
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
      SELECT id, user_id, event_id, work_id, sort_order, created_at
      FROM showcase_items
      WHERE id = $1
      LIMIT 1
    `,
    [id],
  );

  return result.rows[0] ?? null;
}

// Prevents pinning the same work/event twice.
export async function find_showcase_item_by_source(
  userId: string,
  sourceType: ShowcaseSourceType,
  sourceId: number,
): Promise<DbShowcaseItem | null> {
  const column = sourceType === 'event' ? 'event_id' : 'work_id';
  const result = await pool.query<DbShowcaseItem>(
    `
      SELECT id, user_id, event_id, work_id, sort_order, created_at
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
