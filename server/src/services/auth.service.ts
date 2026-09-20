import bcrypt from 'bcrypt';
import { pool } from '../db/pool';
import {
  create_user,
  find_user_by_email,
} from '../db/queries/users.queries';
import {
  create_profile,
  find_profile_by_user_name,
} from '../db/queries/profiles.queries';
import { create_role } from '../db/queries/roles.queries';
import { UserRole } from '../types';

export type ArtistCategory =
  | 'painter'
  | 'photographer'
  | 'designer'
  | 'musician';

export interface RegisterInput {
  email: string;
  password: string;
  role: UserRole;
  user_name: string;
  artists_type?: ArtistCategory | null;
}

export async function register_user(input: RegisterInput) {
  const {
    email,
    password,
    role,
    user_name,
    artists_type = null,
  } = input;

  const existing_user = await find_user_by_email(email);

  if (existing_user) {
    throw new Error('Email is already registered');
  }

  const existing_profile = await find_profile_by_user_name(user_name);

  if (existing_profile) {
    throw new Error('Username is already taken');
  }

  if (role === 'artist' && !artists_type) {
    throw new Error('Artist type is required for artists');
  }

  if (role !== 'artist' && artists_type) {
    throw new Error('Only artists can have an artist type');
  }

  const password_hash = await bcrypt.hash(password, 12);

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const user = await create_user(
      client,
      email,
      password_hash,
    );

    const role_record = await create_role(
      client,
      user.id,
      role,
    );

    const profile = await create_profile(
      client,
      user.id,
      user_name,
      artists_type,
    );

    await client.query('COMMIT');

    return {
      user,
      role: role_record,
      profile,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
