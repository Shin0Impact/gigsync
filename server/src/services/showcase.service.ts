import {
  count_showcase_items_for_user,
  create_showcase_item,
  delete_showcase_item,
  find_showcase_item_by_id,
  find_showcase_item_by_source,
  list_showcase_items_for_user,
  ShowcaseSourceType,
} from '../db/queries/showcase.queries';
import { find_event_by_id } from '../db/queries/events.queries';
import { find_event_media_by_id } from '../db/queries/event_media.queries';
import { getUpdateMediaById, getWorkById, getWorkUpdateById } from '../db/social.queries';
import { env } from '../config/env';

const VALID_SOURCE_TYPES: ShowcaseSourceType[] = ['event_media', 'update_media'];

// A profile only gets to spotlight a handful of items, not its entire
// upload history - this is the "top 3" cap. Bump this if the product call
// changes; there's nothing else tying the number to 3.
const MAX_SHOWCASE_ITEMS = 3;

export interface AddShowcaseItemInput {
  sourceType: ShowcaseSourceType;
  sourceId: string | number;
  sortOrder?: number;
}

// Pinning is self-ownership only: you can only showcase media you
// yourself uploaded - your own event flyers/photos if you're the
// organizer who owns the event, or media from your own work updates if
// you're the artist who owns the work. No cross-user pinning (e.g. an
// artist pinning another organizer's event photo) yet.
async function assert_owns_source(
  userId: string,
  sourceType: ShowcaseSourceType,
  sourceId: string | number,
) {
  if (sourceType === 'event_media') {
    const media = await find_event_media_by_id(String(sourceId));
    if (!media) {
      throw new Error('Source media not found');
    }
    const event = await find_event_by_id(media.event_id);
    if (!event || event.organizer_id !== userId) {
      throw new Error('You do not own this media');
    }
    return;
  }

  const media = await getUpdateMediaById(Number(sourceId));
  if (!media) {
    throw new Error('Source media not found');
  }
  const update = await getWorkUpdateById(media.updateId);
  if (!update) {
    throw new Error('Source media not found');
  }
  const work = await getWorkById(update.workId);
  if (!work || work.userId !== userId) {
    throw new Error('You do not own this media');
  }
}

export async function add_showcase_item(userId: string, input: AddShowcaseItemInput) {
  const { sourceType, sourceId, sortOrder = 0 } = input;

  if (!sourceType || sourceId === undefined || sourceId === null) {
    throw new Error('sourceType and sourceId are required');
  }

  if (!VALID_SOURCE_TYPES.includes(sourceType)) {
    throw new Error(`Invalid sourceType: ${sourceType}`);
  }

  await assert_owns_source(userId, sourceType, sourceId);

  const existing = await find_showcase_item_by_source(userId, sourceType, sourceId);
  if (existing) {
    throw new Error('This media is already pinned');
  }

  const count = await count_showcase_items_for_user(userId);
  if (count >= MAX_SHOWCASE_ITEMS) {
    throw new Error(`You can only pin up to ${MAX_SHOWCASE_ITEMS} items`);
  }

  return create_showcase_item({ userId, sourceType, sourceId, sortOrder });
}

// Listing resolves each pin's underlying media (objectKey/publicUrl) so
// callers don't have to make a second round trip per item - a showcase is
// meant to render straight to a profile grid.
export async function get_showcase_items_for_user(userId: string) {
  const items = await list_showcase_items_for_user(userId);

  return Promise.all(
    items.map(async (item) => {
      if (item.event_media_id) {
        const media = await find_event_media_by_id(item.event_media_id);
        return {
          id: item.id,
          sourceType: 'event_media' as const,
          sourceId: item.event_media_id,
          sortOrder: item.sort_order,
          createdAt: item.created_at,
          objectKey: media?.object_key ?? null,
          publicUrl: media && env.r2.publicUrl ? `${env.r2.publicUrl.replace(/\/$/, '')}/${media.object_key}` : null,
          mediaType: media?.media_type ?? null,
        };
      }

      const media = item.update_media_id ? await getUpdateMediaById(item.update_media_id) : null;
      return {
        id: item.id,
        sourceType: 'update_media' as const,
        sourceId: item.update_media_id,
        sortOrder: item.sort_order,
        createdAt: item.created_at,
        objectKey: media?.r2Key ?? null,
        publicUrl: media && env.r2.publicUrl ? `${env.r2.publicUrl.replace(/\/$/, '')}/${media.r2Key}` : null,
        mediaType: media?.mediaType ?? null,
      };
    }),
  );
}

export async function remove_showcase_item(userId: string, itemId: string) {
  const item = await find_showcase_item_by_id(itemId);

  if (!item) {
    throw new Error('Showcase item not found');
  }

  if (item.user_id !== userId) {
    throw new Error('You do not own this showcase item');
  }

  // Unpinning just deletes the pin row - the underlying event_media /
  // update_media row (and its R2 object) is untouched. Deleting the
  // original upload is a separate action on the events/works endpoints.
  await delete_showcase_item(itemId);
}
