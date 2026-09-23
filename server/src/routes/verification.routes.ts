import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware';
import {
  add_social_link_handler,
  get_id_document_view_url_handler,
  get_verification_status_handler,
  list_pending_verification_requests_handler,
  list_social_links_handler,
  request_id_document_upload_url_handler,
  review_verification_request_handler,
  submit_verification_request_handler,
} from '../controllers/verification.controller';

const router = Router();

// Card #82 - artist/organizer verification. Eligibility (>=1 social link,
// >=3 prior works/events, an uploaded ID document) is enforced in
// verification.service.ts, not here - this file is just auth/role gating.

// Social links are a placeholder for real OAuth connecting (not built
// yet) - for now, self-reported platform + URL, just enough to prove
// "has a social presence" at request time.
router.post('/social-links', requireAuth, add_social_link_handler);
router.get('/social-links/:userId', list_social_links_handler);

// ID document upload goes to a separate private R2 bucket (no public dev
// URL) - the returned objectKey is passed back in when submitting a
// request below.
router.post('/id-upload-url', requireAuth, request_id_document_upload_url_handler);

router.post('/requests', requireAuth, submit_verification_request_handler);
router.get('/status/:userId', get_verification_status_handler);

// Moderator queue - review endpoints, and the ID document view URL, are
// gated to moderator/admin only.
router.get('/requests', requireAuth, requireRole('moderator', 'admin'), list_pending_verification_requests_handler);
router.get(
  '/requests/:id/id-document',
  requireAuth,
  requireRole('moderator', 'admin'),
  get_id_document_view_url_handler,
);
router.patch('/requests/:id', requireAuth, requireRole('moderator', 'admin'), review_verification_request_handler);

export default router;
