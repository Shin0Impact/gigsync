export type UserRole = 'artist' | 'organizer' | 'fan' | 'admin' | 'moderator';

export interface AuthTokenPayload {
  userId: string;
  role: UserRole;
}

// --- Domain types (mirror server/src/db/schema.sql) ---
//
// These represent rows as the app works with them (camelCase, after mapping
// from Postgres's snake_case columns) - not raw `pg` query results, and not
// the client's src/types (those are API-response/view shapes, which can
// differ - e.g. the client's IArtistProfile includes a joined `name` and
// `distanceKm` that don't exist on the artist_profiles table itself).

export type EventStatus = 'open' | 'filled' | 'completed' | 'cancelled';
export type ApplicationStatus = 'pending' | 'accepted' | 'rejected';
export type ReportStatus = 'pending' | 'investigating' | 'resolved' | 'dismissed';
export type MediaType = 'image' | 'video' | 'audio';

export interface GeoPoint {
  lat: number;
  lng: number;
}

// users table
export interface IUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl: string | null;
  avatarR2Key: string | null;
  location: GeoPoint | null;
  addressName: string | null;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

// artist_profiles table (one-to-one with users where role = 'artist')
export interface IArtistProfile {
  id: string;
  userId: string;
  bio: string | null;
  hourlyRate: number | null;
  isEmergencyAvailable: boolean;
  emergencyUntil: string | null;
  ratingAvg: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

// artist_profiles joined with users + artist_categories - the shape most
// "get an artist" endpoints actually return. If mockStore.ts needs fields
// beyond this (e.g. a flat `id` that's really the user's id, not the
// profile's), extend this interface here rather than redefining it
// per-file, so client and server stay talking about the same shape.
export interface IExtendedArtistProfile extends IArtistProfile {
  name: string;
  avatarUrl: string | null;
  categories: string[];
}

// events table
export interface IEvent {
  id: string;
  organizerId: string;
  title: string;
  description: string;
  venueName: string;
  location: GeoPoint;
  eventDate: string;
  status: EventStatus;
  isRecurring: boolean;
  recurringRule: string | null;
  createdAt: string;
  updatedAt: string;
}

// conversations table + conversation_participants
export interface IConversation {
  id: string;
  eventId: string | null;
  participantIds: string[];
  createdAt: string;
  updatedAt: string;
}

// messages table
export interface IMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
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
