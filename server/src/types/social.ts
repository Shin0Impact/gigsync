// types/social.ts

import { UserRole } from "./index";

export type ArtistType = "painter" | "photographer" | "designer" | "musician";
export type Role = UserRole;

// profiles table
export interface IProfile {
	id: number;
	userId: string;
	userName: string;
	avatarUrl: string | null;
	followersNumber: number;
	artistsType: ArtistType;
	createdAt: string;
}

// roles table
export interface IUserRole {
	userId: string;
	role: Role;
	createdAt: string;
}

// followings table
export interface IFollowing {
	id: number;
	userId: string;
	followedId: string;
	createdAt: string;
}

// works table
export interface IWork {
	id: number;
	userId: string;
	title: string | null;
	description: string | null;
	createdAt: string;
	updatedAt: string;
}

// work_updates table
export interface IWorkUpdate {
	id: number;
	workId: number;
	versionNumber: number;
	description: string | null;
	createdAt: string;
	updatedAt: string;
}

// update_media table
export interface IUpdateMedia {
	id: number;
	updateId: number;
	mediaType: string;
	r2Key: string;
	mimeType: string;
	fileSizeBytes: number;
	sortOrder: number;
	createdAt: string;
}

// work_likes table
export interface IWorkLike {
	id: number;
	workId: number;
	userId: string;
	createdAt: string;
}

// work_comments table
export interface IWorkComment {
	id: number;
	workId: number;
	userId: string;
	content: string;
	createdAt: string;
	updatedAt: string;
}

export interface IPostEvent {
	id: number;
	postId: number;
	startAt: string;
	endAt: string;
	createdAt: string;
}

// -----------------------------------------------------------------------------
// Works & Social Input DTOs
// -----------------------------------------------------------------------------

export interface CreateWorkInput {
	title?: string | null;
	description?: string | null;
}

export interface CreateWorkUpdateInput {
	description?: string | null;
}

export interface AddUpdateMediaInput {
	mediaType: string;
	objectKey: string;
	mimeType?: string;
	fileSizeBytes?: number;
	sortOrder?: number;
}

// -----------------------------------------------------------------------------
// Response-body types
// -----------------------------------------------------------------------------

export interface CreateWorkResponse {
	work: IWork;
}

export interface ListWorksResponse {
	works: IWork[];
}

export interface AddWorkUpdateResponse {
	update: IWorkUpdate;
}

export interface ListWorkUpdatesResponse {
	updates: IWorkUpdate[];
}

export interface AddUpdateMediaResponse {
	media: IUpdateMedia;
}

export interface ListUpdateMediaResponse {
	media: IUpdateMedia[];
}

// -----------------------------------------------------------------------------
// Likes / comments / follow write paths (2026-10-11) - previously read-only
// scaffolding only (see social.queries.ts), now wired to real routes for
// the artist-facing pages (profile, explore feed, post detail).
// -----------------------------------------------------------------------------

export interface AddWorkCommentInput {
	content: string;
}

export interface AddWorkCommentResponse {
	comment: IWorkComment;
}

export interface WorkCommentWithAuthor extends IWorkComment {
	userName: string;
	avatarUrl: string | null;
}

export interface ListWorkCommentsResponse {
	comments: WorkCommentWithAuthor[];
}

export interface ToggleWorkLikeResponse {
	liked: boolean;
	likeCount: number;
}

// A work as it appears in a feed (explore / following / profile), with the
// author resolved (so the feed doesn't need a second request per card) and
// the engagement counts/viewer state pre-computed server-side.
export interface WorkFeedAuthor {
	userId: string;
	userName: string;
	avatarUrl: string | null;
	artistsType: ArtistType | null;
}

export interface WorkFeedItem extends IWork {
	author: WorkFeedAuthor;
	likeCount: number;
	commentCount: number;
	likedByMe: boolean;
	// First media file of the latest update, if any - same "cover" rule the
	// client already uses for PieceCard (see getWorkUpdates: newest-first).
	coverMedia: IUpdateMedia | null;
}

export interface ListWorksFeedResponse {
	works: WorkFeedItem[];
}

// Mixed feed (2026-10-12): the homepage Timeline + Discovery endpoints
// (GET /api/feed/timeline, GET /api/feed/discovery). Items are a
// discriminated union of the two publishable thing types - a versioned
// work update (with its parent work, author and attached media) and an
// event (with its organizer) - so one chronological list renders both.
export interface FeedAuthor {
	userId: string;
	userName: string;
	avatarUrl: string | null;
}

export interface FeedWorkSummary {
	id: number;
	title: string | null;
	description: string | null;
}

export interface FeedEventSummary {
	id: number;
	title: string | null;
	description: string | null;
	venueName: string | null;
	startAt: string | null;
	endAt: string | null;
	status: string | null;
	categoriesNeeded: string[] | null;
}

export type FeedItem =
	| {
			type: "work_update";
			// The work_update id - unique only within the type, so the client
			// list key should be `${type}:${id}`.
			id: number;
			createdAt: string;
			author: FeedAuthor;
			work: FeedWorkSummary;
			update: {
				id: number;
				versionNumber: number | null;
				description: string | null;
			};
			// All media attached to this update, ordered by sort_order.
			media: IUpdateMedia[];
	  }
	| {
			type: "event";
			id: number;
			createdAt: string;
			// The organizer, so the card can show who posted the event.
			author: FeedAuthor;
			event: FeedEventSummary;
	  };

export interface ListFeedResponse {
	items: FeedItem[];
}
