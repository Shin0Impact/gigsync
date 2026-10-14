import { PoolClient } from 'pg';
import { pool } from '../../config/db';

// Single-use, expiring tokens for the account-recovery flows:
//   - 'password_reset'    (forgot-password -> reset-password)
//   - 'email_verification' (register/resend -> verify-email)
//
// Only the SHA-256 hash of the random token ever touches the DB - whoever
// has the raw token can use it once, before expires_at; used_at marks it
// spent. Creating a new token of a type for a user invalidates the user's
// older unused ones of the same type, so only the latest email's link
// works.

export type AuthTokenType = 'password_reset' | 'email_verification';

export interface DbAuthToken {
  id: string;
  user_id: string;
  type: AuthTokenType;
  token_hash: string;
  expires_at: Date;
  used_at: Date | null;
  created_at: Date;
}

export async function create_auth_token(
  client: PoolClient,
  user_id: string,
  type: AuthTokenType,
  token_hash: string,
  expires_at: Date,
): Promise<DbAuthToken> {
  // Invalidate older unused tokens of the same type for this user first,
  // so an inbox full of old links leaves only the newest one usable.
  await client.query(
    `UPDATE auth_tokens
        SET used_at = now()
      WHERE user_id = $1
        AND type = $2
        AND used_at IS NULL`,
    [user_id, type],
  );

  const result = await client.query<DbAuthToken>(
    `INSERT INTO auth_tokens (
        user_id,
        type,
        token_hash,
        expires_at
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *`,
    [user_id, type, token_hash, expires_at],
  );

  return result.rows[0];
}

export async function find_valid_auth_token(
  type: AuthTokenType,
  token_hash: string,
): Promise<DbAuthToken | null> {
  const result = await pool.query<DbAuthToken>(
    `SELECT * FROM auth_tokens
      WHERE type = $1
        AND token_hash = $2
        AND used_at IS NULL
        AND expires_at > now()
      LIMIT 1`,
    [type, token_hash],
  );

  return result.rows[0] ?? null;
}

export async function mark_auth_token_used(id: string): Promise<void> {
  await pool.query(`UPDATE auth_tokens SET used_at = now() WHERE id = $1`, [id]);
}
