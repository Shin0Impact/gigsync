import { randomUUID } from 'crypto';
import { DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { r2Client } from '../config/r2';
import { env } from '../config/env';

// POST /api/media/upload-url - the first half of the two-step upload flow:
// the client asks us for a pre-signed PUT URL, uploads the file straight to
// R2 with it (we never see the file bytes), then calls the relevant
// "attach this media" endpoint (e.g. POST /api/events/:id/media) with the
// objectKey this returned.
//
// generateUploadUrl does no network I/O itself - presigning is a local
// HMAC computation over the request, so this is safe/fast to call even if
// R2 credentials in env are placeholders (the URL just won't work when
// something actually PUTs to it).

const ALLOWED_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/quicktime',
];

const UPLOAD_URL_EXPIRY_SECONDS = 5 * 60;

// Nothing capped the size of what could be PUT to a presigned URL before
// this - a caller could request a URL for a "photo" and then upload a
// multi-gigabyte file straight into the R2 bucket, since presigning is
// just a local HMAC computation that never looks at how many bytes
// eventually get sent. 50MB comfortably covers portfolio photos and short
// video clips (the allowed content types below); tighten or split by
// content type later if the product needs something stricter for images
// specifically.
const MAX_UPLOAD_SIZE_BYTES = 50 * 1024 * 1024;

function sanitize_file_name(fileName: string): string {
  // Strip anything that isn't safe in an S3/R2 object key path segment.
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-100);
}

export interface RequestUploadUrlInput {
  fileName: string;
  contentType: string;
  fileSizeBytes: number;
  folder?: string;
}

export async function request_upload_url(input: RequestUploadUrlInput) {
  const { fileName, contentType, fileSizeBytes, folder = 'uploads' } = input;

  if (!fileName || !contentType || !fileSizeBytes) {
    throw new Error('fileName, contentType, and fileSizeBytes are required');
  }

  if (!Number.isFinite(fileSizeBytes) || fileSizeBytes <= 0) {
    throw new Error('fileSizeBytes must be a positive number');
  }

  if (fileSizeBytes > MAX_UPLOAD_SIZE_BYTES) {
    throw new Error(`fileSizeBytes exceeds the ${MAX_UPLOAD_SIZE_BYTES} byte limit`);
  }

  if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
    throw new Error(`Unsupported contentType: ${contentType}`);
  }

  const safe_folder = folder.replace(/[^a-zA-Z0-9/_-]/g, '');
  const object_key = `${safe_folder}/${randomUUID()}-${sanitize_file_name(fileName)}`;

  // Signing ContentLength (in addition to ContentType) locks the actual PUT
  // to exactly this many bytes - R2 rejects the request outright if the
  // real upload's Content-Length header doesn't match what was signed here,
  // which is what actually enforces the cap above: the client can't get a
  // URL for a declared-small file and then stream something bigger into
  // it. This doesn't verify the CONTENT matches contentType (that would
  // need inspecting the real bytes, e.g. magic-number sniffing after
  // upload, or a virus/content scan step) - it only proves the size and
  // declared type match what was signed.
  const command = new PutObjectCommand({
    Bucket: env.r2.bucketName,
    Key: object_key,
    ContentType: contentType,
    ContentLength: fileSizeBytes,
  });

  const upload_url = await getSignedUrl(r2Client, command, {
    expiresIn: UPLOAD_URL_EXPIRY_SECONDS,
  });

  const public_url = env.r2.publicUrl
    ? `${env.r2.publicUrl.replace(/\/$/, '')}/${object_key}`
    : null;

  return {
    uploadUrl: upload_url,
    objectKey: object_key,
    publicUrl: public_url,
    expiresInSeconds: UPLOAD_URL_EXPIRY_SECONDS,
  };
}

// Deletes the actual object from R2. Callers (event media, showcases, ...)
// should call this whenever they delete a row that references an object
// key, so removing a media item doesn't leave an orphaned file sitting in
// the bucket forever. Deleting a key that doesn't exist is not an error
// (S3/R2 DeleteObject is idempotent), so this is safe to call even if the
// object was already gone somehow.
export async function delete_object(objectKey: string): Promise<void> {
  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: env.r2.bucketName,
      Key: objectKey,
    }),
  );
}
