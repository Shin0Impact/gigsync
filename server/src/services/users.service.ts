import {
	DbProfileWithRole,
	find_profile_with_role_by_user_id,
	find_profile_with_role_by_user_name,
	search_users_by_name,
} from "../db/queries/profiles.queries";
import { PublicProfile, UserRole, UserSearchResult } from "../types";

// Directory search by @handle or display name. Short queries are rejected
// (a single letter would match half the table).
export async function search_users(rawQuery: string): Promise<UserSearchResult[]> {
	const query = rawQuery.trim().replace(/^@/, "").slice(0, 50);
	if (query.length < 2) {
		throw new Error("Search query must be at least 2 characters");
	}
	const escaped = query.replace(/[\\%_]/g, (ch) => `\\${ch}`);
	const rows = await search_users_by_name(`%${escaped}%`, `${escaped}%`);
	return rows.map((row) => ({
		userId: row.user_id,
		userName: row.user_name,
		name: row.name,
		avatarUrl: row.avatar_url,
		role: row.role,
		artistsType: row.artists_type,
		isVerified: row.is_verified,
		followersNumber: Number(row.followers_number),
	}));
}

// Public profile lookup - the backend for mezzo.social/<user_name> profile
// pages. Resolves a single :identifier path param that can be either a user
// UUID or a user_name, so the frontend can route both /users/johndoe and
// /users/<uuid> to the same handler.

const UUID_PATTERN =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function to_public_profile(row: DbProfileWithRole): PublicProfile {
	return {
		userId: row.user_id,
		userName: row.user_name,
		name: row.name,
		role: row.role as UserRole,
		artistsType: row.artists_type,
		avatarUrl: row.avatar_url,
		isVerified: row.is_verified,
		followersNumber: row.followers_number,
		createdAt: row.created_at,
	};
}

export async function get_user_profile(identifier: string): Promise<PublicProfile> {
	// UUID-shaped identifiers hit the id index first; fall back to a
	// user_name lookup so a user_name that happens to look like a UUID
	// still resolves.
	if (UUID_PATTERN.test(identifier)) {
		const byId = await find_profile_with_role_by_user_id(identifier);
		if (byId) {
			return to_public_profile(byId);
		}
	}

	const byName = await find_profile_with_role_by_user_name(identifier);
	if (!byName) {
		throw new Error("User not found");
	}

	return to_public_profile(byName);
}

// Hydrated "who am I" - GET /api/auth/me returns this instead of the bare
// JWT payload so the frontend can render the logged-in user's header/
// profile from a single call.
export async function get_my_profile(userId: string) {
	const row = await find_profile_with_role_by_user_id(userId);
	if (!row) {
		throw new Error("Profile not found");
	}

	return {
		...to_public_profile(row),
		email: row.email,
		emailVerified: row.email_verified,
	};
}
