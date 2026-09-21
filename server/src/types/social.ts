// Types mirroring the schema actually live in Supabase right now (see
// docs/DESIGN_DOC.md section 5a - "Schema drift: live Supabase vs.
// schema.sql"), NOT server/src/db/schema.sql. This is Kareem's evolving
// portfolio/feed model (works, likes, comments, follows) and is separate
// from the marketplace domain types in server/src/types/index.ts.
//
// Scaffolding only as of 2026-09-19: not wired into server/src/routes yet
// - Kareem owns finalizing the shape before it's mounted.

import { UserRole } from './index';

// Confirmed 2026-09-19 via:
//   select t.typname, e.enumlabel from pg_type t
//   join pg_enum e on t.oid = e.enumtypid;
// `roles.role` uses the same value set as UserRole in ./index.ts, so it's
// reused here rather than redefined.
export type ArtistType = 'painter' | 'photographer' | 'designer' | 'musician';
export type Role = UserRole;

// profiles table
export interface IProfile {
  id: number;
  userId: string; // uuid, presumably references auth.users / users.id
  userName: string;
  avatarUrl: string | null;
  followersNumber: number;
  artistsType: ArtistType;
  createdAt: string;
}

// roles table
export interface IUserRole {
  userId: string;
  role: Role;
  createdAt: string;
}

// followings table
export interface IFollowing {
  id: number;
  userId: string;
  followedId: string;
  createdAt: string;
}

// works table - a piece of work/portfolio item, root of the update/like/comment chain
export interface IWork {
  id: number;
  userId: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

// work_updates table - versioned updates/posts against a work
export interface IWorkUpdate {
  id: number;
  workId: number;
  versionNumber: number;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

// update_media table - media attachments on a work_update, R2-backed like showcase_items
export interface IUpdateMedia {
  id: number;
  updateId: number;
  mediaType: string;
  r2Key: string;
  mimeType: string;
  fileSizeBytes: number;
  sortOrder: number;
  createdAt: string;
}

// work_likes table
export interface IWorkLike {
  id: number;
  workId: number;
  userId: string;
  createdAt: string;
}

// work_comments table
export interface IWorkComment {
  id: number;
  workId: number;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// `event` table (singular - distinct from the marketplace `IEvent` /
// `events` table in server/src/types/index.ts). Ties to work_updates via
// postId; looks like a scheduled post/drop window rather than a bookable
// gig. Do not conflate with IEvent.
export interface IPostEvent {
  id: number;
  postId: number; // references work_updates.id (unconfirmed FK - no constraint info available yet)
  startAt: string;
  endAt: string;
  createdAt: string;
}
