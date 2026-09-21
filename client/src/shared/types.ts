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

export interface IArtistProfile {
	id: string;
	userId: string;
	name: string;
	bio?: string;
	hourlyRate?: number;
	isEmergencyAvailable: boolean;
	ratingAvg: number;
	reviewCount: number;
	categories: string[];
	distanceKm?: number;
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
}

export interface IConversation {
	id: string;
	eventId?: string | null;
	participantIds: string[];
	updatedAt: string;
}

export interface IMessage {
	id: string;
	conversationId: string;
	senderId: string;
	content: string;
	isRead: boolean;
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
