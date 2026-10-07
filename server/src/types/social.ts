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

// works table - portfolio items
export interface IWork {
	id: number;
	userId: string;
	description: string | null;
	createdAt: string;
	updatedAt: string;
}

// work_updates table - posts against a work
export interface IWorkUpdate {
	id: number;
	workId: number;
	versionNumber: number;
	description: string | null;
	createdAt: string;
	updatedAt: string;
}

// update_media table - media attachments on a work_update
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
// Input / Request Body DTOs
// -----------------------------------------------------------------------------

export interface CreateWorkInput {
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
// Response Body Types
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
