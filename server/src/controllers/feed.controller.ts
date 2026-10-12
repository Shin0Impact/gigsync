import { Request, Response } from "express";
import { get_feed } from "../services/feed.service";
import { ErrorResponse } from "../types";
import { ListFeedResponse } from "../types/social";

function handle_known_error(error: unknown, res: Response, fallback: string) {
	console.error(fallback, error);
	return res.status(500).json({ error: fallback });
}

interface FeedQuery {
	limit?: string;
	offset?: string;
}

// GET /api/feed/timeline - work updates + events from accounts the viewer
// follows, newest first. Auth required (follows are per-user); the route
// enforces it, so req.user is always set here.
export async function get_timeline_handler(
	req: Request<Record<string, never>, unknown, unknown, FeedQuery>,
	res: Response<ListFeedResponse | ErrorResponse>,
) {
	try {
		const { limit, offset } = req.query;
		const result = await get_feed({
			scope: "timeline",
			viewerId: req.user!.userId,
			limit: limit ? Number(limit) : undefined,
			offset: offset ? Number(offset) : undefined,
		});
		return res.status(200).json(result);
	} catch (error) {
		if (error instanceof Error && error.message === "Must be signed in to view the timeline feed") {
			return res.status(401).json({ error: error.message });
		}
		return handle_known_error(error, res, "Failed to load timeline feed");
	}
}

// GET /api/feed/discovery - the most recent work updates + events from
// ALL accounts, newest first. Public (same posture as the works explore
// feed and event listing).
export async function get_discovery_handler(
	req: Request<Record<string, never>, unknown, unknown, FeedQuery>,
	res: Response<ListFeedResponse | ErrorResponse>,
) {
	try {
		const { limit, offset } = req.query;
		const result = await get_feed({
			scope: "discovery",
			limit: limit ? Number(limit) : undefined,
			offset: offset ? Number(offset) : undefined,
		});
		return res.status(200).json(result);
	} catch (error) {
		return handle_known_error(error, res, "Failed to load discovery feed");
	}
}
