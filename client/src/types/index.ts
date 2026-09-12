export type UserRole = 'artist' | 'organizer' | 'fan' | 'admin' | 'moderator';

export interface IUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string | null;
  isVerified: boolean;
}

export interface IPortfolioItem {
  id: string;
  type: 'audio' | 'image' | 'video';
  title: string;
  url: string;
  thumbnailUrl?: string;
  description?: string;
}

export interface IReview {
  id: string;
  authorName: string;
  eventName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface IArtistProfile {
  id: string;
  userId: string;
  name: string;
  locationName?: string;
  tagline?: string;
  bio?: string;
  hourlyRate?: number;
  isEmergencyAvailable: boolean;
  ratingAvg: number;
  reviewCount: number;
  categories: string[];
  distanceKm?: number;
  portfolio?: IPortfolioItem[];
  reviews?: IReview[];
}

export interface IEvent {
  id: string;
  organizerId: string;
  title: string;
  description: string;
  venueName: string;
  eventDate: string;
  status: 'open' | 'filled' | 'completed' | 'cancelled';
  categoriesNeeded: string[];
  budget?: number;
}

export interface IApplication {
  id: string;
  eventId: string;
  artistId: string;
  artistName: string;
  artistAvatar?: string;
  category: string;
  rateProposed: number;
  pitch: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface IConversation {
  id: string;
  eventId?: string | null;
  participantIds: string[];
  updatedAt: string;
  partner?: {
    id: string;
    name: string;
    avatarUrl?: string;
    role: string;
  };
  lastMessage?: string;
}

export interface IMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}
