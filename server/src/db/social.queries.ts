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
