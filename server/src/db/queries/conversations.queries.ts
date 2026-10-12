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
export interface DbMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface DbConversationSummary {
  id: string;
  other_user_id: string | null;
  other_user_name: string | null;
  other_avatar_url: string | null;
  last_message_content: string | null;
  last_message_sender_id: string | null;
  last_message_created_at: string | null;
  updated_at: string;
}

// Finds an existing direct (non-event) conversation between exactly these
// two users, if one exists - used so tapping "Message" on the same
// person's profile twice reuses the one ongoing thread instead of
// spawning a new conversation row every time.
export async function findDirectConversationBetween(
  userIdA: string,
  userIdB: string,
): Promise<{ id: string; created_at: string } | null> {
  const result = await query<{ id: string; created_at: string }>(
    `
      SELECT c.id, c.created_at
      FROM conversations c
      WHERE EXISTS (
          SELECT 1 FROM conversation_participants cp
          WHERE cp.conversation_id = c.id AND cp.user_id = $1
        )
        AND EXISTS (
          SELECT 1 FROM conversation_participants cp
          WHERE cp.conversation_id = c.id AND cp.user_id = $2
        )
        AND (
          SELECT COUNT(*) FROM conversation_participants cp
          WHERE cp.conversation_id = c.id
        ) = 2
      LIMIT 1
    `,
    [userIdA, userIdB],
  );

  return result.rows[0] ?? null;
}

export async function createDirectConversation(
  userIdA: string,
  userIdB: string,
): Promise<{ id: string; created_at: string }> {
  const conversationResult = await query<{ id: string; created_at: string }>(
    'INSERT INTO conversations DEFAULT VALUES RETURNING id, created_at',
  );
  const conversation = conversationResult.rows[0];

  await query(
    'INSERT INTO conversation_participants (conversation_id, user_id) VALUES ($1, $2), ($1, $3)',
    [conversation.id, userIdA, userIdB],
  );

  return conversation;
}

// One row per conversation the user is in, paired with the OTHER
// participant (DM-shaped - a thread with more than two people, e.g. a
// future group/event conversation, would need a different summary shape,
// but nothing creates those yet) and that conversation's most recent
// message, newest activity first.
export async function listConversationsForUser(userId: string): Promise<DbConversationSummary[]> {
  const result = await query<DbConversationSummary>(
    `
      SELECT
        c.id,
        other_user.id AS other_user_id,
        p.user_name AS other_user_name,
        p.avatar_url AS other_avatar_url,
        last_msg.content AS last_message_content,
        last_msg.sender_id AS last_message_sender_id,
        last_msg.created_at AS last_message_created_at,
        COALESCE(last_msg.created_at, c.created_at) AS updated_at
      FROM conversation_participants me
      JOIN conversations c ON c.id = me.conversation_id
      LEFT JOIN conversation_participants other_cp
        ON other_cp.conversation_id = c.id AND other_cp.user_id != me.user_id
      LEFT JOIN users other_user ON other_user.id = other_cp.user_id
      LEFT JOIN profiles p ON p.user_id = other_user.id
      LEFT JOIN LATERAL (
        SELECT content, sender_id, created_at
        FROM messages m
        WHERE m.conversation_id = c.id
        ORDER BY m.created_at DESC
        LIMIT 1
      ) last_msg ON true
      WHERE me.user_id = $1
      ORDER BY updated_at DESC
    `,
    [userId],
  );

  return result.rows;
}

// Newest-first (see get_messages in conversations.service.ts, which
// reverses this for display) so a plain LIMIT/OFFSET pages backwards
// through history - the common case (open a thread, see the most recent
// messages) is the cheap default rather than requiring the caller to
// already know how many messages exist.
export async function getMessagesForConversation(
  conversationId: string,
  limit: number,
  offset: number,
): Promise<DbMessage[]> {
  const result = await query<DbMessage>(
    `
      SELECT id, conversation_id, sender_id, content, is_read, created_at
      FROM messages
      WHERE conversation_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `,
    [conversationId, limit, offset],
  );

  return result.rows;
}
