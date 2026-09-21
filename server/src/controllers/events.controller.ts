import { Request, Response } from 'express';
import {
  apply_to_event,
  create_event_for_organizer,
  delete_event_for_organizer,
  get_event,
  list_applications_for_organizer,
  list_events_for_discovery,
  update_application_status_for_organizer,
  update_event_for_organizer,
} from '../services/events.service';

// Small helper: every :id / :appId param on these routes is either a
// numeric event id (bigint on the `event` table) or a UUID application id.
// Express gives us strings either way - this just centralizes the
// "not a valid id" 400 instead of repeating it in every handler.
export function parse_event_id(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

const NOT_FOUND_MESSAGES = ['Event not found', 'Application not found', 'Media not found'];
const FORBIDDEN_MESSAGES = ['You do not own this event', 'You cannot apply to your own event'];
const CONFLICT_MESSAGES = [
  'You have already applied to this event',
  'This event is not accepting applications',
];

export function handle_known_error(error: unknown, res: Response, fallback: string) {
  if (error instanceof Error) {
    if (NOT_FOUND_MESSAGES.includes(error.message)) {
      return res.status(404).json({ error: error.message });
    }
    if (FORBIDDEN_MESSAGES.includes(error.message)) {
      return res.status(403).json({ error: error.message });
    }
    if (CONFLICT_MESSAGES.includes(error.message) || error.message.startsWith('Application has already been')) {
      return res.status(409).json({ error: error.message });
    }
    // Everything else thrown by the service layer is a validation message
    // (missing fields, bad category, endAt <= startAt, etc.) - 400.
    if (
      error.message.includes('required') ||
      error.message.includes('Invalid') ||
      error.message.includes('must') ||
      error.message.includes('status must be')
    ) {
      return res.status(400).json({ error: error.message });
    }
  }

  console.error(fallback, error);
  return res.status(500).json({ error: fallback });
}

export async function create_event(req: Request, res: Response) {
  try {
    const event = await create_event_for_organizer(req.user!.userId, req.body);
    return res.status(201).json({ event });
  } catch (error) {
    return handle_known_error(error, res, 'Failed to create event');
  }
}

export async function list_events(req: Request, res: Response) {
  try {
    const { status, organizerId, category } = req.query;

    const events = await list_events_for_discovery({
      status: typeof status === 'string' ? (status as never) : undefined,
      organizerId: typeof organizerId === 'string' ? organizerId : undefined,
      category: typeof category === 'string' ? (category as never) : undefined,
    });

    return res.status(200).json({ events });
  } catch (error) {
    return handle_known_error(error, res, 'Failed to list events');
  }
}

export async function get_event_by_id(req: Request, res: Response) {
  const id = parse_event_id(req.params.id);

  if (id === null) {
    return res.status(400).json({ error: 'Invalid event id' });
  }

  try {
    const event = await get_event(id);
    return res.status(200).json({ event });
  } catch (error) {
    return handle_known_error(error, res, 'Failed to fetch event');
  }
}

export async function update_event_by_id(req: Request, res: Response) {
  const id = parse_event_id(req.params.id);

  if (id === null) {
    return res.status(400).json({ error: 'Invalid event id' });
  }

  try {
    const event = await update_event_for_organizer(req.user!.userId, id, req.body);
    return res.status(200).json({ event });
  } catch (error) {
    return handle_known_error(error, res, 'Failed to update event');
  }
}

export async function delete_event_by_id(req: Request, res: Response) {
  const id = parse_event_id(req.params.id);

  if (id === null) {
    return res.status(400).json({ error: 'Invalid event id' });
  }

  try {
    await delete_event_for_organizer(req.user!.userId, id);
    return res.status(204).send();
  } catch (error) {
    return handle_known_error(error, res, 'Failed to delete event');
  }
}

export async function apply(req: Request, res: Response) {
  const id = parse_event_id(req.params.id);

  if (id === null) {
    return res.status(400).json({ error: 'Invalid event id' });
  }

  try {
    const application = await apply_to_event(req.user!.userId, id, req.body?.coverNote);
    return res.status(201).json({ application });
  } catch (error) {
    return handle_known_error(error, res, 'Failed to apply to event');
  }
}

export async function list_applications(req: Request, res: Response) {
  const id = parse_event_id(req.params.id);

  if (id === null) {
    return res.status(400).json({ error: 'Invalid event id' });
  }

  try {
    const applications = await list_applications_for_organizer(req.user!.userId, id);
    return res.status(200).json({ applications });
  } catch (error) {
    return handle_known_error(error, res, 'Failed to list applications');
  }
}

export async function update_application(req: Request, res: Response) {
  const id = parse_event_id(req.params.id);

  if (id === null) {
    return res.status(400).json({ error: 'Invalid event id' });
  }

  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'status is required' });
  }

  try {
    const application = await update_application_status_for_organizer(
      req.user!.userId,
      id,
      req.params.appId,
      status,
    );
    return res.status(200).json({ application });
  } catch (error) {
    return handle_known_error(error, res, 'Failed to update application');
  }
}
