import { Request, Response } from 'express';
import { get_messages, list_conversations, start_conversation } from '../services/conversations.service';
import {
  ErrorResponse,
  ListConversationsResponse,
  ListMessagesResponse,
  StartConversationResponse,
} from '../types';

function handle_known_error(error: unknown, res: Response, fallback: string) {
  if (error instanceof Error) {
    if (error.message === 'User not found') {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === 'Not a participant of this conversation') {
      return res.status(403).json({ error: error.message });
    }
    if (
      error.message.includes('required') ||
      error.message === 'Cannot start a conversation with yourself'
    ) {
      return res.status(400).json({ error: error.message });
    }
  }

  // eslint-disable-next-line no-console
  console.error(fallback, error);
  return res.status(500).json({ error: fallback });
}

// GET /api/conversations - every conversation the signed-in user is a
// participant of, newest activity first. This is the "inbox" list.
export async function list_conversations_handler(
  req: Request,
  res: Response<ListConversationsResponse | ErrorResponse>,
) {
  try {
    const conversations = await list_conversations(req.user!.userId);
    return res.status(200).json({ conversations });
  } catch (error) {
    return handle_known_error(error, res, 'Failed to list conversations');
  }
}

// POST /api/conversations { otherUserId } - starts (or reuses) a direct
// conversation with another user. See start_conversation: calling this
// again for the same two people returns the same conversation id, so the
// "Message" button on a profile always opens the one ongoing thread with
// that person rather than forking a new one.
export async function start_conversation_handler(
  req: Request<Record<string, never>, unknown, { otherUserId?: string }>,
  res: Response<StartConversationResponse | ErrorResponse>,
) {
  try {
    const conversation = await start_conversation(req.user!.userId, req.body.otherUserId ?? '');
    return res.status(200).json({ conversation });
  } catch (error) {
    return handle_known_error(error, res, 'Failed to start conversation');
  }
}

// GET /api/conversations/:id/messages?limit=&offset= - message history
// for one conversation, oldest first. The live tail (messages sent after
// a client has this thread open) arrives over the socket's
// receive_message event instead (see sockets/index.ts) - this endpoint is
// only for the initial load / scrolling further back.
export async function get_messages_handler(
  req: Request<{ id: string }, unknown, unknown, { limit?: string; offset?: string }>,
  res: Response<ListMessagesResponse | ErrorResponse>,
) {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const offset = req.query.offset ? Number(req.query.offset) : undefined;
    const messages = await get_messages(req.user!.userId, req.params.id, limit, offset);
    return res.status(200).json({ messages });
  } catch (error) {
    return handle_known_error(error, res, 'Failed to get messages');
  }
}
