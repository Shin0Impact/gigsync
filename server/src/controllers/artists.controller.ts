import { Request, Response } from 'express';
import {
  get_emergency_status,
  search_emergency_available,
  set_emergency_status,
} from '../services/artists.service';

const NOT_FOUND_MESSAGES = ['Profile not found'];

function handle_known_error(error: unknown, res: Response, fallback: string) {
  if (error instanceof Error) {
    if (NOT_FOUND_MESSAGES.includes(error.message)) {
      return res.status(404).json({ error: error.message });
    }
    if (
      error.message.includes('required') ||
      error.message.includes('out of range') ||
      error.message.includes('must be')
    ) {
      return res.status(400).json({ error: error.message });
    }
  }

  console.error(fallback, error);
  return res.status(500).json({ error: fallback });
}

export async function update_emergency_status_handler(req: Request, res: Response) {
  try {
    const status = await set_emergency_status(req.user!.userId, req.body);
    return res.status(200).json({ status });
  } catch (error) {
    return handle_known_error(error, res, 'Failed to update emergency status');
  }
}

export async function get_emergency_status_handler(req: Request, res: Response) {
  try {
    const status = await get_emergency_status(req.params.userId);
    return res.status(200).json({ status });
  } catch (error) {
    return handle_known_error(error, res, 'Failed to get emergency status');
  }
}

export async function list_emergency_available_handler(req: Request, res: Response) {
  try {
    const { lat, lng, radius_km } = req.query;

    const artists = await search_emergency_available({
      lat: Number(lat),
      lng: Number(lng),
      radiusKm: Number(radius_km),
    });

    return res.status(200).json({ artists });
  } catch (error) {
    return handle_known_error(error, res, 'Failed to search emergency-available artists');
  }
}
