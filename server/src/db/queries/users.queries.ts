import { PoolClient } from 'pg';
import { pool } from '../../config/db';

export interface DbUser {
  id: string;
  email: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

export interface DbUserWithUsername extends DbUser {
  user_name: string;
}

export async function find_user_by_email(
  email: string,
): Promise<DbUser | null> {
  const result = await pool.query<DbUser>(
    `
      SELECT
        id,
        email,
        password_hash,
        created_at,
        updated_at
      FROM users
      WHERE email = $1
      LIMIT 1
    `,
    [email],
  );

  return result.rows[0] ?? null;
}

export async function find_user_by_identifier(
  identifier: string,
): Promise<DbUserWithUsername | null> {
  const result = await pool.query<DbUserWithUsername>(
    `
      SELECT
        u.id,
        u.email,
        u.password_hash,
        u.created_at,
        u.updated_at,
        p.user_name
      FROM users u
      INNER JOIN profiles p
        ON p.user_id = u.id
      WHERE u.email = $1
         OR p.user_name = $1
      LIMIT 1
    `,
    [identifier],
  );

  return result.rows[0] ?? null;
}

export async function create_user(
  client: PoolClient,
  email: string,
  password_hash: string,
): Promise<DbUser> {
  const result = await client.query<DbUser>(
    `
      INSERT INTO users (
        email,
        password_hash
      )
      VALUES ($1, $2)
      RETURNING
        id,
        email,
        password_hash,
        created_at,
        updated_at
    `,
    [email, password_hash],
  );

  return result.rows[0];
}

// --- Account recovery (change-password / reset-password / verify-email) ---

export async function find_user_by_id(user_id: string): Promise<DbUser | null> {
  const result = await pool.query<DbUser>(
    `
      SELECT
        id,
        email,
        password_hash,
        created_at,
        updated_at
      FROM users
      WHERE id = $1
      LIMIT 1
    `,
    [user_id],
  );

  return result.rows[0] ?? null;
}

export async function update_user_password(
  user_id: string,
  password_hash: string,
): Promise<void> {
  await pool.query(
    `UPDATE users
        SET password_hash = $2,
            updated_at = now()
      WHERE id = $1`,
    [user_id, password_hash],
  );
}

export async function mark_user_email_verified(user_id: string): Promise<void> {
  await pool.query(
    `UPDATE users
        SET email_verified = true,
            updated_at = now()
      WHERE id = $1`,
    [user_id],
  );
}