// types/index.ts

import type { IUpdateMedia, IWorkUpdate } from "./social";

export type UserRole = "artist" | "organizer" | "fan" | "admin" | "moderator";

export type ArtistCategory = "painter" | "photographer" | "designer" | "musician";

export type EventStatus = "open" | "filled" | "completed" | "cancelled";
export type ApplicationStatus = "pending" | "accepted" | "rejected";
export type ReportStatus = "pending" | "investigating" | "resolved" | "dismissed";
export type MediaType = "image" | "video" | "audio";
export type VerificationStatus = "pending" | "approved" | "rejected";

export interface GeoPoint {
	lat: number;
	lng: number;
}

export interface AuthTokenPayload {
	userId: string;
	role: UserRole;
}

// -----------------------------------------------------------------------------
// Database Entity Wire Shapes (Frontend-safe representations of PostgreSQL rows)
// -----------------------------------------------------------------------------

export interface DbUser {
	id: string;
	email: string;
	password_hash: string;
	created_at: Date;
	updated_at: Date;
}

export interface DbUserWithUsername extends DbUser {
	user_name: string;
}

export interface DbRole {
	user_id: string;
	role: UserRole;
	created_at: Date;
}

export interface DbProfile {
	id: number;
	created_at: Date;
	user_name: string;
	user_id: string;
	name: string | null;
	avatar_url: string | null;
	followers_number: number;
	artists_type: string | null;
}

export interface DbEvent {
	id: number;
	parent_event_id: number | null;
	organizer_id: string;
	title: string;
	descriptions: string;
	start_at: Date;
	end_at: Date;
	venue_name: string | null;
	location_lat: number | null;
	location_lng: number | null;
	is_recurring: boolean;
	recurring_rule: string | null;
	status: EventStatus;
	categories_needed: ArtistCategory[] | null;
	is_urgent: boolean;
	created_at: Date;
	updated_at: Date | null;
	// Only present on list queries that were given a search centre.
	distance_km?: number | null;
}

export interface DbEventApplication {
	id: string;
	event_id: number;
	artist_id: string;
	status: ApplicationStatus;
	cover_note: string | null;
	applied_at: Date;
	updated_at: Date;
}

export interface DbEventMedia {
	id: string;
	event_id: number;
	media_type: string;
	object_key: string;
	alt_text: string | null;
	sort_order: number;
	created_at: Date;
}

export interface DbShowcaseItem {
	id: string;
	user_id: string;
	event_id: number | null;
	work_id: number | null;
	sort_order: number;
	created_at: Date;
}

export interface DbSocialLink {
	id: string;
	user_id: string;
	platform: string;
	url: string;
	created_at: Date;
}

export interface DbVerificationRequest {
	id: string;
	user_id: string;
	status: VerificationStatus;
	id_document_key: string;
	notes: string | null;
	reviewed_by: string | null;
	reviewed_at: Date | null;
	created_at: Date;
}

// -----------------------------------------------------------------------------
// Core Domain / Application Models
// -----------------------------------------------------------------------------

// IArtistProfile, IExtendedArtistProfile, IEvent and IConversation used to
// live here - dead weight, never imported anywhere (the actual
// artist/event/conversation domain types are the Db*/*Response/*Summary
// interfaces used by the real queries/services/controllers below and in
// types/social.ts). IMessage is the one survivor of this group - it's live,
// used by the socket gateway, chatSlice, and MessageThread's live-tail merge
// (see card #34).
export interface IMessage {
	id: string;
	conversationId: string;
	senderId: string;
	content: string;
	isRead: boolean;
	createdAt: Date;
}

// -----------------------------------------------------------------------------
// Service & Controller Input Types (DTOs)
// -----------------------------------------------------------------------------

export interface RegisterInput {
	email: string;
	password: string;
	role: UserRole;
	user_name: string;
	name: string;
	artists_type?: ArtistCategory | null;
}

