import { PoolClient } from 'pg';
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
