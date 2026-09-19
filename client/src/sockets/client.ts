import { io, Socket } from 'socket.io-client';

// Singleton socket instance for the whole app. Call connectSocket(userId)
// once (e.g. right after login, or on app load for now) and
// attachSocketListeners(dispatch) right after to wire events into Redux.
//
// TEMPORARY AUTH: real JWT auth isn't live yet, so we pass a plain userId in
// the handshake `auth` payload instead of relying on the HTTP-only cookie.
// Once /api/auth exists, drop the `auth: { userId }` line below - the
// server will read the cookie instead (see server/src/sockets/index.ts).
let socket: Socket | null = null;

export function connectSocket(userId: string): Socket {
  if (socket?.connected) {
    return socket;
  }

  socket = io(import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:4000', {
    withCredentials: true,
    auth: { userId },
  });

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}

export function joinConversation(conversationId: string) {
  socket?.emit('join_conversation', conversationId);
}

export function leaveConversation(conversationId: string) {
  socket?.emit('leave_conversation', conversationId);
}

export function sendMessage(conversationId: string, content: string) {
  socket?.emit('send_message', { conversationId, content });
}
