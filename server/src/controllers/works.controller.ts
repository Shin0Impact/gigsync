import { Request, Response } from 'express';
import {
  add_update_media,
  add_work_update,
  create_work,
  get_media_for_update,
  get_updates_for_work,
  get_works_for_user,
  remove_update_media,
} from '../services/works.service';

const NOT_FOUND_MESSAGES = ['Work not found', 'Work update not found', 'Media not found'];
const FORBIDDEN_MESSAGES = ['You do not own this work'];

function handle_known_error(error: unknown, res: Response, fallback: string) {
  if (error instanceof Error) {
    if (NOT_FOUND_MESSAGES.includes(error.message)) {
      return res.status(404).json({ error: error.message });
    }
    if (FORBIDDEN_MESSAGES.includes(error.message)) {
      return res.status(403).json({ error: error.message });
    }
    if (error.message.includes('required') || error.message.startsWith('Invalid mediaType')) {
      return res.status(400).json({ error: error.message });
    }
  }

  console.error(fallback, error);
  return res.status(500).json({ error: fallback });
}

function parse_id(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function create_work_handler(req: Request, res: Response) {
  try {
    const work = await create_work(req.user!.userId, req.body?.description ?? null);
    return res.status(201).json({ work });
  } catch (error) {
    return handle_known_error(error, res, 'Failed to create work');
  }
}

export async function list_works_handler(req: Request, res: Response) {
  const works = await get_works_for_user(req.params.userId);
  return res.status(200).json({ works });
}

export async function add_work_update_handler(req: Request, res: Response) {
  const workId = parse_id(req.params.workId);
  if (workId === null) {
    return res.status(400).json({ error: 'Invalid work id' });
  }
  try {
    const update = await add_work_update(req.user!.userId, workId, req.body?.description ?? null);
    return res.status(201).json({ update });
  } catch (error) {
    return handle_known_error(error, res, 'Failed to add work update');
  }
}

export async function list_work_updates_handler(req: Request, res: Response) {
  const workId = parse_id(req.params.workId);
  if (workId === null) {
    return res.status(400).json({ error: 'Invalid work id' });
  }
  try {
    const updates = await get_updates_for_work(workId);
    return res.status(200).json({ updates });
  } catch (error) {
    return handle_known_error(error, res, 'Failed to list work updates');
  }
}

export async function add_update_media_handler(req: Request, res: Response) {
  const updateId = parse_id(req.params.updateId);
  if (updateId === null) {
    return res.status(400).json({ error: 'Invalid update id' });
  }
  try {
    const media = await add_update_media(req.user!.userId, updateId, req.body);
    return res.status(201).json({ media });
  } catch (error) {
    return handle_known_error(error, res, 'Failed to add update media');
  }
}

export async function list_update_media_handler(req: Request, res: Response) {
  const updateId = parse_id(req.params.updateId);
  if (updateId === null) {
    return res.status(400).json({ error: 'Invalid update id' });
  }
  try {
    const media = await get_media_for_update(updateId);
    return res.status(200).json({ media });
  } catch (error) {
    return handle_known_error(error, res, 'Failed to list update media');
  }
}

export async function delete_update_media_handler(req: Request, res: Response) {
  const updateId = parse_id(req.params.updateId);
  const mediaId = parse_id(req.params.mediaId);
  if (updateId === null || mediaId === null) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  try {
    await remove_update_media(req.user!.userId, updateId, mediaId);
    return res.status(204).send();
  } catch (error) {
    return handle_known_error(error, res, 'Failed to delete update media');
  }
}
