import { listFeed } from "../db/queries/feed.queries";
import { getFollowedUserIds } from "../db/social.queries";
import { ListFeedResponse } from "../types/social";

const FEED_PAGE_SIZE = 20;
const MAX_FEED_PAGE_SIZE = 50;

function clamp_limit(requested: number | undefined): number {
	if (!requested || !Number.isFinite(requested) || requested <= 0) {
		return FEED_PAGE_SIZE;
	}
	return Math.min(requested, MAX_FEED_PAGE_SIZE);
}

export interface GetFeedParams {
	// timeline = only accounts the viewer follows (needs a viewer);
	// discovery = every account on the app.
	scope: "timeline" | "discovery";
	viewerId?: string | null;
	limit?: number;
	offset?: number;
}

export async function get_feed(params: GetFeedParams): Promise<ListFeedResponse> {
	const limit = clamp_limit(params.limit);
	const offset = Math.max(0, params.offset ?? 0);

	let authorIds: string[] | undefined;
	if (params.scope === "timeline") {
		if (!params.viewerId) {
			throw new Error("Must be signed in to view the timeline feed");
		}
		authorIds = await getFollowedUserIds(params.viewerId);
		if (authorIds.length === 0) {
			return { items: [] };
		}
	}

	const items = await listFeed({ limit, offset, authorIds });
	return { items };
}
