// Feed queries for the homepage Timeline / Discovery endpoints
// (GET /api/feed/timeline, GET /api/feed/discovery).
//
// One UNION ALL over work_updates + event keeps a single chronological
// ordering across both item types; the media for the page's updates is then
// fetched in one batch query instead of one per item. Column-to-camelCase
// mapping is hand-written per query, matching the rest of the codebase.
import { query } from '../../config/db';
import { FeedItem, IUpdateMedia } from '../../types/social';

interface FeedRow {
  item_type: string;
  item_id: number;
  item_created_at: string;
  work_id: number | null;
  work_title: string | null;
  work_description: string | null;
  update_version: number | null;
  update_description: string | null;
  event_title: string | null;
  event_description: string | null;
  event_venue: string | null;
  event_start: string | null;
  event_end: string | null;
  event_status: string | null;
  event_categories: string[] | null;
  author_id: string;
  author_name: string;
  author_avatar: string | null;
}

interface UpdateMediaRow {
  id: number;
  update_id: number;
  media_type: string;
  r2_key: string;
  mime_type: string;
  file_size: number;
  sort_order: number;
  created_at: string;
}

export interface ListFeedOptions {
  limit: number;
  offset: number;
  // undefined = everyone (discovery); an array = only these authors
  // (timeline). Callers short-circuit an empty array to no rows rather
  // than letting an unfiltered query run by accident.
  authorIds?: string[];
}

// Both SELECTs must emit the same column count/types in the same order.
// event.start_at/end_at are `timestamp` (no tz) in the live schema, hence
// the null::timestamp casts on the work-update side.
const FEED_UNION = `
  select
    'work_update'::text as item_type,
    wu.id as item_id,
    wu.created_at as item_created_at,
    w.id as work_id,
    w.title as work_title,
    w.description as work_description,
    wu.version_number as update_version,
    wu.description as update_description,
    null::text as event_title,
    null::text as event_description,
    null::text as event_venue,
    null::timestamp as event_start,
    null::timestamp as event_end,
    null::text as event_status,
    null::text[] as event_categories,
    w.user_id as author_id,
    p.user_name as author_name,
    p.avatar_url as author_avatar
  from work_updates wu
  join works w on w.id = wu.work_id
  join profiles p on p.user_id = w.user_id
  union all
  select
    'event'::text,
    e.id,
    e.created_at,
    null::bigint,
    null::text,
    null::text,
    null::bigint,
    null::text,
    e.title,
    e.descriptions,
    e.venue_name,
    e.start_at,
    e.end_at,
    e.status::text,
    e.categories_needed::text[],
    e.organizer_id,
    p.user_name,
    p.avatar_url
  from event e
  join profiles p on p.user_id = e.organizer_id
`;

export async function listFeed(options: ListFeedOptions): Promise<FeedItem[]> {
  const { limit, offset, authorIds } = options;

  const result = await query<FeedRow>(
    `select * from (${FEED_UNION}) feed
     where ($3::uuid[] is null or author_id = any($3::uuid[]))
     order by item_created_at desc, item_id desc
     limit $1 offset $2`,
    [limit, offset, authorIds ?? null]
  );

  // Batch-load media for every work_update on this page in one query.
  const updateIds = result.rows
    .filter((row) => row.item_type === 'work_update')
    .map((row) => row.item_id);
  const mediaByUpdateId = new Map<number, IUpdateMedia[]>();
  if (updateIds.length > 0) {
    const mediaResult = await query<UpdateMediaRow>(
      'select * from update_media where update_id = any($1::bigint[]) order by sort_order asc',
      [updateIds]
    );
    for (const row of mediaResult.rows) {
      const media: IUpdateMedia = {
        id: row.id,
        updateId: row.update_id,
        mediaType: row.media_type,
        r2Key: row.r2_key,
        mimeType: row.mime_type,
        fileSizeBytes: row.file_size,
        sortOrder: row.sort_order,
        createdAt: row.created_at,
      };
      const list = mediaByUpdateId.get(row.update_id) ?? [];
      list.push(media);
      mediaByUpdateId.set(row.update_id, list);
    }
  }

  return result.rows.map((row) => {
    if (row.item_type === 'work_update') {
      return {
        type: 'work_update',
        id: row.item_id,
        createdAt: row.item_created_at,
        author: {
          userId: row.author_id,
          userName: row.author_name,
          avatarUrl: row.author_avatar,
        },
        work: {
          id: row.work_id as number,
          title: row.work_title,
          description: row.work_description,
        },
        update: {
          id: row.item_id,
          versionNumber: row.update_version,
          description: row.update_description,
        },
        media: mediaByUpdateId.get(row.item_id) ?? [],
      };
    }
    return {
      type: 'event',
      id: row.item_id,
      createdAt: row.item_created_at,
      author: {
        userId: row.author_id,
        userName: row.author_name,
        avatarUrl: row.author_avatar,
      },
      event: {
        id: row.item_id,
        title: row.event_title,
        description: row.event_description,
        venueName: row.event_venue,
        startAt: row.event_start,
        endAt: row.event_end,
        status: row.event_status,
        categoriesNeeded: row.event_categories,
      },
    };
  });
}
