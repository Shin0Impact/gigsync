import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware';
import {
  apply,
  create_event,
  delete_event_by_id,
  get_event_by_id,
  list_applications,
  list_events,
  update_application,
  update_event_by_id,
} from '../controllers/events.controller';
import { add_media, delete_media, list_media } from '../controllers/event_media.controller';

const router = Router();

// Card #23 - Event CRUD + application endpoints.
router.post('/', requireAuth, requireRole('organizer'), create_event);
router.get('/', list_events);
router.get('/:id', get_event_by_id);
router.patch('/:id', requireAuth, requireRole('organizer'), update_event_by_id);
router.delete('/:id', requireAuth, requireRole('organizer'), delete_event_by_id);

router.post('/:id/apply', requireAuth, requireRole('artist'), apply);
router.get('/:id/applications', requireAuth, requireRole('organizer'), list_applications);
router.patch('/:id/applications/:appId', requireAuth, requireRole('organizer'), update_application);

// Event media - flyer/photos/video attached to an event. Uploading the
// actual file happens against R2 directly (see POST /api/media/upload-url);
// these just record/list/remove the resulting objectKey against an event.
router.post('/:id/media', requireAuth, requireRole('organizer'), add_media);
router.get('/:id/media', list_media);
router.delete('/:id/media/:mediaId', requireAuth, requireRole('organizer'), delete_media);

export default router;
