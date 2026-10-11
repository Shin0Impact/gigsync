// Query helpers for the live Supabase "social/feed" schema (see
// server/src/types/social.ts and docs/DESIGN_DOC.md section 5a). Mirrors
// the query<T>() pattern from server/src/config/db.ts.
//
// Scaffolding only as of 2026-09-19 - not called from any route yet.
// Column-to-camelCase mapping is hand-written per query rather than via a
// generic mapper, matching how the rest of the codebase does it (see
// artists.routes.ts / events.routes.ts once those are implemented).

import { query } from '../config/db';
import {
  ArtistType,
  Role,
  IProfile,
  IUserRole,
  IFollowing,
  IWork,
  IWorkUpdate,
  IUpdateMedia,
  IWorkLike,
  IWorkComment,
  IPostEvent,
  WorkFeedItem,
} from '../types/social';

interface ProfileRow {
  id: number;
  user_id: string;
  user_name: string;
  avatar_url: string | null;
  followers_number: number;
  artists_type: string;
  created_at: string;
}

function mapProfile(row: ProfileRow): IProfile {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    avatarUrl: row.avatar_url,
    followersNumber: row.followers_number,
    artistsType: row.artists_type as ArtistType,
    createdAt: row.created_at,
  };
}

export async function getProfileByUserId(userId: string): Promise<IProfile | null> {
  const result = await query<ProfileRow>(
    'select * from profiles where user_id = $1 limit 1',
    [userId]
  );
  return result.rows[0] ? mapProfile(result.rows[0]) : null;
}

export async function getRolesForUser(userId: string): Promise<IUserRole[]> {
  interface RoleRow {
    user_id: string;
    role: string;
    created_at: string;
  }
  const result = await query<RoleRow>('select * from roles where user_id = $1', [userId]);
  return result.rows.map((row) => ({
    userId: row.user_id,
    role: row.role as Role,
    createdAt: row.created_at,
  }));
}

export async function getFollowersOfUser(followedId: string): Promise<IFollowing[]> {
  interface FollowingRow {
    id: number;
    user_id: string;
    followed_id: string;
    created_at: string;
  }
  const result = await query<FollowingRow>(
    'select * from followings where followed_id = $1 order by created_at desc',
    [followedId]
  );
  return result.rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    followedId: row.followed_id,
    createdAt: row.created_at,
  }));
}

