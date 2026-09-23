import { Request, Response } from 'express';
import {
  add_showcase_item,
  get_showcase_items_for_user,
  remove_showcase_item,
} from '../services/showcase.service';

const NOT_FOUND_MESSAGES = ['Showcase item not found', 'Source media not found'];
const FORBIDDEN_MESSAGES = ['You do not own this showcase item', 'You do not own this media'];
const CONFLICT_MESSAGES = ['This media is already pinned'];

function handle_known_error(error: unknown, res: Response, fallback: string) {
  if (error instanceof Error) {
    if (NOT_FOUND_MESSAGES.includes(error.message)) {
      return res.status(404).json({ error: error.message });
    }
    if (FORBIDDEN_MESSAGES.includes(error.message)) {
      return res.status(403).json({ error: error.message });
    }
    if (CONFLICT_MESSAGES.includes(error.message) || error.message.startsWith('You can only pin')) {
      return res.status(409).json({ error: error.message });
    }
    if (error.message.includes('required') || error.message.startsWith('Invalid sourceType')) {
      return res.status(400).json({ error: error.message });
    }
  }

  console.error(fallback, error);
  return res.status(500).json({ error: fallback });
}

export async function add_showcase(req: Request, res: Response) {
  try {
    const item = await add_showcase_item(req.user!.userId, req.body);
    return res.status(201).json({ item });
  } catch (error) {
    return handle_known_error(error, res, 'Failed to pin showcase item');
  }
}

export async function list_showcase(req: Request, res: Response) {
  try {
    const items = await get_showcase_items_for_user(req.params.userId);
    return res.status(200).json({ items });
  } catch (error) {
    return handle_known_error(error, res, 'Failed to list showcase items');
  }
}

export async function delete_showcase(req: Request, res: Response) {
  try {
    await remove_showcase_item(req.user!.userId, req.params.id);
    return res.status(204).send();
  } catch (error) {
    return handle_known_error(error, res, 'Failed to unpin showcase item');
  }
}
