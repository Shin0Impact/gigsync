import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { get_upload_url } from '../controllers/media.controller';
import { add_showcase, delete_showcase, list_showcase } from '../controllers/showcase.controller';

const router = Router();

// POST /api/media/upload-url - request a pre-signed R2 PUT URL. Generic
// across features (events, artist showcases, ...) - callers pass a
// `folder` (e.g. "events") so objects land somewhere sane in the bucket;
// defaults to "uploads" if omitted.
router.post('/upload-url', requireAuth, get_upload_url);

// Showcase items (card #78) are a PIN, not an upload: a user stars an
// event_media or update_media row they already own onto their profile
// (self-ownership only - see showcase.service.ts). No /upload-url step
// here, since showcasing never creates a new R2 object - it just
// references one that's already been uploaded via the events or works
// endpoints. Any authenticated user can pin (an organizer pins their own
// event media, an artist pins their own work media), so this isn't
// artist-only the way it originally was.
router.post('/showcases', requireAuth, add_showcase);
router.get('/showcases/:userId', list_showcase);
router.delete('/showcases/:id', requireAuth, delete_showcase);

export default router;
