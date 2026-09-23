import {
  createUpdateMedia,
  createWork,
  createWorkUpdate,
  deleteUpdateMedia,
  getMediaForUpdate,
  getUpdateMediaById,
  getWorkById,
  getWorkUpdateById,
  getWorkUpdates,
  getWorksByUser,
} from '../db/social.queries';
import { delete_object } from './media.service';

const VALID_MEDIA_TYPES = ['image', 'video'];

// "Works" are an artist's portfolio: a Work is a project, each Work has
// versioned Updates (progress posts), and each Update can carry R2-backed
// media. This is the "artist uploads" half of card #78's follow-up - the
// social bits (likes/comments/follows) stay out of scope here, matching
// Kareem's read-only scaffolding in social.queries.ts/social.ts.

export async function create_work(userId: string, description: string | null) {
  return createWork(userId, description ?? null);
}

export async function get_works_for_user(userId: string) {
  return getWorksByUser(userId);
}

export async function add_work_update(userId: string, workId: number, description: string | null) {
  const work = await getWorkById(workId);

  if (!work) {
    throw new Error('Work not found');
  }

  if (work.userId !== userId) {
    throw new Error('You do not own this work');
  }

  return createWorkUpdate(workId, description ?? null);
}

export async function get_updates_for_work(workId: number) {
  const work = await getWorkById(workId);

  if (!work) {
    throw new Error('Work not found');
  }

  return getWorkUpdates(workId);
}

export interface AddUpdateMediaInput {
  mediaType: string;
  objectKey: string;
  mimeType?: string;
  fileSizeBytes?: number;
  sortOrder?: number;
}

// Ownership of a piece of update media runs update -> work -> userId, so
// this has to walk both rows rather than a single ownership check (same
// shape as event_media's event -> organizer_id check, just one hop deeper).
async function assert_owns_update(userId: string, updateId: number) {
  const update = await getWorkUpdateById(updateId);

  if (!update) {
    throw new Error('Work update not found');
  }

  const work = await getWorkById(update.workId);

  if (!work || work.userId !== userId) {
    throw new Error('You do not own this work');
  }

  return update;
}

export async function add_update_media(userId: string, updateId: number, input: AddUpdateMediaInput) {
  await assert_owns_update(userId, updateId);

  const { mediaType, objectKey, mimeType = 'application/octet-stream', fileSizeBytes = 0, sortOrder = 0 } = input;

  if (!mediaType || !objectKey) {
    throw new Error('mediaType and objectKey are required');
  }

  if (!VALID_MEDIA_TYPES.includes(mediaType)) {
    throw new Error(`Invalid mediaType: ${mediaType}`);
  }

  return createUpdateMedia({
    updateId,
    mediaType,
    r2Key: objectKey,
    mimeType,
    fileSizeBytes,
    sortOrder,
  });
}

export async function get_media_for_update(updateId: number) {
  const update = await getWorkUpdateById(updateId);

  if (!update) {
    throw new Error('Work update not found');
  }

  return getMediaForUpdate(updateId);
}

export async function remove_update_media(userId: string, updateId: number, mediaId: number) {
  await assert_owns_update(userId, updateId);

  const media = await getUpdateMediaById(mediaId);

  if (!media || media.updateId !== updateId) {
    throw new Error('Media not found');
  }

  await deleteUpdateMedia(mediaId);

  // Best-effort R2 cleanup, same pattern as remove_event_media /
  // remove_showcase_item.
  try {
    await delete_object(media.r2Key);
  } catch (err) {
    console.warn(`Failed to delete R2 object ${media.r2Key} after removing update media ${mediaId}:`, err);
  }
}
