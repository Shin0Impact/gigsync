export type UserRole = 'artist' | 'organizer' | 'fan' | 'admin' | 'moderator';

export interface AuthTokenPayload {
  userId: string;
  role: UserRole;
}

// --- Socket.IO event payloads (design doc section 7) ---

export interface SocketSendMessagePayload {
  conversationId: string;
  content: string;
}

export interface SocketReceiveMessagePayload {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface EmergencyStatusChangedPayload {
  artistId: string;
  isEmergencyAvailable: boolean;
  emergencyUntil: string | null;
}

// Extend Express's Request type with the authenticated user, set by
// auth.middleware.ts once a JWT has been verified.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
    }
  }
}

export {};
