import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { env } from '../config/env';

// Owned by Dev 3. Wires up the Socket.IO gateway described in design doc
// section 7: JWT-cookie handshake auth, per-conversation rooms, and the
// send_message / receive_message / emergency_status_changed events.
export function initSocketServer(httpServer: HttpServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: true,
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    // TODO: verify the JWT cookie from the handshake before trusting a
    // connection, then socket.join(conversationId) for each of the user's
    // active conversations.

    socket.on('send_message', (_payload) => {
      // TODO: persist to `messages`, then emit 'receive_message' to the room.
    });

    socket.on('disconnect', () => {
      // TODO: presence/cleanup if needed.
    });
  });

  return io;
}
