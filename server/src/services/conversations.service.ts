import { pool } from '../config/db';
import {
  createDirectConversation,
  findDirectConversationBetween,
  getMessagesForConversation,
  isConversationParticipant,
  listConversationsForUser,
} from '../db/queries/conversations.queries';

// Card #34 - direct messaging. The socket gateway (sockets/index.ts)
// already handles live delivery and persistence of individual messages;
// this service covers the two things a socket connection can't: finding
// out what conversations/history exist in the first place.

async function assert_user_exists(userId: string): Promise<void> {
  const result = await pool.query('SELECT 1 FROM users WHERE id = $1 LIMIT 1', [userId]);
  if ((result.rowCount ?? 0) === 0) {
    throw new Error('User not found');
  }
}

// Starts (or reuses) a direct conversation with another user. Idempotent
// by design - calling this again for the same pair of users returns the
// same conversation id instead of creating a duplicate thread, so the
// "Message" button on a profile always lands on the one ongoing
// conversation with that person.
export async function start_conversation(userId: string, otherUserId: string) {
  if (!otherUserId) {
    throw new Error('otherUserId is required');
  }

  if (otherUserId === userId) {
    throw new Error('Cannot start a conversation with yourself');
  }

  await assert_user_exists(otherUserId);

  const existing = await findDirectConversationBetween(userId, otherUserId);
  if (existing) {
    return { id: existing.id, createdAt: existing.created_at };
  }

  const conversation = await createDirectConversation(userId, otherUserId);
  return { id: conversation.id, createdAt: conversation.created_at };
}

export async function list_conversations(userId: string) {
  const rows = await listConversationsForUser(userId);

  return rows.map((row) => ({
    id: row.id,
    otherParticipant: row.other_user_id
      ? {
          userId: row.other_user_id,
          userName: row.other_user_name ?? 'Unknown',
          avatarUrl: row.other_avatar_url,
        }
      : null,
    lastMessage: row.last_message_content
      ? {
          content: row.last_message_content,
          senderId: row.last_message_sender_id as string,
          createdAt: row.last_message_created_at as string,
        }
      : null,
    updatedAt: row.updated_at,
  }));
}

const MESSAGES_PAGE_SIZE = 30;
const MAX_MESSAGES_PAGE_SIZE = 100;

function clamp_limit(requested: number | undefined): number {
  if (!requested || !Number.isFinite(requested) || requested <= 0) {
    return MESSAGES_PAGE_SIZE;
  }
  return Math.min(requested, MAX_MESSAGES_PAGE_SIZE);
}

// Membership-gated the same way the socket gateway gates join_conversation
// / send_message (see isConversationParticipant's usage there) - loading
// history for a conversation you're not part of should fail the same way
// joining its room over the socket does.
export async function get_messages(
  userId: string,
  conversationId: string,
  limit?: number,
  offset?: number,
) {
  if (!conversationId) {
    throw new Error('conversationId is required');
  }

  const participant = await isConversationParticipant(conversationId, userId);
  if (!participant) {
    throw new Error('Not a participant of this conversation');
  }

  const rows = await getMessagesForConversation(
    conversationId,
    clamp_limit(limit),
    Math.max(0, offset ?? 0),
  );

  // Fetched newest-first (see getMessagesForConversation) so pagination
  // pages backwards through history cheaply - reversed here so the
  // response itself reads oldest -> newest like an actual thread.
  return rows.reverse().map((row) => ({
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    content: row.content,
    isRead: row.is_read,
    createdAt: row.created_at,
  }));
}
