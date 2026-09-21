import { pool } from '../../config/db';

export interface DbEventMedia {
  id: string;
  event_id: number;
  media_type: string;
  object_key: string;
  alt_text: string | null;
  sort_order: number;
  created_at: Date;
}

export interface CreateEventMediaParams {
  eventId: number;
  mediaType: string;
  objectKey: string;
  altText: string | null;
  sortOrder: number;
}

export async function create_event_media(
  params: CreateEventMediaParams,
): Promise<DbEventMedia> {
  const result = await pool.query<DbEventMedia>(
    `
      INSERT INTO event_media (event_id, media_type, object_key, alt_text, sort_order)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, event_id, media_type, object_key, alt_text, sort_order, created_at
    `,
    [params.eventId, params.mediaType, params.objectKey, params.altText, params.sortOrder],
  );

  return result.rows[0];
}

export async function list_event_media(eventId: number): Promise<DbEventMedia[]> {
  const result = await pool.query<DbEventMedia>(
    `
      SELECT id, event_id, media_type, object_key, alt_text, sort_order, created_at
      FROM event_media
      WHERE event_id = $1
      ORDER BY sort_order ASC, created_at ASC
    `,
    [eventId],
  );

  return result.rows;
}

export async function find_event_media_by_id(id: string): Promise<DbEventMedia | null> {
  const result = await pool.query<DbEventMedia>(
    `
      SELECT id, event_id, media_type, object_key, alt_text, sort_order, created_at
      FROM event_media
      WHERE id = $1
      LIMIT 1
    `,
    [id],
  );

  return result.rows[0] ?? null;
}

export async function delete_event_media(id: string): Promise<boolean> {
  const result = await pool.query('DELETE FROM event_media WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}
