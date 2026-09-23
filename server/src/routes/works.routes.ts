import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware';
import {
  add_update_media_handler,
  add_work_update_handler,
  create_work_handler,
  delete_update_media_handler,
  list_update_media_handler,
  list_work_updates_handler,
  list_works_handler,
} from '../controllers/works.controller';

const router = Router();

// "Works" - an artist's portfolio (card #78 follow-up). A Work is a
// project; each Work has versioned Updates (progress posts); each Update
// can carry R2-backed media (same two-step upload-url flow as event media
// and showcases). Likes/comments/follows stay out of scope for now - see
// server/src/db/social.queries.ts for the read-only scaffolding Kareem
// already has for those.
router.post('/', requireAuth, requireRole('artist'), create_work_handler);
router.get('/:userId', list_works_handler);

router.post('/:workId/updates', requireAuth, requireRole('artist'), add_work_update_handler);
router.get('/:workId/updates', list_work_updates_handler);

router.post('/updates/:updateId/media', requireAuth, requireRole('artist'), add_update_media_handler);
router.get('/updates/:updateId/media', list_update_media_handler);
router.delete('/updates/:updateId/media/:mediaId', requireAuth, requireRole('artist'), delete_update_media_handler);

export default router;