export interface LoginInput {
	identifier: string;
	password: string;
	// Defaults to true (see login_user in auth.service.ts) when omitted,
	// so old clients that predate this field keep today's always-persistent
	// behavior. true = refresh token persists for env.jwt.refreshExpiresIn
	// (7d by default) across browser restarts; false = refresh token is a
	// session cookie (cleared when the browser closes) backed by a short
	// JWT expiry as a backstop, in case the browser doesn't actually clear
	// it (mobile "continue where you left off" session restore).
	rememberMe?: boolean;
}

export interface ChangePasswordInput {
	currentPassword: string;
	newPassword: string;
}

export interface ForgotPasswordInput {
	email: string;
}

export interface ResetPasswordInput {
	token: string;
	newPassword: string;
}

export interface VerifyEmailInput {
	token: string;
}

export interface UpdateEmergencyStatusInput {
	isEmergencyAvailable: boolean;
	emergencyUntil?: string | null;
	lat?: number;
	lng?: number;
}

export interface SearchEmergencyAvailableInput {
	lat: number;
	lng: number;
	radiusKm: number;
}

export interface SearchArtistsInput {
	lat: number;
	lng: number;
	radiusKm: number;
	artistsType?: ArtistCategory | null;
}

export interface RequestUploadUrlInput {
	fileName: string;
	contentType: string;
	fileSizeBytes: number;
	folder?: string;
}

export interface RequestIdDocumentUploadUrlInput {
	fileName: string;
	contentType: string;
	fileSizeBytes: number;
}

export interface CreateEventInput {
	title: string;
	description: string;
	startAt: string;
	endAt: string;
	venueName: string;
	location: { lat: number; lng: number };
	isRecurring?: boolean;
	recurringRule?: string | null;
	categoriesNeeded?: ArtistCategory[];
	isUrgent?: boolean;
}

export interface UpdateEventInput {
	title?: string;
	description?: string;
	startAt?: string;
	endAt?: string;
	venueName?: string;
	location?: { lat: number; lng: number };
	isRecurring?: boolean;
	recurringRule?: string | null;
	status?: EventStatus;
	categoriesNeeded?: ArtistCategory[];
	isUrgent?: boolean;
}

export interface AddEventMediaInput {
	mediaType: string;
	objectKey: string;
	altText?: string | null;
	sortOrder?: number;
}

export interface AddShowcaseItemInput {
	sourceType: "event" | "work";
	sourceId: number;
	sortOrder?: number;
}

export interface AddSocialLinkInput {
	platform: string;
	url: string;
}

export interface SubmitVerificationInput {
	idDocumentObjectKey: string;
}

export interface ReviewVerificationInput {
	status: "approved" | "rejected";
	notes?: string | null;
}

// -----------------------------------------------------------------------------
// Service Results & Composite Types
// -----------------------------------------------------------------------------

export interface EmergencyStatusResponse {
	userId: string;
	isEmergencyAvailable: boolean;
	emergencyUntil: Date | string | null;
	location: GeoPoint | null;
}

export interface EmergencyAvailableArtist {
	userId: string;
	userName: string;
	avatarUrl: string | null;
	artistsType: string | null;
	emergencyUntil: Date | string | null;
	location: GeoPoint | null;
	distanceKm: number;
}

export interface ArtistSearchResult {
	userId: string;
	userName: string;
	avatarUrl: string | null;
	artistsType: string | null;
	location: GeoPoint | null;
	distanceKm: number;
	followersNumber: number;
	isEmergencyAvailable: boolean;
}

// Card #26 - artist availability calendar. Dates are plain
// "YYYY-MM-DD" strings on the wire, never Date objects - that format is
// what <input type="date">/react-day-picker naturally produce and consume,
// and it sidesteps timezone-shift bugs a serialized Date would introduce.
export interface ListAvailabilityResponse {
	dates: string[];
}

export interface AddAvailabilityResponse {
	date: string;
}

