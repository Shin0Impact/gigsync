import { randomUUID } from 'crypto';
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
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

function sanitize_file_name(fileName: string): string {
  // Strip anything that isn't safe in an S3/R2 object key path segment.
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-100);
}

export interface RequestUploadUrlInput {
  fileName: string;
  contentType: string;
  folder?: string;
}

export async function request_upload_url(input: RequestUploadUrlInput) {
  const { fileName, contentType, folder = 'uploads' } = input;

  if (!fileName || !contentType) {
    throw new Error('fileName and contentType are required');
  }

  if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
    throw new Error(`Unsupported contentType: ${contentType}`);
  }

  const safe_folder = folder.replace(/[^a-zA-Z0-9/_-]/g, '');
  const object_key = `${safe_folder}/${randomUUID()}-${sanitize_file_name(fileName)}`;

  const command = new PutObjectCommand({
    Bucket: env.r2.bucketName,
    Key: object_key,
    ContentType: contentType,
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

// --- Verification ID documents (card #82) --------------------------------
// A SEPARATE, private bucket - never the public media bucket above, and
// never returns a public URL. An ID photo has no business being fetchable
// by anyone who happens to have the link; the only way to ever read one
// back is get_id_document_view_url below, called from a moderator-only
// route for one specific request.

const ID_DOCUMENT_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const ID_DOCUMENT_VIEW_URL_EXPIRY_SECONDS = 5 * 60;

export interface RequestIdDocumentUploadUrlInput {
  fileName: string;
  contentType: string;
}

export async function request_id_document_upload_url(input: RequestIdDocumentUploadUrlInput) {
  const { fileName, contentType } = input;

  if (!fileName || !contentType) {
    throw new Error('fileName and contentType are required');
  }

  if (!ID_DOCUMENT_CONTENT_TYPES.includes(contentType)) {
    throw new Error(`Unsupported contentType: ${contentType}`);
  }

  if (!env.r2.idDocumentsBucketName) {
    throw new Error('ID document uploads are not configured (R2_ID_DOCUMENTS_BUCKET_NAME is not set)');
  }

  const object_key = `id-documents/${randomUUID()}-${sanitize_file_name(fileName)}`;

  const command = new PutObjectCommand({
    Bucket: env.r2.idDocumentsBucketName,
    Key: object_key,
    ContentType: contentType,
  });

  const upload_url = await getSignedUrl(r2Client, command, {
    expiresIn: UPLOAD_URL_EXPIRY_SECONDS,
  });

  // Deliberately no publicUrl field here, unlike request_upload_url -
  // this bucket has no public dev URL, and returning one would be a bug,
  // not a convenience.
  return {
    uploadUrl: upload_url,
    objectKey: object_key,
    expiresInSeconds: UPLOAD_URL_EXPIRY_SECONDS,
  };
}

// Generates a short-lived presigned GET for one specific ID document.
// Called only from a moderator-role-gated route (see
// verification.controller.ts) - this function itself does no auth
// checking, it just assumes the caller already verified the requester is
// allowed to see this document.
export async function get_id_document_view_url(objectKey: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: env.r2.idDocumentsBucketName,
    Key: objectKey,
  });

  return getSignedUrl(r2Client, command, { expiresIn: ID_DOCUMENT_VIEW_URL_EXPIRY_SECONDS });
}

export async function delete_id_document(objectKey: string): Promise<void> {
  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: env.r2.idDocumentsBucketName,
      Key: objectKey,
    }),
  );
}
