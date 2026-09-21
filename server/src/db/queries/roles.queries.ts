import { PoolClient } from 'pg';
import { pool } from '../../config/db';
import { UserRole } from '../../types';

export interface DbRole {
  user_id: string;
  role: UserRole;
  created_at: Date;
}

export async function create_role(
  client: PoolClient,
  user_id: string,
  role: UserRole,
): Promise<DbRole> {
  const result = await client.query<DbRole>(
    `
      INSERT INTO roles (
        user_id,
        role
      )
      VALUES ($1, $2)
      RETURNING
        user_id,
        role,
        created_at
    `,
    [user_id, role],
  );

  return result.rows[0];
}

export async function find_role_by_user_id(
  user_id: string,
): Promise<DbRole | null> {
  const result = await pool.query<DbRole>(
    `
      SELECT
        user_id,
        role,
        created_at
      FROM roles
      WHERE user_id = $1
      LIMIT 1
    `,
    [user_id],
  );

  return result.rows[0] ?? null;
}