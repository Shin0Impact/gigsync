export type UserRole = "artist" | "organizer" | "fan" | "admin" | "moderator";

export interface IUser {
	id: string;
	email: string;
	username: string;
	name: string;
	role: UserRole;
	avatarUrl?: string | null;
	isVerified: boolean;
}

// A single portfolio media asset (audio/image/video sample) on an artist's
// profile. Matches showcase_items in schema.sql, plus the shape ProfileView
// / ArtistDirectory / ArtistModal already build and read these as.
export interface IPortfolioItem {
	id: string;
	type: "audio" | "image" | "video";
	title: string;
	url: string;
	description?: string;
}

// A review/testimonial shown on an artist's profile modal.
export interface IArtistReview {
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
	bio?: string;
	tagline?: string;
	hourlyRate?: number;
	isEmergencyAvailable: boolean;
	ratingAvg: number;
	reviewCount: number;
	categories: string[];
	distanceKm?: number;
	locationName?: string;
	portfolio?: IPortfolioItem[];
	reviews?: IArtistReview[];
}

export interface IEvent {
	id: string;
	organizerId: string;
	title: string;
	description: string;
	venueName: string;
	eventDate: string;
	status: "open" | "filled" | "completed" | "cancelled";
	categoriesNeeded: string[];
	// TODO: confirmed needed by GigBoard.tsx from an earlier CI log, but that
	// file wasn't available when this was written - if GigBoard.tsx needs
	// more than this (e.g. locationCoords), send it over and this can be
	// tightened up.
	budget?: number;
}

// The "other person" in a 1:1 conversation, and a preview of the last
// message - both client-side convenience fields ChatView renders directly,
// not raw DB columns (see server/src/types for the DB-shaped IConversation).
export interface IConversationPartner {
	id: string;
	name: string;
	avatarUrl?: string;
	role: string;
}

export interface IConversation {
	id: string;
	eventId?: string | null;
	participantIds: string[];
	updatedAt: string;
	partner?: IConversationPartner;
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

// Matches event_applications in schema.sql, extended with the display
// fields ApplicationsView.tsx renders (artist name/avatar, category, pitch,
// proposed rate) so it doesn't need a separate join on every render.
export interface IApplication {
	id: string;
	eventId: string;
	artistId: string;
	artistName: string;
	artistAvatar?: string | null;
	category: string;
	status: "pending" | "accepted" | "rejected";
	pitch: string;
	rateProposed: number;
	createdAt: string;
}

export interface RegisterPayload {
	email: string;
	password: string;
	username: string;
	// name: string;
	// role: UserRole;
	// avatarUrl?: string | null;
}
