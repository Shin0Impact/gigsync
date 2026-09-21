import { Request, Response } from 'express';
import {
  add_event_media,
  get_event_media_list,
  remove_event_media,
} from '../services/event_media.service';
import { handle_known_error, parse_event_id } from './events.controller';

export async function add_media(req: Request, res: Response) {
  const eventId = parse_event_id(req.params.id);

  if (eventId === null) {
    return res.status(400).json({ error: 'Invalid event id' });
  }

  try {
    const media = await add_event_media(req.user!.userId, eventId, req.body);
    return res.status(201).json({ media });
  } catch (error) {
    return handle_known_error(error, res, 'Failed to add event media');
  }
}

export async function list_media(req: Request, res: Response) {
  const eventId = parse_event_id(req.params.id);

  if (eventId === null) {
    return res.status(400).json({ error: 'Invalid event id' });
  }

  try {
    const media = await get_event_media_list(eventId);
    return res.status(200).json({ media });
  } catch (error) {
    return handle_known_error(error, res, 'Failed to list event media');
  }
}

export async function delete_media(req: Request, res: Response) {
  const eventId = parse_event_id(req.params.id);

  if (eventId === null) {
    return res.status(400).json({ error: 'Invalid event id' });
  }

  try {
    await remove_event_media(req.user!.userId, eventId, req.params.mediaId);
    return res.status(204).send();
  } catch (error) {
    return handle_known_error(error, res, 'Failed to delete event media');
  }
}
