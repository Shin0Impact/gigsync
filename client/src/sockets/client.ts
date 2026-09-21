import { io, Socket } from 'socket.io-client';

// Singleton socket instance for the whole app. Call connectSocket() once
// (e.g. right after login, or on app load for now) and
// attachSocketListeners(dispatch) right after to wire events into Redux.
//
// Auth: withCredentials sends the HTTP-only access_token cookie set by
// /api/auth/login along with the handshake; the server verifies that JWT
// and derives socket.data.userId from it (see server/src/sockets/index.ts).
// No user-supplied identifier is passed here - the client can't be trusted
// to say who it is, only the verified cookie can.
let socket: Socket | null = null;

export function connectSocket(): Socket {
  if (socket?.connected) {
    return socket;
  }

  socket = io(import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:4000', {
    withCredentials: true,
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
