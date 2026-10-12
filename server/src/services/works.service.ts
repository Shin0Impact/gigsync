import {
	createUpdateMedia,
	createWork,
	createWorkComment,
	createWorkLike,
	createWorkUpdate,
	deleteUpdateMedia,
	deleteWork,
	deleteWorkComment,
	deleteWorkLike,
	getAllMediaForWork,
	getFollowedUserIds,
	getLikeCountForWork,
	getMediaForUpdate,
	getWorkLikesByUser,
	getUpdateMediaById,
	getWorkById,
	getWorkCommentById,
	getWorkUpdateById,
	getWorkUpdates,
	getWorksByUser,
	listWorksFeed,
} from "../db/social.queries";
import { delete_object } from "./media.service";

import { AddUpdateMediaInput } from "../types/social";

const VALID_MEDIA_TYPES = ["image", "video", "audio"];

// "Works" are an artist's portfolio: a Work is a project, each Work has
// versioned Updates (progress posts), and each Update can carry R2-backed
// media. This is the "artist uploads" half of card #78's follow-up.
//
// Likes/comments/feed listing (2026-10-11): previously out of scope, now
// implemented below on top of Kareem's read-only scaffolding in
// social.queries.ts - see that file for the write-path query helpers.

export async function create_work(userId: string, description: string | null) {
	return createWork(userId, description ?? null);
}

export async function get_works_for_user(userId: string) {
	return getWorksByUser(userId);
}

export async function add_work_update(userId: string, workId: number, description: string | null) {
	const work = await getWorkById(workId);

	if (!work) {
		throw new Error("Work not found");
	}

	if (work.userId !== userId) {
		throw new Error("You do not own this work");
	}

	return createWorkUpdate(workId, description ?? null);
}

export async function get_updates_for_work(workId: number) {
	const work = await getWorkById(workId);

	if (!work) {
		throw new Error("Work not found");
	}

	return getWorkUpdates(workId);
}

// Ownership of a piece of update media runs update -> work -> userId, so
// this has to walk both rows rather than a single ownership check (same
// shape as event_media's event -> organizer_id check, just one hop deeper).
async function assert_owns_update(userId: string, updateId: number) {
	const update = await getWorkUpdateById(updateId);

	if (!update) {
		throw new Error("Work update not found");
	}

	const work = await getWorkById(update.workId);

	if (!work || work.userId !== userId) {
		throw new Error("You do not own this work");
	}

	return update;
}

export async function add_update_media(
	userId: string,
	updateId: number,
	input: AddUpdateMediaInput,
) {
	await assert_owns_update(userId, updateId);

	const {
		mediaType,
		objectKey,
		mimeType = "application/octet-stream",
		fileSizeBytes = 0,
		sortOrder = 0,
	} = input;

	if (!mediaType || !objectKey) {
		throw new Error("mediaType and objectKey are required");
	}

	if (!VALID_MEDIA_TYPES.includes(mediaType)) {
		throw new Error(`Invalid mediaType: ${mediaType}`);
	}

	return createUpdateMedia({
		updateId,
		mediaType,
		r2Key: objectKey,
		mimeType,
		fileSizeBytes,
		sortOrder,
	});
}

export async function get_media_for_update(updateId: number) {
	const update = await getWorkUpdateById(updateId);

	if (!update) {
		throw new Error("Work update not found");
	}

	return getMediaForUpdate(updateId);
}

export async function remove_update_media(userId: string, updateId: number, mediaId: number) {
	await assert_owns_update(userId, updateId);

	const media = await getUpdateMediaById(mediaId);

	if (!media || media.updateId !== updateId) {
		throw new Error("Media not found");
	}

	await deleteUpdateMedia(mediaId);

	// Best-effort R2 cleanup, same pattern as remove_event_media /
	// remove_showcase_item.
	try {
		await delete_object(media.r2Key);
	} catch (err) {
		console.warn(
			`Failed to delete R2 object ${media.r2Key} after removing update media ${mediaId}:`,
			err,
		);
	}
}

