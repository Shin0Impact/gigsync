import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { get_upload_url } from '../controllers/media.controller';

const router = Router();

// POST /api/media/upload-url - request a pre-signed R2 PUT URL. Generic
// across features (events, artist showcases, ...) - callers pass a
// `folder` (e.g. "events") so objects land somewhere sane in the bucket;
// defaults to "uploads" if omitted.
router.post('/upload-url', requireAuth, get_upload_url);

router.post('/showcases', requireAuth, async (_req, res) => {
  res.status(501).json({ error: 'Not implemented: POST /api/showcases' });
});

router.delete('/showcases/:id', requireAuth, async (_req, res) => {
  res.status(501).json({ error: 'Not implemented: DELETE /api/showcases/:id' });
});

export default router;
