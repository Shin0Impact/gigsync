import { pool } from '../config/db';
import {
  create_application,
  create_event,
  create_next_recurring_event,
  delete_event,
  find_application_by_id,
  find_event_by_id,
  list_applications_for_event,
  list_events,
  ListEventsFilters,
  update_application_status,
  update_event,
} from '../db/queries/events.queries';
import {
  calculate_next_occurrence,
  RecurringRule,
} from './recurrence.service';
import { ApplicationStatus, ArtistCategory, EventStatus } from '../types';

const VALID_CATEGORIES: ArtistCategory[] = [
  'painter',
  'photographer',
  'designer',
  'musician',
];

const VALID_STATUSES: EventStatus[] = [
  'open',
  'filled',
  'completed',
  'cancelled',
];

const VALID_RECURRING_RULES: RecurringRule[] = [
  'WEEKLY',
  'MONTHLY',
];

function validate_categories(
  categories: unknown,
): ArtistCategory[] | null {
  if (categories === undefined || categories === null) {
    return null;
  }

  if (!Array.isArray(categories)) {
    throw new Error('categoriesNeeded must be an array');
  }

  for (const category of categories) {
    if (!VALID_CATEGORIES.includes(category)) {
      throw new Error(`Invalid category: ${category}`);
    }
  }

  return categories as ArtistCategory[];
}

function validate_recurring_rule(
  rule: unknown,
): RecurringRule {
  if (
    typeof rule !== 'string' ||
    !VALID_RECURRING_RULES.includes(rule as RecurringRule)
  ) {
    throw new Error('Invalid recurring rule');
  }

  return rule as RecurringRule;
}

export interface CreateEventInput {
  title: string;
  description: string;
  startAt: string;
  endAt: string;
  venueName: string;
  location: { lat: number; lng: number };
  isRecurring?: boolean;
  recurringRule?: string | null;
  categoriesNeeded?: ArtistCategory[];
}

