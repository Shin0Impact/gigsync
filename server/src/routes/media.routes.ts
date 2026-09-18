import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// POST /api/media/upload-url - request a pre-signed R2 PUT URL.
router.post('/upload-url', requireAuth, async (_req, res) => {
  res.status(501).json({ error: 'Not implemented: POST /api/media/upload-url' });
});

router.post('/showcases', requireAuth, async (_req, res) => {
  res.status(501).json({ error: 'Not implemented: POST /api/showcases' });
});

router.delete('/showcases/:id', requireAuth, async (_req, res) => {
  res.status(501).json({ error: 'Not implemented: DELETE /api/showcases/:id' });
});

export default router;
