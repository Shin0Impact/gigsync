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
import { list_event_media } from '../db/queries/event_media.queries';
import { getMediaForUpdate, getWorkById, getWorkUpdates } from '../db/social.queries';

const VALID_SOURCE_TYPES: ShowcaseSourceType[] = ['event', 'work'];

// A profile only gets to spotlight a handful of projects/events, not its
// entire history - this is the "top 3" cap. Bump this if the product call
// changes; there's nothing else tying the number to 3.
const MAX_SHOWCASE_ITEMS = 3;

export interface AddShowcaseItemInput {
  sourceType: ShowcaseSourceType;
  sourceId: number;
  sortOrder?: number;
}

// Pinning is self-ownership only: an organizer can pin one of their own
// events, an artist can pin one of their own works (a project). No
// cross-user pinning yet.
async function assert_owns_source(userId: string, sourceType: ShowcaseSourceType, sourceId: number) {
  if (sourceType === 'event') {
    const event = await find_event_by_id(sourceId);
    if (!event) {
      throw new Error('Source not found');
    }
    if (event.organizer_id !== userId) {
      throw new Error('You do not own this');
    }
    return;
  }

  const work = await getWorkById(sourceId);
  if (!work) {
    throw new Error('Source not found');
  }
  if (work.userId !== userId) {
    throw new Error('You do not own this');
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
    throw new Error('This is already pinned');
  }

  const count = await count_showcase_items_for_user(userId);
  if (count >= MAX_SHOWCASE_ITEMS) {
    throw new Error(`You can only pin up to ${MAX_SHOWCASE_ITEMS} items`);
  }

  return create_showcase_item({ userId, sourceType, sourceId, sortOrder });
}

// Listing resolves each pin to the full entity:
// - a pinned work comes back with EVERY work_update and each update's
//   media - the whole project's history, not frozen on one version, so
//   a new update posted after pinning shows up automatically.
// - a pinned event comes back with its event_media.
export async function get_showcase_items_for_user(userId: string) {
  const items = await list_showcase_items_for_user(userId);

  return Promise.all(
    items.map(async (item) => {
      if (item.event_id) {
        const event = await find_event_by_id(item.event_id);
        const media = event ? await list_event_media(event.id) : [];
        return {
          id: item.id,
          sourceType: 'event' as const,
          sortOrder: item.sort_order,
          createdAt: item.created_at,
          post: event
            ? {
                id: event.id,
                title: event.title,
                description: event.descriptions,
                media,
              }
            : null,
        };
      }

      const work = item.work_id ? await getWorkById(item.work_id) : null;
      const updates = work
        ? await Promise.all(
            (await getWorkUpdates(work.id)).map(async (update) => ({
              ...update,
              media: await getMediaForUpdate(update.id),
            })),
          )
        : [];
      return {
        id: item.id,
        sourceType: 'work' as const,
        sortOrder: item.sort_order,
        createdAt: item.created_at,
        post: work
          ? {
              id: work.id,
              description: work.description,
              updates,
            }
          : null,
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

  // Unpinning just deletes the pin row - the underlying event/work (and
  // its updates/media) is untouched.
  await delete_showcase_item(itemId);
}
