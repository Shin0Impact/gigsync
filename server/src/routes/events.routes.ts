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

export default router;
