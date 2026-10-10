import { Request, Response } from "express";
import { get_user_profile } from "../services/users.service";
import { ErrorResponse, GetUserProfileResponse } from "../types";

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
