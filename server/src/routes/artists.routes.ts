import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware';

const router = Router();

// GET /api/artists/search?category_id=&lat=&lng=&radius_km=
// PostGIS radius query (ST_DWithin / ST_DistanceSphere) - see design doc
// section 6 for the reference SQL. Owned by Dev 2.
router.get('/search', async (_req, res) => {
  res.status(501).json({ error: 'Not implemented: GET /api/artists/search' });
});

// GET /api/artists/emergency-available?lat=&lng=&radius_km=
router.get('/emergency-available', async (_req, res) => {
  res.status(501).json({ error: 'Not implemented: GET /api/artists/emergency-available' });
});

// PATCH /api/artists/me/emergency-status
// TODO: after updating the DB row, call broadcastEmergencyStatusChange(io, {...})
// from '../sockets' so organizer-side views update live. The socket gateway
// side of this is already implemented.
router.patch('/me/emergency-status', requireAuth, requireRole('artist'), async (_req, res) => {
  res.status(501).json({ error: 'Not implemented: PATCH /api/artists/me/emergency-status' });
});

export default router;