// Deletes a work and everything hanging off it: work_updates, their
// update_media (plus the backing R2 objects, best-effort, same pattern
// as remove_update_media above), and work_likes/work_comments. Reads the
// r2Key list before the rows are deleted since deleteWork() removes the
// update_media rows along with everything else.
export async function remove_work(userId: string, workId: number) {
	const work = await getWorkById(workId);

	if (!work) {
		throw new Error("Work not found");
	}

	if (work.userId !== userId) {
		throw new Error("You do not own this work");
	}

	const media = await getAllMediaForWork(workId);

	await deleteWork(workId);

	for (const item of media) {
		try {
			await delete_object(item.r2Key);
		} catch (err) {
			console.warn(
				`Failed to delete R2 object ${item.r2Key} after removing work ${workId}:`,
				err,
			);
		}
	}
}

const FEED_PAGE_SIZE = 20;
const MAX_FEED_PAGE_SIZE = 50;

function clamp_limit(requested: number | undefined): number {
	if (!requested || !Number.isFinite(requested) || requested <= 0) {
		return FEED_PAGE_SIZE;
	}
	return Math.min(requested, MAX_FEED_PAGE_SIZE);
}

export interface ListWorksFeedParams {
	limit?: number;
	offset?: number;
	// "following" restricts to the works of whoever `viewerId` follows -
	// requires a viewer (enforced by the route, see works.routes.ts).
	scope?: "explore" | "following";
	viewerId?: string | null;
}

export async function list_works_feed(params: ListWorksFeedParams) {
	const limit = clamp_limit(params.limit);
	const offset = Math.max(0, params.offset ?? 0);

	let authorIds: string[] | undefined;
	if (params.scope === "following") {
		if (!params.viewerId) {
			throw new Error("Must be signed in to view the following feed");
		}
		authorIds = await getFollowedUserIds(params.viewerId);
	}

	return listWorksFeed({ limit, offset, authorIds, viewerId: params.viewerId ?? null });
}

export async function get_like_status(workId: number, viewerId: string | null) {
	const work = await getWorkById(workId);
	if (!work) {
		throw new Error("Work not found");
	}
	const [likeCount, likedByMe] = await Promise.all([
		getLikeCountForWork(workId),
		viewerId ? getWorkLikesByUser(workId, viewerId).then((row) => row !== null) : Promise.resolve(false),
	]);
	return { liked: likedByMe, likeCount };
}

export async function like_work(userId: string, workId: number) {
	const work = await getWorkById(workId);
	if (!work) {
		throw new Error("Work not found");
	}
	await createWorkLike(workId, userId);
	const count = await getLikeCount(workId);
	return { liked: true, likeCount: count };
}

export async function unlike_work(userId: string, workId: number) {
	const work = await getWorkById(workId);
	if (!work) {
		throw new Error("Work not found");
	}
	await deleteWorkLike(workId, userId);
	const count = await getLikeCount(workId);
	return { liked: false, likeCount: count };
}

async function getLikeCount(workId: number): Promise<number> {
	return getLikeCountForWork(workId);
}

export async function add_comment(userId: string, workId: number, content: string) {
	const work = await getWorkById(workId);
	if (!work) {
		throw new Error("Work not found");
	}
	const trimmed = content?.trim();
	if (!trimmed) {
		throw new Error("content is required");
	}
	if (trimmed.length > 2000) {
		throw new Error("content must be 2000 characters or fewer");
	}
	return createWorkComment(workId, userId, trimmed);
}

export async function remove_comment(userId: string, commentId: number) {
	const comment = await getWorkCommentById(commentId);
	if (!comment) {
		throw new Error("Comment not found");
	}
	if (comment.userId !== userId) {
		throw new Error("You do not own this comment");
	}
	await deleteWorkComment(commentId);
}
