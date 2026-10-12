import { Request, Response } from 'express';
import { add_availability, list_availability, remove_availability } from '../services/availability.service';
import { AddAvailabilityResponse, ErrorResponse, ListAvailabilityResponse } from '../types';

function handle_known_error(error: unknown, res: Response, fallback: string) {
  if (error instanceof Error) {
    if (
      error.message.includes('required') ||
      error.message.includes('must be') ||
      error.message.includes('not a valid')
    ) {
      return res.status(400).json({ error: error.message });
    }
  }

  // eslint-disable-next-line no-console
  console.error(fallback, error);
  return res.status(500).json({ error: fallback });
}

// GET /api/artists/:userId/availability - public, same reasoning as the
// other artist-listing endpoints (emergency-status, search): visitors
// and organizers browsing a profile shouldn't need to be signed in just
// to see which days an artist has marked themselves available.
export async function get_availability_handler(
  req: Request<{ userId: string }>,
  res: Response<ListAvailabilityResponse | ErrorResponse>,
) {
  try {
    const dates = await list_availability(req.params.userId);
    return res.status(200).json({ dates });
  } catch (error) {
    return handle_known_error(error, res, 'Failed to get availability');
  }
}

// POST /api/artists/me/availability { date: "YYYY-MM-DD" } - one call per
// day tapped on (see AvailabilityCalendar.tsx), not a bulk replace - the
// calendar's onSelect already tells the frontend exactly which single
// day was toggled, so there's no need for the backend to diff a whole
// array against what's already stored.
export async function add_availability_handler(
  req: Request<Record<string, never>, unknown, { date?: string }>,
  res: Response<AddAvailabilityResponse | ErrorResponse>,
) {
  try {
    const date = await add_availability(req.user!.userId, req.body.date ?? '');
    return res.status(200).json({ date });
  } catch (error) {
    return handle_known_error(error, res, 'Failed to add availability date');
  }
}

// DELETE /api/artists/me/availability/:date
export async function remove_availability_handler(
  req: Request<{ date: string }>,
  res: Response<{ success: true } | ErrorResponse>,
) {
  try {
    await remove_availability(req.user!.userId, req.params.date);
    return res.status(200).json({ success: true });
  } catch (error) {
    return handle_known_error(error, res, 'Failed to remove availability date');
  }
}
