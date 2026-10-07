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
	createdAt: Date;
}

// roles table
export interface IUserRole {
	userId: string;
	role: Role;
	createdAt: Date;
}

// followings table
export interface IFollowing {
	id: number;
	userId: string;
	followedId: string;
	createdAt: Date;
}

// works table - portfolio items
export interface IWork {
	id: number;
	userId: string;
	description: string | null;
	createdAt: Date;
	updatedAt: Date;
}

// work_updates table - posts against a work
export interface IWorkUpdate {
	id: number;
	workId: number;
	versionNumber: number;
	description: string | null;
	createdAt: Date;
	updatedAt: Date;
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
	createdAt: Date;
}

// work_likes table
export interface IWorkLike {
	id: number;
	workId: number;
	userId: string;
	createdAt: Date;
}

// work_comments table
export interface IWorkComment {
	id: number;
	workId: number;
	userId: string;
	content: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface IPostEvent {
	id: number;
	postId: number;
	startAt: Date;
	endAt: Date;
	createdAt: Date;
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
