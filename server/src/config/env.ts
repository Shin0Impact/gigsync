import dotenv from 'dotenv';

dotenv.config();

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

  jwt: {
    accessSecret: required('JWT_ACCESS_SECRET', 'dev_access_secret'),
    refreshSecret: required('JWT_REFRESH_SECRET', 'dev_refresh_secret'),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  },

  r2: {
    accountId: process.env.R2_ACCOUNT_ID ?? '',
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
    bucketName: process.env.R2_BUCKET_NAME ?? 'gigsync-media',
    publicUrl: process.env.R2_PUBLIC_URL ?? '',
    // A SEPARATE, private bucket for verification ID documents (card #82).
    // Must NOT have a public dev URL enabled in Cloudflare - unlike the
    // main media bucket, nothing in here is ever meant to be reachable by
    // a bare URL. Every read goes through a short-lived presigned GET,
    // generated only for a moderator reviewing a specific request.
    idDocumentsBucketName: process.env.R2_ID_DOCUMENTS_BUCKET_NAME ?? '',
  },
};
