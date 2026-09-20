import { PoolClient } from 'pg';
import { pool } from '../pool';

export interface DbUser {
  id: string;
  email: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
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
