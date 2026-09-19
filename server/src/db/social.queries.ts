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
