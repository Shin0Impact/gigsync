import { pool } from '../../config/db';

// Card #82 - artist/organizer verification. Needs three new pieces of
// schema (same handoff pattern as event_media). Nothing has been run
// against Supabase yet, so this is the full, final version - a
// `verification_status` enum (matching how `event_status` /
// `application_status` are already done elsewhere in this schema, rather
// than an unconstrained varchar), a `social_links` table (placeholder for
// real OAuth social-account connecting, which isn't built yet - for now
// it's a self-reported platform + URL, enough to prove "has a social
// presence" at request time), a `verification_requests` table (the review
// queue, including the uploaded ID document's object key), and an
// `is_verified` flag on `profiles` (the fast read path a profile card
// checks, so it doesn't have to join into verification_requests just to
// show a badge).
//
//   CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected');
//
//   CREATE TABLE social_links (
//     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
//     user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
//     platform varchar NOT NULL,
//     url text NOT NULL,
//     created_at timestamptz NOT NULL DEFAULT now(),
//     UNIQUE (user_id, platform)
//   );
//
//   CREATE TABLE verification_requests (
//     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
//     user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
//     status verification_status NOT NULL DEFAULT 'pending',
//     id_document_key text NOT NULL,
//     notes text,
//     reviewed_by uuid REFERENCES users(id) ON DELETE SET NULL,
//     reviewed_at timestamptz,
//     created_at timestamptz NOT NULL DEFAULT now()
//   );
//
//   ALTER TABLE profiles ADD COLUMN is_verified boolean NOT NULL DEFAULT false;
//
//   CREATE INDEX idx_verification_requests_status ON verification_requests (status);
//   CREATE INDEX idx_verification_requests_user_id ON verification_requests (user_id);
//   CREATE INDEX idx_social_links_user_id ON social_links (user_id);
//
// `id_document_key` points into a SEPARATE, private R2 bucket
// (env.r2.idDocumentsBucketName) - never the public media bucket, and
// never exposed as a public URL. See media.service.ts's
// request_id_document_upload_url / get_id_document_view_url.

export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export interface DbSocialLink {
  id: string;
  user_id: string;
  platform: string;
  url: string;
  created_at: Date;
}

export async function create_social_link(userId: string, platform: string, url: string): Promise<DbSocialLink> {
  const result = await pool.query<DbSocialLink>(
    `INSERT INTO social_links (user_id, platform, url) VALUES ($1, $2, $3)
     RETURNING id, user_id, platform, url, created_at`,
    [userId, platform, url],
  );
  return result.rows[0];
}

export async function list_social_links_for_user(userId: string): Promise<DbSocialLink[]> {
  const result = await pool.query<DbSocialLink>(
    'SELECT id, user_id, platform, url, created_at FROM social_links WHERE user_id = $1 ORDER BY created_at ASC',
    [userId],
  );
  return result.rows;
}

export async function count_social_links_for_user(userId: string): Promise<number> {
  const result = await pool.query<{ count: string }>(
    'SELECT COUNT(*)::text AS count FROM social_links WHERE user_id = $1',
    [userId],
  );
  return Number(result.rows[0]?.count ?? 0);
}

export interface DbVerificationRequest {
  id: string;
  user_id: string;
  status: VerificationStatus;
  id_document_key: string;
  notes: string | null;
  reviewed_by: string | null;
  reviewed_at: Date | null;
  created_at: Date;
}

export async function create_verification_request(userId: string, idDocumentKey: string): Promise<DbVerificationRequest> {
  const result = await pool.query<DbVerificationRequest>(
    `INSERT INTO verification_requests (user_id, status, id_document_key) VALUES ($1, 'pending', $2)
     RETURNING id, user_id, status, id_document_key, notes, reviewed_by, reviewed_at, created_at`,
    [userId, idDocumentKey],
  );
  return result.rows[0];
}

// A user shouldn't be able to stack up multiple pending requests, or
// re-request once already approved - this is the guard for both.
export async function find_active_verification_request_for_user(userId: string): Promise<DbVerificationRequest | null> {
  const result = await pool.query<DbVerificationRequest>(
    `SELECT id, user_id, status, id_document_key, notes, reviewed_by, reviewed_at, created_at
     FROM verification_requests
     WHERE user_id = $1 AND status IN ('pending', 'approved')
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId],
  );
  return result.rows[0] ?? null;
}

export async function find_verification_request_by_id(id: string): Promise<DbVerificationRequest | null> {
  const result = await pool.query<DbVerificationRequest>(
    `SELECT id, user_id, status, id_document_key, notes, reviewed_by, reviewed_at, created_at
     FROM verification_requests WHERE id = $1 LIMIT 1`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function list_pending_verification_requests(): Promise<DbVerificationRequest[]> {
  const result = await pool.query<DbVerificationRequest>(
    `SELECT id, user_id, status, id_document_key, notes, reviewed_by, reviewed_at, created_at
     FROM verification_requests WHERE status = 'pending' ORDER BY created_at ASC`,
  );
  return result.rows;
}

export async function decide_verification_request(
  id: string,
  status: 'approved' | 'rejected',
  reviewedBy: string,
  notes: string | null,
): Promise<DbVerificationRequest> {
  const result = await pool.query<DbVerificationRequest>(
    `UPDATE verification_requests
     SET status = $2, reviewed_by = $3, notes = $4, reviewed_at = now()
     WHERE id = $1
     RETURNING id, user_id, status, id_document_key, notes, reviewed_by, reviewed_at, created_at`,
    [id, status, reviewedBy, notes],
  );
  return result.rows[0];
}

export async function set_profile_verified(userId: string, isVerified: boolean): Promise<void> {
  await pool.query('UPDATE profiles SET is_verified = $2 WHERE user_id = $1', [userId, isVerified]);
}

export async function is_profile_verified(userId: string): Promise<boolean> {
  const result = await pool.query<{ is_verified: boolean }>(
    'SELECT is_verified FROM profiles WHERE user_id = $1 LIMIT 1',
    [userId],
  );
  return result.rows[0]?.is_verified ?? false;
}
