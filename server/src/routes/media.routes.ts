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

// Showcase items (card #78) pin a whole PROJECT or EVENT - a `work` or
// an `event` - not a single post/media file, onto the pinning user's
// profile (self-ownership only, see showcase.service.ts). A work has
// many versions over time, so pinning the work itself (rather than one
// work_update) means the showcase always reflects its current state. The
// list response resolves each pin to the full entity: a pinned work
// comes back with every update and all their media, a pinned event with
// its event_media. No /upload-url step here; showcasing never creates a
// new R2 object, it just references something already created via the
// events or works endpoints.
router.post('/showcases', requireAuth, add_showcase);
router.get('/showcases/:userId', list_showcase);
router.delete('/showcases/:id', requireAuth, delete_showcase);

export default router;
