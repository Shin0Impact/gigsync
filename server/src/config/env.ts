import dotenv from 'dotenv';
import path from 'path';

// dotenv.config() with no `path` resolves `.env` relative to
// process.cwd() - fine for `npm run dev` (repo root's own "dev" script
// runs `tsx server/src/index.ts` from the repo root, where the real
// `.env` lives), but every script defined in THIS package.json
// ("dev/test:*" here in server/) runs with cwd = server/, which has no
// `.env` of its own (just `.env.example`). That silently broke the first
// server/-cwd script to actually import this file at runtime
// (test:sockets, via ../src/config/db) - `npm run dev` and the plain
// fetch-based test:* files never happened to hit it, since the fetch
// tests don't import server source at all. Resolving from `__dirname`
// instead of cwd makes this work the same regardless of where a script
// is invoked from: __dirname is always .../server/src/config (dev, via
// tsx) or .../server/dist/config (prod, via `node dist/index.js`), so
// three levels up is always the repo root either way. In production
// (Render/Railway, see render.yaml) there's no .env file at that path at
// all - dotenv.config() just no-ops and process.env is already populated
// by the platform, so this is a no-op there, not a behavior change.
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',

  databaseUrl: required('DATABASE_URL', 'postgres://user:password@localhost:5432/gigsync'),

  // No fallback for either JWT secret, deliberately - a `required()` call
  // with a hardcoded default defeats the entire point of being "required".
  // If these are ever unset on a real deployment (easy to forget when
  // setting up Render/Railway env vars), this must crash at boot, not
  // silently start signing real user sessions - including admin/moderator
  // ones - with a guessable string that's sitting in this repo's git
  // history. A missing secret should be loud and immediate, not a
  // production incident waiting to be noticed.
  jwt: {
    accessSecret: required('JWT_ACCESS_SECRET'),
    refreshSecret: required('JWT_REFRESH_SECRET'),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  },

  r2: {
    accountId: process.env.R2_ACCOUNT_ID ?? '',
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
    bucketName: process.env.R2_BUCKET_NAME ?? 'gigsync-media',
    publicUrl: process.env.R2_PUBLIC_URL ?? '',
  },
};
