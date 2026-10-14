import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware';
import {
  get_emergency_status_handler,
  list_emergency_available_handler,
  search_artists_handler,
  update_emergency_status_handler,
} from '../controllers/artists.controller';
import {
  add_availability_handler,
  get_availability_handler,
  remove_availability_handler,
} from '../controllers/availability.controller';

const router = Router();

// GET /api/artists/search?lat=&lng=&radius_km=&artists_type=
// PostGIS radius query (ST_DWithin / ST_Distance) centered on whatever
// location the caller picked (a map pin, a geocoded address, their own
// geolocation) - artists_type is optional and narrows by category
// (painter/photographer/designer/musician). Public, same reasoning as
// /emergency-available below: browsing the artist directory shouldn't
// require being signed in.
router.get('/search', search_artists_handler);

// GET /api/artists/emergency-available?lat=&lng=&radius_km=
// Public (like other listing endpoints in this codebase) - organizers
// don't need to be authenticated just to see who's currently available.
router.get('/emergency-available', list_emergency_available_handler);

// GET /api/artists/:userId/emergency-status - read one artist's current
// emergency status (not just search results). Public for the same reason
// as above.
router.get('/:userId/emergency-status', get_emergency_status_handler);

// PATCH /api/artists/me/emergency-status
// Broadcasts emergency_status_changed via Socket.IO (see
// sockets/index.ts + artists.service.ts) so organizer-side emergency
// search views update live without a refresh.
router.patch('/me/emergency-status', requireAuth, requireRole('artist'), update_emergency_status_handler);

// Card #26 - the availability calendar tab on an artist's profile.
//
// GET /api/artists/:userId/availability - all of one artist's marked-
// available days. Public, same reasoning as emergency-status/search
// above: anyone viewing a profile should see this without signing in.
router.get('/:userId/availability', get_availability_handler);

// POST /api/artists/me/availability { date } - mark one day available.
// One call per day tapped on the calendar, not a bulk replace - see
// availability.controller.ts.
router.post('/me/availability', requireAuth, requireRole('artist'), add_availability_handler);

// DELETE /api/artists/me/availability/:date - un-mark one day.
router.delete('/me/availability/:date', requireAuth, requireRole('artist'), remove_availability_handler);

export default router;
