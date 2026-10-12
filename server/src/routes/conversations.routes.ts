import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import {
  get_messages_handler,
  list_conversations_handler,
  start_conversation_handler,
} from '../controllers/conversations.controller';

const router = Router();

// GET /api/conversations - the signed-in user's inbox (conversation list).
router.get('/', requireAuth, list_conversations_handler);

// POST /api/conversations { otherUserId } - start or reuse a direct
// conversation with another user.
router.post('/', requireAuth, start_conversation_handler);

// GET /api/conversations/:id/messages?limit=&offset= - message history for
// one conversation. Live messages after that arrive over Socket.IO (see
// sockets/index.ts's receive_message event), not by polling this.
router.get('/:id/messages', requireAuth, get_messages_handler);

export default router;
