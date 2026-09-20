import { PoolClient } from 'pg';
import { pool } from '../pool';

export interface DbProfile {
  id: number;
  created_at: Date;
  user_name: string;
  user_id: string;
  avatar_url: string | null;
  followers_number: number;
  artists_type: string | null;
}

export async function find_profile_by_user_name(
  user_name: string,
): Promise<DbProfile | null> {
  const result = await pool.query<DbProfile>(
    `
      SELECT
        id,
        created_at,
        user_name,
        user_id,
        avatar_url,
        followers_number,
        artists_type
      FROM profiles
      WHERE user_name = $1
      LIMIT 1
    `,
    [user_name],
  );

  return result.rows[0] ?? null;
}

export async function create_profile(
  client: PoolClient,
  user_id: string,
  user_name: string,
  artists_type: string | null,
): Promise<DbProfile> {
  const result = await client.query<DbProfile>(
    `
      INSERT INTO profiles (
        user_id,
        user_name,
        artists_type
      )
      VALUES ($1, $2, $3)
      RETURNING
        id,
        created_at,
        user_name,
        user_id,
        avatar_url,
        followers_number,
        artists_type
    `,
    [user_id, user_name, artists_type],
  );

  return result.rows[0];
}