export async function getWorksByUser(userId: string): Promise<IWork[]> {
  interface WorkRow {
    id: number;
    user_id: string;
    description: string | null;
    created_at: string;
    updated_at: string;
  }
  const result = await query<WorkRow>(
    'select * from works where user_id = $1 order by created_at desc',
    [userId]
  );
  return result.rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function getWorkUpdates(workId: number): Promise<IWorkUpdate[]> {
  interface WorkUpdateRow {
    id: number;
    work_id: number;
    version_number: number;
    description: string | null;
    created_at: string;
    updated_at: string;
  }
  const result = await query<WorkUpdateRow>(
    'select * from work_updates where work_id = $1 order by version_number desc',
    [workId]
  );
  return result.rows.map((row) => ({
    id: row.id,
    workId: row.work_id,
    versionNumber: row.version_number,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function getMediaForUpdate(updateId: number): Promise<IUpdateMedia[]> {
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
  const result = await query<UpdateMediaRow>(
    'select * from update_media where update_id = $1 order by sort_order asc',
    [updateId]
  );
  return result.rows.map((row) => ({
    id: row.id,
    updateId: row.update_id,
    mediaType: row.media_type,
    r2Key: row.r2_key,
    mimeType: row.mime_type,
    fileSizeBytes: row.file_size,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  }));
}

export async function getLikeCountForWork(workId: number): Promise<number> {
  const result = await query<{ count: string }>(
    'select count(*)::text as count from work_likes where work_id = $1',
    [workId]
  );
  return Number(result.rows[0]?.count ?? 0);
}

export async function getWorkLikesByUser(workId: number, userId: string): Promise<IWorkLike | null> {
  interface WorkLikeRow {
    id: number;
    work_id: number;
    user_id: string;
    created_at: string;
  }
  const result = await query<WorkLikeRow>(
    'select * from work_likes where work_id = $1 and user_id = $2 limit 1',
    [workId, userId]
  );
  const row = result.rows[0];
  return row
    ? { id: row.id, workId: row.work_id, userId: row.user_id, createdAt: row.created_at }
    : null;
}

export async function getCommentsForWork(workId: number): Promise<IWorkComment[]> {
  interface WorkCommentRow {
    id: number;
    work_id: number;
    user_id: string;
    content: string;
    created_at: string;
    updated_at: string;
  }
  const result = await query<WorkCommentRow>(
    'select * from work_comments where work_id = $1 order by created_at asc',
    [workId]
  );
  return result.rows.map((row) => ({
    id: row.id,
    workId: row.work_id,
    userId: row.user_id,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function getPostEvent(postId: number): Promise<IPostEvent | null> {
  interface PostEventRow {
    id: number;
    post_id: number;
    start_at: string;
    end_at: string;
    created_at: string;
  }
  const result = await query<PostEventRow>(
    'select * from event where post_id = $1 limit 1',
    [postId]
  );
  const row = result.rows[0];
  return row
    ? { id: row.id, postId: row.post_id, startAt: row.start_at, endAt: row.end_at, createdAt: row.created_at }
    : null;
}

// --- Writes: the R2-backed "artist uploads" slice of works/work_updates/  --
// update_media (card #78 follow-up). Kareem's read helpers above cover the
// query side; these add create/find/delete so a minimal works API can
// actually be mounted. Likes/comments/follows are read-only scaffolding
// still - no write path for those yet, out of scope here.

export async function createWork(userId: string, description: string | null): Promise<IWork> {
  interface WorkRow {
    id: number;
    user_id: string;
    description: string | null;
    created_at: string;
    updated_at: string;
  }
  const result = await query<WorkRow>(
    'insert into works (user_id, description) values ($1, $2) returning *',
    [userId, description]
  );
  const row = result.rows[0];
  return {
    id: row.id,
    userId: row.user_id,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getWorkById(workId: number): Promise<IWork | null> {
  interface WorkRow {
    id: number;
    user_id: string;
    description: string | null;
    created_at: string;
    updated_at: string;
  }
  const result = await query<WorkRow>('select * from works where id = $1 limit 1', [workId]);
  const row = result.rows[0];
  return row
    ? { id: row.id, userId: row.user_id, description: row.description, createdAt: row.created_at, updatedAt: row.updated_at }
    : null;
}

export async function createWorkUpdate(workId: number, description: string | null): Promise<IWorkUpdate> {
  interface WorkUpdateRow {
    id: number;
    work_id: number;
    version_number: number;
    description: string | null;
    created_at: string;
    updated_at: string;
  }
  // version_number is just "how many updates this work already has, + 1" -
  // computed here rather than via a DB trigger since nothing else writes
  // to work_updates yet.
  const result = await query<WorkUpdateRow>(
    `insert into work_updates (work_id, version_number, description)
     values ($1, (select count(*) + 1 from work_updates where work_id = $1), $2)
     returning *`,
    [workId, description]
  );
  const row = result.rows[0];
  return {
    id: row.id,
    workId: row.work_id,
    versionNumber: row.version_number,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getWorkUpdateById(updateId: number): Promise<IWorkUpdate | null> {
  interface WorkUpdateRow {
    id: number;
    work_id: number;
    version_number: number;
    description: string | null;
    created_at: string;
    updated_at: string;
  }
  const result = await query<WorkUpdateRow>('select * from work_updates where id = $1 limit 1', [updateId]);
  const row = result.rows[0];
  return row
    ? { id: row.id, workId: row.work_id, versionNumber: row.version_number, description: row.description, createdAt: row.created_at, updatedAt: row.updated_at }
    : null;
}

export interface CreateUpdateMediaParams {
  updateId: number;
  mediaType: string;
  r2Key: string;
  mimeType: string;
  fileSizeBytes: number;
  sortOrder: number;
}

export async function createUpdateMedia(params: CreateUpdateMediaParams): Promise<IUpdateMedia> {
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
  const result = await query<UpdateMediaRow>(
    `insert into update_media (update_id, media_type, r2_key, mime_type, file_size, sort_order)
     values ($1, $2, $3, $4, $5, $6)
     returning *`,
    [params.updateId, params.mediaType, params.r2Key, params.mimeType, params.fileSizeBytes, params.sortOrder]
  );
  const row = result.rows[0];
  return {
    id: row.id,
    updateId: row.update_id,
    mediaType: row.media_type,
    r2Key: row.r2_key,
    mimeType: row.mime_type,
    fileSizeBytes: row.file_size,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

export async function getUpdateMediaById(mediaId: number): Promise<IUpdateMedia | null> {
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
  const result = await query<UpdateMediaRow>('select * from update_media where id = $1 limit 1', [mediaId]);
  const row = result.rows[0];
  return row
    ? { id: row.id, updateId: row.update_id, mediaType: row.media_type, r2Key: row.r2_key, mimeType: row.mime_type, fileSizeBytes: row.file_size, sortOrder: row.sort_order, createdAt: row.created_at }
    : null;
}

export async function deleteUpdateMedia(mediaId: number): Promise<boolean> {
  const result = await query('delete from update_media where id = $1', [mediaId]);
  return (result.rowCount ?? 0) > 0;
}

// --- Writes: follows, likes, comments (2026-10-11) ----------------------
// Previously read-only scaffolding only (see header comment at top of this
// file) - now wired to real routes (profiles.routes.ts / works.routes.ts)
// for the artist-facing pages. Column/table shapes are unchanged from the
// read helpers above, just adding insert/delete.

export async function getFollowedUserIds(followerId: string): Promise<string[]> {
  const result = await query<{ followed_id: string }>(
    'select followed_id from followings where user_id = $1',
    [followerId]
  );
  return result.rows.map((row) => row.followed_id);
}

export async function isFollowing(followerId: string, followedId: string): Promise<boolean> {
  const result = await query(
    'select 1 from followings where user_id = $1 and followed_id = $2 limit 1',
    [followerId, followedId]
  );
  return result.rows.length > 0;
}

export async function createFollow(followerId: string, followedId: string): Promise<void> {
  await query(
    'insert into followings (user_id, followed_id) values ($1, $2) on conflict do nothing',
    [followerId, followedId]
  );
}

export async function deleteFollow(followerId: string, followedId: string): Promise<void> {
  await query('delete from followings where user_id = $1 and followed_id = $2', [
    followerId,
    followedId,
  ]);
}

export async function getFollowerCount(followedId: string): Promise<number> {
  const result = await query<{ count: string }>(
    'select count(*)::text as count from followings where followed_id = $1',
    [followedId]
  );
  return Number(result.rows[0]?.count ?? 0);
}

export async function createWorkLike(workId: number, userId: string): Promise<void> {
  await query(
    'insert into work_likes (work_id, user_id) values ($1, $2) on conflict do nothing',
    [workId, userId]
  );
}

export async function deleteWorkLike(workId: number, userId: string): Promise<void> {
  await query('delete from work_likes where work_id = $1 and user_id = $2', [workId, userId]);
}

// Batch membership check for a feed page - one query instead of one per card.
export async function getLikedWorkIds(userId: string, workIds: number[]): Promise<number[]> {
  if (workIds.length === 0) return [];
  const result = await query<{ work_id: number }>(
    'select work_id from work_likes where user_id = $1 and work_id = any($2::bigint[])',
    [userId, workIds]
  );
  return result.rows.map((row) => Number(row.work_id));
}

export async function createWorkComment(
  workId: number,
  userId: string,
  content: string
): Promise<IWorkComment> {
  const result = await query<{
    id: number;
    work_id: number;
    user_id: string;
    content: string;
    created_at: string;
    updated_at: string;
  }>(
    'insert into work_comments (work_id, user_id, content) values ($1, $2, $3) returning *',
    [workId, userId, content]
  );
  const row = result.rows[0];
  return {
    id: row.id,
    workId: row.work_id,
    userId: row.user_id,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getWorkCommentById(commentId: number): Promise<IWorkComment | null> {
  const result = await query<{
    id: number;
    work_id: number;
    user_id: string;
    content: string;
    created_at: string;
    updated_at: string;
  }>('select * from work_comments where id = $1 limit 1', [commentId]);
  const row = result.rows[0];
  return row
    ? {
        id: row.id,
        workId: row.work_id,
        userId: row.user_id,
        content: row.content,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }
    : null;
}

export async function deleteWorkComment(commentId: number): Promise<boolean> {
  const result = await query('delete from work_comments where id = $1', [commentId]);
  return (result.rowCount ?? 0) > 0;
}

interface FeedRow {
  id: number;
  user_id: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  user_name: string;
  avatar_url: string | null;
  artists_type: string | null;
  like_count: number;
  comment_count: number;
  cover_media_id: number | null;
  cover_update_id: number | null;
  cover_media_type: string | null;
  cover_r2_key: string | null;
  cover_mime_type: string | null;
  cover_file_size: number | null;
  cover_sort_order: number | null;
  cover_created_at: string | null;
}

function mapFeedRow(row: FeedRow, likedWorkIds: Set<number>): WorkFeedItem {
  return {
    id: row.id,
    userId: row.user_id,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    author: {
      userId: row.user_id,
      userName: row.user_name,
      avatarUrl: row.avatar_url,
      artistsType: row.artists_type as ArtistType,
    },
    likeCount: Number(row.like_count ?? 0),
    commentCount: Number(row.comment_count ?? 0),
    likedByMe: likedWorkIds.has(row.id),
    coverMedia: row.cover_media_id
      ? {
          id: row.cover_media_id,
          updateId: row.cover_update_id as number,
          mediaType: row.cover_media_type as string,
          r2Key: row.cover_r2_key as string,
          mimeType: row.cover_mime_type as string,
          fileSizeBytes: row.cover_file_size as number,
          sortOrder: row.cover_sort_order as number,
          createdAt: row.cover_created_at as string,
        }
      : null,
  };
}

const FEED_SELECT = `
  select
    w.id, w.user_id, w.description, w.created_at, w.updated_at,
    p.user_name, p.avatar_url, p.artists_type,
    coalesce(lc.like_count, 0) as like_count,
    coalesce(cc.comment_count, 0) as comment_count,
    cm.id as cover_media_id,
    cm.update_id as cover_update_id,
    cm.media_type as cover_media_type,
    cm.r2_key as cover_r2_key,
    cm.mime_type as cover_mime_type,
    cm.file_size as cover_file_size,
    cm.sort_order as cover_sort_order,
    cm.created_at as cover_created_at
  from works w
  join profiles p on p.user_id = w.user_id
  left join (
    select work_id, count(*)::int as like_count from work_likes group by work_id
  ) lc on lc.work_id = w.id
  left join (
    select work_id, count(*)::int as comment_count from work_comments group by work_id
  ) cc on cc.work_id = w.id
  left join lateral (
    select wu.id as update_id
    from work_updates wu
    where wu.work_id = w.id
    order by wu.version_number desc
    limit 1
  ) latest_update on true
  left join lateral (
    select um.*
    from update_media um
    where um.update_id = latest_update.update_id
    order by um.sort_order asc
    limit 1
  ) cm on true
`;

export interface ListWorksFeedOptions {
  limit: number;
  offset: number;
  // undefined = everyone (explore/discover); an array = only these
  // authors (following feed). An empty array short-circuits to no rows -
  // the caller is responsible for that (e.g. someone who follows nobody
  // yet), rather than this running an unfiltered query by accident.
  authorIds?: string[];
  viewerId?: string | null;
}

export async function listWorksFeed(options: ListWorksFeedOptions): Promise<WorkFeedItem[]> {
  const { limit, offset, authorIds, viewerId } = options;

  if (authorIds && authorIds.length === 0) {
    return [];
  }

  const result = await query<FeedRow>(
    `${FEED_SELECT}
     where ($3::uuid[] is null or w.user_id = any($3::uuid[]))
     order by w.created_at desc
     limit $1 offset $2`,
    [limit, offset, authorIds ?? null]
  );

  const likedWorkIds = viewerId
    ? new Set(await getLikedWorkIds(viewerId, result.rows.map((row) => row.id)))
    : new Set<number>();

  return result.rows.map((row) => mapFeedRow(row, likedWorkIds));
}

// --- Derived activity feed (2026-10-11) -----------------------------------
// There's no dedicated notifications table, so "my activity" is assembled
// from the tables that already exist - likes/comments on my works, new
// followers, and (separately, in events.queries.ts) my application status
// changes. See profiles.service.ts for how these get merged/sorted.

export interface LikeActivityRow {
  id: number;
  work_id: number;
  created_at: string;
  liker_id: string;
  liker_name: string;
  liker_avatar: string | null;
}

export async function getRecentLikesOnMyWorks(userId: string, limit: number): Promise<LikeActivityRow[]> {
  const result = await query<LikeActivityRow>(
    `select wl.id, wl.work_id, wl.created_at, wl.user_id as liker_id,
            p.user_name as liker_name, p.avatar_url as liker_avatar
     from work_likes wl
     join works w on w.id = wl.work_id
     join profiles p on p.user_id = wl.user_id
     where w.user_id = $1 and wl.user_id != $1
     order by wl.created_at desc
     limit $2`,
    [userId, limit]
  );
  return result.rows;
}

export interface CommentActivityRow {
  id: number;
  work_id: number;
  content: string;
  created_at: string;
  commenter_id: string;
  commenter_name: string;
  commenter_avatar: string | null;
}

export async function getRecentCommentsOnMyWorks(
  userId: string,
  limit: number
): Promise<CommentActivityRow[]> {
  const result = await query<CommentActivityRow>(
    `select wc.id, wc.work_id, wc.content, wc.created_at, wc.user_id as commenter_id,
            p.user_name as commenter_name, p.avatar_url as commenter_avatar
     from work_comments wc
     join works w on w.id = wc.work_id
     join profiles p on p.user_id = wc.user_id
     where w.user_id = $1 and wc.user_id != $1
     order by wc.created_at desc
     limit $2`,
    [userId, limit]
  );
  return result.rows;
}

export interface FollowActivityRow {
  id: number;
  created_at: string;
  follower_id: string;
  follower_name: string;
  follower_avatar: string | null;
}

export async function getRecentNewFollowers(userId: string, limit: number): Promise<FollowActivityRow[]> {
  const result = await query<FollowActivityRow>(
    `select f.id, f.created_at, f.user_id as follower_id,
            p.user_name as follower_name, p.avatar_url as follower_avatar
     from followings f
     join profiles p on p.user_id = f.user_id
     where f.followed_id = $1
     order by f.created_at desc
     limit $2`,
    [userId, limit]
  );
  return result.rows;
}
