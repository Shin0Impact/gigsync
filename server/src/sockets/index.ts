import { randomUUID } from 'crypto';
import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { env } from '../config/env';
import { query } from '../config/db';
import {
  EmergencyStatusChangedPayload,
  SocketReceiveMessagePayload,
  SocketSendMessagePayload,
} from '../types';

// Owned by Dev 3 / Maher. Wires up the Socket.IO gateway described in design
// doc section 7: handshake auth, per-conversation rooms, and the
// send_message / receive_message / emergency_status_changed events.
//
// TEMPORARY AUTH: Kareem's /api/auth (bcrypt + JWT) isn't live yet, so the
// handshake currently trusts a plain `userId` string passed in
// `socket.handshake.auth.userId` instead of verifying a real JWT cookie.
// Everything downstream keys off `socket.data.userId`, so once JWT auth
// exists, only the io.use() block below needs to change - swap it for
// jwt.verify() against the access_token cookie, same as
// middleware/auth.middleware.ts does for REST routes.
export function initSocketServer(httpServer: HttpServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.clientOrigin,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const userId = socket.handshake.auth?.userId;
    if (!userId || typeof userId !== 'string') {
      next(new Error('Missing userId in socket handshake auth (placeholder until JWT is wired up)'));
      return;
    }
    socket.data.userId = userId;
    next();
  });

  io.on('connection', (socket) => {
    // eslint-disable-next-line no-console
    console.log(`[socket] connected: ${socket.id} (user ${socket.data.userId})`);

    socket.on('join_conversation', (conversationId: string) => {
      socket.join(conversationId);
    });

    socket.on('leave_conversation', (conversationId: string) => {
      socket.leave(conversationId);
    });

    socket.on(
      'send_message',
      async (payload: SocketSendMessagePayload, ack?: (message: SocketReceiveMessagePayload) => void) => {
        if (!payload?.conversationId || !payload?.content?.trim()) {
          socket.emit('socket_error', { message: 'conversationId and content are required' });
          return;
        }

        const message = await persistMessage(payload, socket.data.userId as string);
        io.to(payload.conversationId).emit('receive_message', message);
        ack?.(message);
      }
    );

    socket.on('disconnect', () => {
      // eslint-disable-next-line no-console
      console.log(`[socket] disconnected: ${socket.id}`);
    });
  });

  return io;
}

async function persistMessage(
  payload: SocketSendMessagePayload,
  senderId: string
): Promise<SocketReceiveMessagePayload> {
  try {
    const result = await query<{
      id: string;
      conversation_id: string;
      sender_id: string;
      content: string;
      is_read: boolean;
      created_at: string;
    }>(
      `INSERT INTO messages (conversation_id, sender_id, content)
       VALUES ($1, $2, $3)
       RETURNING id, conversation_id, sender_id, content, is_read, created_at`,
      [payload.conversationId, senderId, payload.content]
    );
    const row = result.rows[0];
    return {
      id: row.id,
      conversationId: row.conversation_id,
      senderId: row.sender_id,
      content: row.content,
      isRead: row.is_read,
      createdAt: row.created_at,
    };
  } catch (err) {
    // Expected for now: the `conversations` row this message points at
    // probably doesn't exist yet (POST /api/conversations isn't built), so
    // the foreign key insert fails. Fall back to an in-memory message so
    // real-time delivery can still be proven end-to-end today. Once
    // /api/conversations + the DB are both live, this catch block should
    // start disappearing from the logs - if it doesn't, something's wrong.
    // eslint-disable-next-line no-console
    console.warn('[socket] DB insert failed, using in-memory fallback message:', (err as Error).message);
    return {
      id: randomUUID(),
      conversationId: payload.conversationId,
      senderId,
      content: payload.content,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
  }
}

// Called from the REST layer (PATCH /api/artists/me/emergency-status, once
// Kareem builds it) to broadcast the change to every connected client so
// organizer-side emergency search views update live without a refresh.
export function broadcastEmergencyStatusChange(
  io: SocketIOServer,
  payload: EmergencyStatusChangedPayload
) {
  io.emit('emergency_status_changed', payload);
}
