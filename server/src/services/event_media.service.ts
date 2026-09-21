import { find_event_by_id } from '../db/queries/events.queries';
import {
  create_event_media,
  delete_event_media,
  find_event_media_by_id,
  list_event_media,
} from '../db/queries/event_media.queries';

const VALID_MEDIA_TYPES = ['image', 'video'];

export interface AddEventMediaInput {
  mediaType: string;
  objectKey: string;
  altText?: string | null;
  sortOrder?: number;
}

export async function add_event_media(
  organizerId: string,
  eventId: number,
  input: AddEventMediaInput,
) {
  const event = await find_event_by_id(eventId);

  if (!event) {
    throw new Error('Event not found');
  }

  if (event.organizer_id !== organizerId) {
    throw new Error('You do not own this event');
  }

  const { mediaType, objectKey, altText = null, sortOrder = 0 } = input;

  if (!mediaType || !objectKey) {
    throw new Error('mediaType and objectKey are required');
  }

  if (!VALID_MEDIA_TYPES.includes(mediaType)) {
    throw new Error(`Invalid mediaType: ${mediaType}`);
  }

  return create_event_media({
    eventId,
    mediaType,
    objectKey,
    altText,
    sortOrder,
  });
}

export async function get_event_media_list(eventId: number) {
  const event = await find_event_by_id(eventId);

  if (!event) {
    throw new Error('Event not found');
  }

  return list_event_media(eventId);
}

export async function remove_event_media(
  organizerId: string,
  eventId: number,
  mediaId: string,
) {
  const event = await find_event_by_id(eventId);

  if (!event) {
    throw new Error('Event not found');
  }

  if (event.organizer_id !== organizerId) {
    throw new Error('You do not own this event');
  }

  const media = await find_event_media_by_id(mediaId);

  if (!media || media.event_id !== eventId) {
    throw new Error('Media not found');
  }

  await delete_event_media(mediaId);
}
