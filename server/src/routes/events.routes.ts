import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.post('/', requireAuth, requireRole('organizer'), async (_req, res) => {
  res.status(501).json({ error: 'Not implemented: POST /api/events' });
});

router.get('/', async (_req, res) => {
  res.status(501).json({ error: 'Not implemented: GET /api/events' });
});

router.post('/:id/apply', requireAuth, requireRole('artist'), async (_req, res) => {
  res.status(501).json({ error: 'Not implemented: POST /api/events/:id/apply' });
});

router.patch('/:id/applications/:appId', requireAuth, requireRole('organizer'), async (_req, res) => {
  res.status(501).json({ error: 'Not implemented: PATCH /api/events/:id/applications/:appId' });
});

export default router;
