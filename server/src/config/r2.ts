import { S3Client } from '@aws-sdk/client-s3';
import { env } from './env';

// Cloudflare R2 is S3-compatible, so the AWS SDK's S3Client works against
// it unmodified - just point endpoint at R2's account-scoped URL and force
// path-style addressing (R2 doesn't support the virtual-hosted-style
// <bucket>.s3.amazonaws.com addressing the AWS SDK defaults to).
// `region` is required by the SDK's types but is meaningless to R2 - "auto"
// is what Cloudflare's own docs use.
export const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${env.r2.accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.r2.accessKeyId,
    secretAccessKey: env.r2.secretAccessKey,
  },
  forcePathStyle: true,
});
