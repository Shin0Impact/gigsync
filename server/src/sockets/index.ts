import { randomUUID } from 'crypto';
import { Server as HttpServer } from 'http';
import { parse as parseCookie } from 'cookie';
import jwt from 'jsonwebtoken';
import { Server as SocketIOServer } from 'socket.io';
import { env } from '../config/env';
import { query } from '../config/db';
import {
  AuthTokenPayload,
  EmergencyStatusChangedPayload,
  SocketReceiveMessagePayload,
  SocketSendMessagePayload,
} from '../types';

// Owned by Dev 3 / Maher. Wires up the Socket.IO gateway described in design
// doc section 7: handshake auth, per-conversation rooms, and the
// send_message / receive_message / emergency_status_changed events.
//
// Auth: verifies the same access_token JWT that requireAuth checks for REST
// routes (see middleware/auth.middleware.ts) - same secret, same payload
// shape, same expired/invalid handling. The handshake happens outside
// Express's request/response cycle, so cookie-parser's req.cookies isn't
// available here; the raw Cookie header off the handshake is parsed by hand
// instead. Everything downstream keys off socket.data.userId.
export function initSocketServer(httpServer: HttpServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.clientOrigin,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const rawCookies = socket.handshake.headers.cookie;
    const token = rawCookies ? parseCookie(rawCookies).access_token : undefined;

    if (!token) {
      next(new Error('Not authenticated'));
      return;
    }

    try {
      const payload = jwt.verify(token, env.jwt.accessSecret) as AuthTokenPayload;
      socket.data.userId = payload.userId;
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
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
