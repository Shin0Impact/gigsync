export type UserRole = 'artist' | 'organizer' | 'fan' | 'admin' | 'moderator';

export type ArtistCategory =
  | 'painter'
  | 'photographer'
  | 'designer'
  | 'musician';

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

// -----------------------------------------------------------------------------
// Current database types
// -----------------------------------------------------------------------------
//
// These interfaces reflect the current PostgreSQL tables used by the backend.
// The property names intentionally use snake_case to match the database schema.
//
// Current authentication-related tables:
//
// users
// roles
// profiles
//
// The application currently keeps authentication data in `users`, role data
// in `roles`, and public/profile information in `profiles`.

// users table
export interface IUserRecord {
  id: string;
  email: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

// roles table
export interface IRole {
  user_id: string;
  role: UserRole;
  created_at: string;
}

// profiles table
export interface IProfile {
  id: number;
  created_at: string;
  user_name: string;
  user_id: string;
  avatar_url: string | null;
  followers_number: number;
  artists_type: ArtistCategory | null;
}

// works table
export interface IWork {
  id: number;
  created_at: string;
  description: string;
  user_id: string;
  updated_at: string;
}

// work_updates table
export interface IWorkUpdate {
  id: number;
  created_at: string;
  updated_at: string;
  work_id: number;
  version_number: number;
  description: string;
}

// update_media table
export interface IUpdateMedia {
  id: number;
  created_at: string;
  update_id: number;
  media_type: string;
  r2_key: string;
  mime_type: string;
  file_size: number;
  sort_order: number;
}

// work_likes table
export interface IWorkLike {
  id: number;
  created_at: string;
  work_id: number;
  user_id: string;
}

// work_comments table
export interface IWorkComment {
  id: number;
  created_at: string;
  work_id: number;
  user_id: string;
  content: string;
  updated_at: string;
}

// followings table
export interface IFollowing {
  id: number;
  created_at: string;
  user_id: string;
  followed_id: string;
}

// event table
export interface IEventRecord {
  id: number;
  created_at: string;
  start_at: string;
  end_at: string;
  post_id: number;
}

// -----------------------------------------------------------------------------
// Legacy / planned user shape
// -----------------------------------------------------------------------------
//
// Kept as a reference because some existing client/server work may still
// depend on this shape. These fields do NOT represent the current `users`
// PostgreSQL table.
//
// If these fields are introduced into the database later, this interface can
// be revisited and moved into the appropriate domain/profile types.

/*
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
*/

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

// -----------------------------------------------------------------------------
// Registration
// -----------------------------------------------------------------------------
//
// Input accepted by POST /api/auth/register.
//
// user_name is required for every user.
// artists_type is required only when role = 'artist'.
// artists_type must be null/omitted for non-artists.

export interface RegisterInput {
  email: string;
  password: string;
  role: UserRole;
  user_name: string;
  artists_type?: ArtistCategory | null;
}

// Result returned internally by the registration service.

export interface RegisterResult {
  user: IUserRecord;
  role: IRole;
  profile: IProfile;
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
