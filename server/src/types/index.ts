export type UserRole = 'artist' | 'organizer' | 'fan' | 'admin' | 'moderator';

export interface AuthTokenPayload {
  userId: string;
  role: UserRole;
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
