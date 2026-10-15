import { Request, Response } from "express";
import {
	add_comment,
	add_update_media,
	add_work_update,
	create_work,
	get_media_for_update,
	get_updates_for_work,
	get_like_status,
	get_work_detail,
	get_works_for_user,
	like_work,
	list_works_feed,
	remove_comment,
	remove_update_media,
	remove_work,
	unlike_work,
	get_work_composition,
} from "../services/works.service";
import { ErrorResponse } from "../types";
import {
	CreateWorkInput,
	CreateWorkUpdateInput,
	AddUpdateMediaInput,
	AddWorkCommentInput,
	CreateWorkResponse,
	ListWorksResponse,
	GetWorkResponse,
	AddWorkUpdateResponse,
	ListWorkUpdatesResponse,
	AddUpdateMediaResponse,
	ListUpdateMediaResponse,
	ListWorksFeedResponse,
	AddWorkCommentResponse,
	ListWorkCommentsResponse,
	ToggleWorkLikeResponse,
	GetWorkCompositionResponse,
} from "../types/social";

const NOT_FOUND_MESSAGES = ["Work not found", "Work update not found", "Media not found", "Comment not found"];
const FORBIDDEN_MESSAGES = ["You do not own this work", "You do not own this comment"];

function handle_known_error(error: unknown, res: Response, fallback: string) {
	if (error instanceof Error) {
		if (NOT_FOUND_MESSAGES.includes(error.message)) {
			return res.status(404).json({ error: error.message });
		}
		if (FORBIDDEN_MESSAGES.includes(error.message)) {
			return res.status(403).json({ error: error.message });
		}
		if (error.message.includes("required") || error.message.startsWith("Invalid mediaType")) {
			return res.status(400).json({ error: error.message });
		}
	}

	console.error(fallback, error);
	return res.status(500).json({ error: fallback });
}

function parse_id(raw: string): number | null {
	const id = Number(raw);
	return Number.isInteger(id) && id > 0 ? id : null;
}

export async function create_work_handler(
	req: Request<Record<string, never>, unknown, CreateWorkInput>,
	res: Response<CreateWorkResponse | ErrorResponse>,
) {
	try {
		const work = await create_work(req.user!.userId, req.body?.title ?? null, req.body?.description ?? null);
		return res.status(201).json({ work });
	} catch (error) {
		return handle_known_error(error, res, "Failed to create work");
	}
}

// GET /api/works/:identifier serves two reads off one route, distinguished
// by the identifier's shape (user ids are UUIDs, work ids are positive
// integers - they can never collide):
//   - UUID     -> that user's works list, { works: [...] } (public; the
//                 original GET /:userId behavior, unchanged)
//   - integer  -> one work with its updates and media embedded,
//                 { work: { ..., updates: [{ ..., media: [...] }] } },
//                 for the work detail page (also public)
// Anything that is neither is a 400 rather than silently returning an
// empty list for a mistyped identifier.
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function get_work_or_user_works_handler(
	req: Request<{ identifier: string }>,
	res: Response<GetWorkResponse | ListWorksResponse | ErrorResponse>,
) {
	const { identifier } = req.params;
	const workId = parse_id(identifier);

	if (workId !== null) {
		try {
			const work = await get_work_detail(workId);
			return res.status(200).json({ work });
		} catch (error) {
			return handle_known_error(error, res, "Failed to get work");
		}
	}

	if (!UUID_PATTERN.test(identifier)) {
		return res.status(400).json({
			error: "Invalid identifier - expected a work id or a user id",
		});
	}

	const works = await get_works_for_user(identifier);
	return res.status(200).json({ works });
}

export async function add_work_update_handler(
	req: Request<{ workId: string }, unknown, CreateWorkUpdateInput>,
	res: Response<AddWorkUpdateResponse | ErrorResponse>,
) {
	const workId = parse_id(req.params.workId);
	if (workId === null) {
		return res.status(400).json({ error: "Invalid work id" });
	}
	try {
		const update = await add_work_update(req.user!.userId, workId, req.body?.description ?? null);
		return res.status(201).json({ update });
	} catch (error) {
		return handle_known_error(error, res, "Failed to add work update");
	}
}

export async function list_work_updates_handler(
	req: Request<{ workId: string }>,
	res: Response<ListWorkUpdatesResponse | ErrorResponse>,
) {
	const workId = parse_id(req.params.workId);
	if (workId === null) {
		return res.status(400).json({ error: "Invalid work id" });
	}
	try {
		const updates = await get_updates_for_work(workId);
		return res.status(200).json({ updates });
	} catch (error) {
		return handle_known_error(error, res, "Failed to list work updates");
	}
}

export async function add_update_media_handler(
	req: Request<{ updateId: string }, unknown, AddUpdateMediaInput>,
	res: Response<AddUpdateMediaResponse | ErrorResponse>,
) {
	const updateId = parse_id(req.params.updateId);
	if (updateId === null) {
		return res.status(400).json({ error: "Invalid update id" });
	}
	try {
		const media = await add_update_media(req.user!.userId, updateId, req.body);
		return res.status(201).json({ media });
	} catch (error) {
		return handle_known_error(error, res, "Failed to add update media");
	}
}

