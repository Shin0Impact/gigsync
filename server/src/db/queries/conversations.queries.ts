import { query } from '../../config/db';

// No REST layer for conversations exists yet (POST /api/conversations is
// still a 501 stub), but the Socket.IO gateway is live and needs this now:
// join_conversation/send_message must only work for a conversation the
// connected user actually belongs to, per the conversation_participants
// join table in schema.sql (composite PK on (conversation_id, user_id) -
// there's no participantIds array column on the row itself, that's just
// the denormalized shape IConversation exposes in types/index.ts).
export async function isConversationParticipant(
  conversationId: string,
  userId: string
): Promise<boolean> {
  const result = await query(
    'SELECT 1 FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2 LIMIT 1',
    [conversationId, userId]
  );
  return (result.rowCount ?? 0) > 0;
}