export interface UploadUrlResult {
	uploadUrl: string;
	objectKey: string;
	publicUrl: string | null;
	expiresInSeconds: number;
}

export interface IdDocumentUploadUrlResult {
	uploadUrl: string;
	objectKey: string;
	expiresInSeconds: number;
}

export interface VerificationStatusResult {
	isVerified: boolean;
	request: DbVerificationRequest | null;
}

export interface ShowcaseEventPost {
	id: number;
	title: string;
	description: string;
	media: DbEventMedia[];
}

export interface ShowcaseWorkUpdateWithMedia extends IWorkUpdate {
	media: IUpdateMedia[];
}

export interface ShowcaseWorkPost {
	id: number;
	description: string | null;
	updates: ShowcaseWorkUpdateWithMedia[];
}

export interface ShowcaseItemResult {
	id: string;
	sourceType: "event" | "work";
	sortOrder: number;
	createdAt: Date | string;
	post: ShowcaseEventPost | ShowcaseWorkPost | null;
}

// -----------------------------------------------------------------------------
// Socket.IO Payload Definitions
// -----------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------
// Controller Response-Body Types
// -----------------------------------------------------------------------------

export interface ErrorResponse {
	error: string;
}

// auth.controller.ts
export interface RegisterResponse {
	user: Omit<DbUser, "password_hash">;
	role: DbRole;
	profile: DbProfile;
	// Only present in non-production builds (no mail provider yet) - lets
	// the email-verification flow be exercised end to end without SMTP.
	dev_email_verification_token?: string;
}

export interface LoginResponse {
	user: Omit<DbUserWithUsername, "password_hash">;
	role: DbRole;
}

export interface RefreshResponse {
	message: string;
}

// auth.controller.ts - account recovery (change/forgot/reset password,
// verify/resend verification). devResetToken / devVerificationToken are
// only set in non-production builds - they stand in for the email link
// until a real mail provider is wired into mailer.service.ts.
export interface MessageResponse {
	message: string;
	devResetToken?: string;
	devVerificationToken?: string;
}

export interface MeResponse {
	user: MyProfile | null;
}

// users.controller.ts - GET /api/users/:identifier (public profile page)
export interface PublicProfile {
	userId: string;
	userName: string;
	name: string | null;
	role: UserRole;
	artistsType: string | null;
	avatarUrl: string | null;
	isVerified: boolean;
	followersNumber: number;
	createdAt: Date | string;
}

// auth.controller.ts GET /me - the public profile fields plus the owner's
// own email (never exposed on the public :identifier endpoint).
export interface MyProfile extends PublicProfile {
	email: string;
	emailVerified: boolean;
}

export interface GetUserProfileResponse {
	profile: PublicProfile;
}

// artists.controller.ts
export interface EmergencyStatusHandlerResponse {
	status: EmergencyStatusResponse;
}

export interface ListEmergencyAvailableResponse {
	artists: EmergencyAvailableArtist[];
}

export interface UserSearchResult {
	userId: string;
	userName: string;
	name: string | null;
	avatarUrl: string | null;
	role: string | null;
	artistsType: string | null;
	isVerified: boolean;
	followersNumber: number;
}

export interface ListUsersSearchResponse {
	users: UserSearchResult[];
}

export interface ListArtistsSearchResponse {
	artists: ArtistSearchResult[];
}

// event_media.controller.ts
export interface AddEventMediaResponse {
	media: DbEventMedia;
}

export interface ListEventMediaResponse {
	media: DbEventMedia[];
}

// events.controller.ts
export interface CreateEventResponse {
	event: DbEvent;
}

export interface ListEventsResponse {
	events: DbEvent[];
}

export interface GetEventResponse {
	event: DbEvent;
}

export interface UpdateEventResponse {
	event: DbEvent;
}

export interface ApplyToEventResponse {
	application: DbEventApplication;
}

export interface ListApplicationsResponse {
	applications: DbEventApplication[];
}