export async function list_update_media_handler(
	req: Request<{ updateId: string }>,
	res: Response<ListUpdateMediaResponse | ErrorResponse>,
) {
	const updateId = parse_id(req.params.updateId);
	if (updateId === null) {
		return res.status(400).json({ error: "Invalid update id" });
	}
	try {
		const media = await get_media_for_update(updateId);
		return res.status(200).json({ media });
	} catch (error) {
		return handle_known_error(error, res, "Failed to list update media");
	}
}

export async function delete_update_media_handler(
	req: Request<{ updateId: string; mediaId: string }>,
	res: Response<void | ErrorResponse>,
) {
	const updateId = parse_id(req.params.updateId);
	const mediaId = parse_id(req.params.mediaId);
	if (updateId === null || mediaId === null) {
		return res.status(400).json({ error: "Invalid id" });
	}
	try {
		await remove_update_media(req.user!.userId, updateId, mediaId);
		return res.status(204).send();
	} catch (error) {
		return handle_known_error(error, res, "Failed to delete update media");
	}
}

export async function delete_work_handler(req: Request<{ workId: string }>, res: Response<void | ErrorResponse>) {
	const workId = parse_id(req.params.workId);
	if (workId === null) {
		return res.status(400).json({ error: "Invalid id" });
	}
	try {
		await remove_work(req.user!.userId, workId);
		return res.status(204).send();
	} catch (error) {
		return handle_known_error(error, res, "Failed to delete work");
	}
}

export async function list_works_feed_handler(
	req: Request<Record<string, never>, unknown, unknown, { scope?: string; limit?: string; offset?: string }>,
	res: Response<ListWorksFeedResponse | ErrorResponse>,
) {
	try {
		const { scope, limit, offset } = req.query;
		const works = await list_works_feed({
			scope: scope === "following" ? "following" : "explore",
			limit: limit ? Number(limit) : undefined,
			offset: offset ? Number(offset) : undefined,
			viewerId: req.user?.userId ?? null,
		});
		return res.status(200).json({ works });
	} catch (error) {
		return handle_known_error(error, res, "Failed to list works feed");
	}
}

export async function get_like_status_handler(
	req: Request<{ workId: string }>,
	res: Response<ToggleWorkLikeResponse | ErrorResponse>,
) {
	const workId = parse_id(req.params.workId);
	if (workId === null) {
		return res.status(400).json({ error: "Invalid work id" });
	}
	try {
		const result = await get_like_status(workId, req.user?.userId ?? null);
		return res.status(200).json(result);
	} catch (error) {
		return handle_known_error(error, res, "Failed to load like status");
	}
}

export async function like_work_handler(
	req: Request<{ workId: string }>,
	res: Response<ToggleWorkLikeResponse | ErrorResponse>,
) {
	const workId = parse_id(req.params.workId);
	if (workId === null) {
		return res.status(400).json({ error: "Invalid work id" });
	}
	try {
		const result = await like_work(req.user!.userId, workId);
		return res.status(200).json(result);
	} catch (error) {
		return handle_known_error(error, res, "Failed to like work");
	}
}

export async function unlike_work_handler(
	req: Request<{ workId: string }>,
	res: Response<ToggleWorkLikeResponse | ErrorResponse>,
) {
	const workId = parse_id(req.params.workId);
	if (workId === null) {
		return res.status(400).json({ error: "Invalid work id" });
	}
	try {
		const result = await unlike_work(req.user!.userId, workId);
		return res.status(200).json(result);
	} catch (error) {
		return handle_known_error(error, res, "Failed to unlike work");
	}
}

export async function add_comment_handler(
	req: Request<{ workId: string }, unknown, AddWorkCommentInput>,
	res: Response<AddWorkCommentResponse | ErrorResponse>,
) {
	const workId = parse_id(req.params.workId);
	if (workId === null) {
		return res.status(400).json({ error: "Invalid work id" });
	}
	try {
		const comment = await add_comment(req.user!.userId, workId, req.body?.content);
		return res.status(201).json({ comment });
	} catch (error) {
		return handle_known_error(error, res, "Failed to add comment");
	}
}

export async function list_comments_handler(
	req: Request<{ workId: string }>,
	res: Response<ListWorkCommentsResponse | ErrorResponse>,
) {
	const workId = parse_id(req.params.workId);
	if (workId === null) {
		return res.status(400).json({ error: "Invalid work id" });
	}
	try {
		const { getCommentsForWork } = await import("../db/social.queries");
		const comments = await getCommentsForWork(workId);
		return res.status(200).json({ comments });
	} catch (error) {
		return handle_known_error(error, res, "Failed to list comments");
	}
}

export async function delete_comment_handler(req: Request<{ commentId: string }>, res: Response<void | ErrorResponse>) {
	const commentId = parse_id(req.params.commentId);
	if (commentId === null) {
		return res.status(400).json({ error: "Invalid comment id" });
	}
	try {
		await remove_comment(req.user!.userId, commentId);
		return res.status(204).send();
	} catch (error) {
		return handle_known_error(error, res, "Failed to delete comment");
	}
}

export async function get_composition_handler(
	req: Request<{ workId: string }>,
	res: Response<GetWorkCompositionResponse | ErrorResponse>,
) {
	const workId = parse_id(req.params.workId);
	if (workId === null) {
		return res.status(400).json({ error: "Invalid work id" });
	}
	try {
		const composition = await get_work_composition(workId);
		return res.status(200).json({ composition });
	} catch (error) {
		return handle_known_error(error, res, "Failed to load piece composition");
	}
}
