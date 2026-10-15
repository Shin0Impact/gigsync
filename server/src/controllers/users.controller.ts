import { Request, Response } from "express";
import { get_user_profile, search_users } from "../services/users.service";
import { ErrorResponse, GetUserProfileResponse, ListUsersSearchResponse } from "../types";

// GET /api/users/search?q= - public directory search by name/handle.
export async function search_users_handler(
	req: Request<Record<string, never>, unknown, unknown, { q?: string }>,
	res: Response<ListUsersSearchResponse | ErrorResponse>,
) {
	try {
		const users = await search_users(typeof req.query.q === "string" ? req.query.q : "");
		return res.status(200).json({ users });
	} catch (error) {
		if (error instanceof Error && error.message.startsWith("Search query")) {
			return res.status(400).json({ error: error.message });
		}
		console.error("Failed to search users:", error);
		return res.status(500).json({ error: "Failed to search users" });
	}
}

// GET /api/users/:identifier - public. :identifier is either a user UUID or
// a user_name, so the frontend can support mezzo.social/<user_name> profile
// URLs without a separate lookup endpoint per identifier type.
export async function get_user_handler(
	req: Request<{ identifier: string }>,
	res: Response<GetUserProfileResponse | ErrorResponse>,
) {
	try {
		const profile = await get_user_profile(req.params.identifier);
		return res.status(200).json({ profile });
	} catch (error) {
		if (error instanceof Error && error.message === "User not found") {
			return res.status(404).json({ error: error.message });
		}

		console.error("Failed to get user profile:", error);

		return res.status(500).json({
			error: "Failed to get user profile",
		});
	}
}