export interface UpdateApplicationResponse {
	application: DbEventApplication;
}

// showcase.controller.ts
export interface AddShowcaseItemResponse {
	item: DbShowcaseItem;
}

export interface ListShowcaseItemsResponse {
	items: ShowcaseItemResult[];
}

// verification.controller.ts
export interface AddSocialLinkResponse {
	link: DbSocialLink;
}

export interface ListSocialLinksResponse {
	links: DbSocialLink[];
}

export interface SubmitVerificationResponse {
	request: DbVerificationRequest;
}

export interface ListPendingVerificationRequestsResponse {
	requests: DbVerificationRequest[];
}

export interface GetIdDocumentViewUrlResponse {
	url: string;
	expiresInSeconds: number;
}

export interface ReviewVerificationRequestResponse {
	request: DbVerificationRequest;
}

// -----------------------------------------------------------------------------
// Profiles, follow, and derived activity feed (2026-10-11)
// -----------------------------------------------------------------------------

export interface ProfileSummary {
	userId: string;
	userName: string;
	name: string | null;
	avatarUrl: string | null;
	artistsType: string | null;
	role: UserRole | null;
	followersCount: number;
	isVerified: boolean;
	isFollowedByMe: boolean;
	isOwnProfile: boolean;
	socialLinks: DbSocialLink[];
	createdAt: Date | string;
}

export interface GetProfileResponse {
	profile: ProfileSummary;
}

export interface FollowResponse {
	following: boolean;
	followersCount: number;
}

export type ActivityItemType = "like" | "comment" | "follow" | "application_accepted" | "application_rejected";

export interface ActivityActor {
	userId: string;
	userName: string;
	avatarUrl: string | null;
}

// Synthesized from existing tables (work_likes, work_comments, followings,
// event_applications) - there's no dedicated notifications table, so this
// is assembled on read rather than stored. See profiles.service.ts.
export interface ActivityItem {
	id: string;
	type: ActivityItemType;
	createdAt: string;
	actor: ActivityActor | null;
	workId?: number;
	commentContent?: string;
	eventId?: number;
	eventTitle?: string;
}

export interface ListMyActivityResponse {
	activity: ActivityItem[];
}

// An artist's own application, joined with the event it's for - see
// list_applications_for_artist in db/queries/events.queries.ts.
export interface DbEventApplicationWithEvent extends DbEventApplication {
	event_title: string;
	event_start_at: Date;
	event_venue_name: string | null;
	event_status: EventStatus;
}

export interface ListMyApplicationsResponse {
	applications: DbEventApplicationWithEvent[];
}
// Card #34 - direct messaging (conversation list + message thread).
// Conversations/messages are DB-backed (see schema.sql); live delivery
// goes over the socket gateway (sockets/index.ts) - REST here covers
// discovering conversations and loading history, IMessage events over
// receive_message cover the live tail once a thread is open.
export interface ConversationParticipantSummary {
	userId: string;
	userName: string;
	avatarUrl: string | null;
}

export interface ConversationLastMessage {
	content: string;
	senderId: string;
	createdAt: string;
}

export interface ConversationSummary {
	id: string;
	// null only if the other participant row is somehow missing (should
	// not happen for a DM - see createDirectConversation) - kept nullable
	// rather than asserted so a data inconsistency renders as "Unknown"
	// instead of crashing the conversations list.
	otherParticipant: ConversationParticipantSummary | null;
	lastMessage: ConversationLastMessage | null;
	updatedAt: string;
}

export interface ListConversationsResponse {
	conversations: ConversationSummary[];
}

export interface StartConversationResponse {
	conversation: {
		id: string;
		createdAt: string;
	};
}

export interface MessageDto {
	id: string;
	conversationId: string;
	senderId: string;
	content: string;
	isRead: boolean;
	createdAt: string;
}

export interface ListMessagesResponse {
	messages: MessageDto[];
}