export async function create_event_for_organizer(
  organizerId: string,
  input: CreateEventInput,
) {
  const {
    title,
    description,
    startAt,
    endAt,
    venueName,
    location,
    isRecurring = false,
    recurringRule = null,
    categoriesNeeded,
  } = input;

  if (
    !title ||
    !description ||
    !startAt ||
    !endAt ||
    !venueName ||
    !location
  ) {
    throw new Error(
      'title, description, startAt, endAt, venueName, and location are required',
    );
  }

  if (
    typeof location.lat !== 'number' ||
    typeof location.lng !== 'number' ||
    Number.isNaN(location.lat) ||
    Number.isNaN(location.lng)
  ) {
    throw new Error('location must include numeric lat and lng');
  }

  if (
    new Date(endAt).getTime() <= new Date(startAt).getTime()
  ) {
    throw new Error('endAt must be after startAt');
  }

  const categories = validate_categories(categoriesNeeded);

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const event = await create_event(client, {
      organizerId,
      title,
      descriptions: description,
      startAt,
      endAt,
      venueName,
      lat: location.lat,
      lng: location.lng,
      isRecurring,
      recurringRule,
      categoriesNeeded: categories,
    });

    await client.query('COMMIT');

    return event;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function get_event(id: number) {
  const event = await find_event_by_id(id);

  if (!event) {
    throw new Error('Event not found');
  }

  return event;
}

/**
 * Generates the next occurrence of a recurring event.
 *
 * The current event is the source occurrence. Its own start/end times
 * and recurring rule are used to calculate the next occurrence.
 *
 * The new event is then created with the current event as its parent.
 *
 * Example:
 *
 * Event #1
 *   parent_event_id = NULL
 *          ↓
 * Event #2
 *   parent_event_id = #1
 *          ↓
 * Event #3
 *   parent_event_id = #2
 */
export async function generate_next_recurring_event(
  eventId: number,
) {
  const event = await find_event_by_id(eventId);

  if (!event) {
    throw new Error('Event not found');
  }

  if (!event.is_recurring) {
    throw new Error('Event is not recurring');
  }

  const recurringRule = validate_recurring_rule(
    event.recurring_rule,
  );

  const nextOccurrence = calculate_next_occurrence(
    event.start_at,
    event.end_at,
    recurringRule,
  );

  return create_next_recurring_event(
    event,
    nextOccurrence.startAt,
    nextOccurrence.endAt,
  );
}

export async function list_events_for_discovery(
  filters: ListEventsFilters,
) {
  if (
    filters.status &&
    !VALID_STATUSES.includes(filters.status)
  ) {
    throw new Error(`Invalid status: ${filters.status}`);
  }

  if (
    filters.category &&
    !VALID_CATEGORIES.includes(filters.category)
  ) {
    throw new Error(`Invalid category: ${filters.category}`);
  }

  return list_events(filters);
}

export interface UpdateEventInput {
  title?: string;
  description?: string;
  startAt?: string;
  endAt?: string;
  venueName?: string;
  location?: { lat: number; lng: number };
  isRecurring?: boolean;
  recurringRule?: string | null;
  status?: EventStatus;
  categoriesNeeded?: ArtistCategory[];
}

export async function update_event_for_organizer(
  organizerId: string,
  eventId: number,
  input: UpdateEventInput,
) {
  const event = await find_event_by_id(eventId);

  if (!event) {
    throw new Error('Event not found');
  }

  if (event.organizer_id !== organizerId) {
    throw new Error('You do not own this event');
  }

  if (
    input.status &&
    !VALID_STATUSES.includes(input.status)
  ) {
    throw new Error(`Invalid status: ${input.status}`);
  }

  const categories =
    input.categoriesNeeded !== undefined
      ? validate_categories(input.categoriesNeeded)
      : undefined;

  if (
    input.startAt !== undefined &&
    input.endAt !== undefined &&
    new Date(input.endAt).getTime() <=
      new Date(input.startAt).getTime()
  ) {
    throw new Error('endAt must be after startAt');
  }

  const updated = await update_event(eventId, {
    title: input.title,
    descriptions: input.description,
    startAt: input.startAt,
    endAt: input.endAt,
    venueName: input.venueName,
    lat: input.location?.lat,
    lng: input.location?.lng,
    isRecurring: input.isRecurring,
    recurringRule: input.recurringRule,
    status: input.status,
    categoriesNeeded: categories,
  });

  if (!updated) {
    throw new Error('Event not found');
  }

  return updated;
}

export async function delete_event_for_organizer(
  organizerId: string,
  eventId: number,
) {
  const event = await find_event_by_id(eventId);

  if (!event) {
    throw new Error('Event not found');
  }

  if (event.organizer_id !== organizerId) {
    throw new Error('You do not own this event');
  }

  await delete_event(eventId);
}

// --- applications ---------------------------------------------------------

export async function apply_to_event(
  artistId: string,
  eventId: number,
  coverNote?: string,
) {
  const event = await find_event_by_id(eventId);

  if (!event) {
    throw new Error('Event not found');
  }

  if (event.status !== 'open') {
    throw new Error('This event is not accepting applications');
  }

  if (event.organizer_id === artistId) {
    throw new Error('You cannot apply to your own event');
  }

  try {
    return await create_application(
      eventId,
      artistId,
      coverNote ?? null,
    );
  } catch (error) {
    // Postgres unique_violation on (event_id, artist_id)
    if (
      error instanceof Error &&
      'code' in error &&
      (error as { code: string }).code === '23505'
    ) {
      throw new Error(
        'You have already applied to this event',
      );
    }

    throw error;
  }
}

export async function list_applications_for_organizer(
  organizerId: string,
  eventId: number,
) {
  const event = await find_event_by_id(eventId);

  if (!event) {
    throw new Error('Event not found');
  }

  if (event.organizer_id !== organizerId) {
    throw new Error('You do not own this event');
  }

  return list_applications_for_event(eventId);
}

export async function update_application_status_for_organizer(
  organizerId: string,
  eventId: number,
  applicationId: string,
  status: ApplicationStatus,
) {
  if (status !== 'accepted' && status !== 'rejected') {
    throw new Error(
      "status must be 'accepted' or 'rejected'",
    );
  }

  const event = await find_event_by_id(eventId);

  if (!event) {
    throw new Error('Event not found');
  }

  if (event.organizer_id !== organizerId) {
    throw new Error('You do not own this event');
  }

  const application = await find_application_by_id(
    applicationId,
  );

  if (!application || application.event_id !== eventId) {
    throw new Error('Application not found');
  }

  if (application.status !== 'pending') {
    throw new Error(
      `Application has already been ${application.status}`,
    );
  }

  return update_application_status(applicationId, status);
}