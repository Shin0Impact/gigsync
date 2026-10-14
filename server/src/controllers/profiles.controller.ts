import { Request, Response } from "express";
import {
	follow_profile,
	get_my_activity,
	get_profile_by_user_id,
	get_profile_by_username,
	unfollow_profile,
} from "../services/profiles.service";
import { ErrorResponse, FollowResponse, GetProfileResponse, ListMyActivityResponse } from "../types";

const NOT_FOUND_MESSAGES = ["Profile not found"];
const FORBIDDEN_MESSAGES = ["You cannot follow yourself"];

function handle_known_error(error: unknown, res: Response, fallback: string) {
	if (error instanceof Error) {
		if (NOT_FOUND_MESSAGES.includes(error.message)) {
			return res.status(404).json({ error: error.message });
		}
		if (FORBIDDEN_MESSAGES.includes(error.message)) {
			return res.status(403).json({ error: error.message });
		}
	}

	console.error(fallback, error);
	return res.status(500).json({ error: fallback });
}

export async function get_profile_handler(
	req: Request<{ username: string }>,
	res: Response<GetProfileResponse | ErrorResponse>,
) {
	try {
		const profile = await get_profile_by_username(req.params.username, req.user?.userId ?? null);
		return res.status(200).json({ profile });
	} catch (error) {
		return handle_known_error(error, res, "Failed to load profile");
	}
}

export async function get_profile_by_id_handler(
	req: Request<{ userId: string }>,
	res: Response<GetProfileResponse | ErrorResponse>,
) {
	try {
		const profile = await get_profile_by_user_id(req.params.userId, req.user?.userId ?? null);
		return res.json({ profile });
	} catch (error) {
		return handle_known_error(error, res, "Failed to fetch profile");
	}
}

export async function follow_profile_handler(
	req: Request<{ username: string }>,
	res: Response<FollowResponse | ErrorResponse>,
) {
	try {
		const result = await follow_profile(req.user!.userId, req.params.username);
		return res.status(200).json(result);
	} catch (error) {
		return handle_known_error(error, res, "Failed to follow profile");
	}
}

export async function unfollow_profile_handler(
	req: Request<{ username: string }>,
	res: Response<FollowResponse | ErrorResponse>,
) {
	try {
		const result = await unfollow_profile(req.user!.userId, req.params.username);
		return res.status(200).json(result);
	} catch (error) {
		return handle_known_error(error, res, "Failed to unfollow profile");
	}
}

export async function get_my_activity_handler(req: Request, res: Response<ListMyActivityResponse | ErrorResponse>) {
	try {
		const activity = await get_my_activity(req.user!.userId);
		return res.status(200).json({ activity });
	} catch (error) {
		return handle_known_error(error, res, "Failed to load activity");
	}
}
