import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.post('/', requireAuth, async (_req, res) => {
  res.status(501).json({ error: 'Not implemented: POST /api/conversations' });
});

router.get('/:id/messages', requireAuth, async (_req, res) => {
  res.status(501).json({ error: 'Not implemented: GET /api/conversations/:id/messages' });
});

export default router;
