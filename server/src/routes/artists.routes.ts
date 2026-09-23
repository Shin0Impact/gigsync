import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware';
import {
  get_emergency_status_handler,
  list_emergency_available_handler,
  update_emergency_status_handler,
} from '../controllers/artists.controller';

const router = Router();

// GET /api/artists/search?category_id=&lat=&lng=&radius_km=
// PostGIS radius query (ST_DWithin / ST_DistanceSphere) - see design doc
// section 6 for the reference SQL. Board card #24 - not this pass.
router.get('/search', async (_req, res) => {
  res.status(501).json({ error: 'Not implemented: GET /api/artists/search' });
});

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

export default router;
