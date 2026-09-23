import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';


import { pool } from '../config/db';
import {
  create_user,
  find_user_by_email,
  find_user_by_identifier,
} from '../db/queries/users.queries';
import {
  create_profile,
  find_profile_by_user_name,
} from '../db/queries/profiles.queries';
import {
  create_role,
  find_role_by_user_id,
} from '../db/queries/roles.queries';

import { env } from '../config/env';
import {
  AuthTokenPayload,
  UserRole,
} from '../types';

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

export interface LoginInput {
  identifier: string;
  password: string;
}

// Roles a person can self-assign through public registration. `admin` and
// `moderator` are deliberately excluded - those accounts review/approve
// verification requests and can view other users' uploaded ID documents,
// so they must be created out-of-band (a seed script, or an existing
// admin promoting someone), never picked by whoever fills out the signup
// form. `role` is typed as `UserRole` (includes admin/moderator) because
// that's what the rest of the app needs it to be after this check passes -
// this whitelist is what actually enforces the restriction at runtime.
const SELF_REGISTERABLE_ROLES: UserRole[] = ['artist', 'organizer', 'fan'];

export async function register_user(input: RegisterInput) {
  const {
    email,
    password,
    role,
    user_name,
    artists_type = null,
  } = input;

  if (!SELF_REGISTERABLE_ROLES.includes(role)) {
    throw new Error('Invalid role');
  }

  // Only a length floor, not a complexity rule (no forced uppercase/
  // digit/symbol) - NIST 800-63B's current guidance is that a minimum
  // length does more for real-world security than arbitrary composition
  // rules, which mostly just push people toward predictable patterns
  // like "Password1!". The controller already rejected a missing
  // password outright; this only rejects one that's too short to be
  // worth hashing and storing.
  const MIN_PASSWORD_LENGTH = 8;
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }

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

// Precomputed once at module load (same cost factor - 12 - used for real
// password hashes below) so login_user always has a hash to compare
// against, even when the account doesn't exist.
const DUMMY_PASSWORD_HASH = bcrypt.hashSync('dummy-password-for-constant-time-login', 12);

export async function login_user(input: LoginInput) {
  const {
    identifier,
    password,
  } = input;

  const user = await find_user_by_identifier(identifier);

  // Always run bcrypt.compare, with the same cost factor, whether or not
  // the account exists - comparing against DUMMY_PASSWORD_HASH when it
  // doesn't. Previously a missing user returned immediately, skipping
  // bcrypt.compare entirely; since that call consistently takes tens of
  // milliseconds, timing a batch of login attempts let an attacker tell
  // "no such account" apart from "wrong password" and enumerate valid
  // emails - even though the error message itself was already the same
  // generic "Invalid credentials" either way.
  const password_matches = await bcrypt.compare(
    password,
    user?.password_hash ?? DUMMY_PASSWORD_HASH,
  );

  if (!user || !password_matches) {
    throw new Error('Invalid credentials');
  }

  const role_record = await find_role_by_user_id(user.id);

  if (!role_record) {
    throw new Error('User role not found');
  }

  const payload: AuthTokenPayload = {
    userId: user.id,
    role: role_record.role,
  };

  const access_token_options: SignOptions = {
    expiresIn: env.jwt.accessExpiresIn as SignOptions['expiresIn'],
  };

  const refresh_token_options: SignOptions = {
    expiresIn: env.jwt.refreshExpiresIn as SignOptions['expiresIn'],
  };

  const access_token = jwt.sign(
    payload,
    env.jwt.accessSecret,
    access_token_options,
  );

  const refresh_token = jwt.sign(
    payload,
    env.jwt.refreshSecret,
    refresh_token_options,
  );

  return {
    user,
    role: role_record,
    access_token,
    refresh_token,
  };
}

export async function refresh_tokens(refresh_token: string) {
  let payload: AuthTokenPayload;

  try {
    payload = jwt.verify(
      refresh_token,
      env.jwt.refreshSecret,
    ) as AuthTokenPayload;
  } catch {
    throw new Error('Invalid or expired refresh token');
  }

  const role_record = await find_role_by_user_id(payload.userId);

  if (!role_record) {
    throw new Error('User role not found');
  }

  const new_payload: AuthTokenPayload = {
    userId: payload.userId,
    role: role_record.role,
  };

  const access_token_options: SignOptions = {
    expiresIn: env.jwt.accessExpiresIn as SignOptions['expiresIn'],
  };

  const refresh_token_options: SignOptions = {
    expiresIn: env.jwt.refreshExpiresIn as SignOptions['expiresIn'],
  };

  const new_access_token = jwt.sign(
    new_payload,
    env.jwt.accessSecret,
    access_token_options,
  );

  const new_refresh_token = jwt.sign(
    new_payload,
    env.jwt.refreshSecret,
    refresh_token_options,
  );

  return {
    access_token: new_access_token,
    refresh_token: new_refresh_token,
  };
}
