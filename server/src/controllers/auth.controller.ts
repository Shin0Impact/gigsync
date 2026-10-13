import { Request, Response } from "express";
import { login_user, refresh_tokens, register_user } from "../services/auth.service";
import { getProfileByUserId } from "../db/social.queries";
import {
	RegisterInput,
	LoginInput,
	RegisterResponse,
	LoginResponse,
	RefreshResponse,
	MeResponse,
	ErrorResponse,
} from "../types";

// Matches env.jwt.refreshExpiresIn's 7-day default - kept as a literal
// here rather than parsed from that string because res.cookie wants a
// number of milliseconds, not a jsonwebtoken-style duration string.
const REMEMBER_ME_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export async function register(
	req: Request<Record<string, never>, unknown, RegisterInput>,
	res: Response<RegisterResponse | ErrorResponse>,
) {
	try {
		const { email, password, role, user_name, artists_type } = req.body;

		if (!email || !password || !role || !user_name) {
			return res.status(400).json({
				error: "email, password, role, and user_name are required",
			});
		}

		const result = await register_user({
			email,
			password,
			role,
			user_name,
			artists_type,
		});

		const { password_hash: _password_hash, ...safe_user } = result.user;

		return res.status(201).json({
			user: safe_user,
			role: result.role,
			profile: result.profile,
		});
	} catch (error) {
		if (
			error instanceof Error &&
			(error.message === "Email is already registered" ||
				error.message === "Username is already taken")
		) {
			return res.status(409).json({
				error: error.message,
			});
		}

		if (
			error instanceof Error &&
			(error.message === "Artist type is required for artists" ||
				error.message === "Only artists can have an artist type" ||
				error.message === "Invalid role" ||
				error.message === "Password must be at least 8 characters")
		) {
			return res.status(400).json({
				error: error.message,
			});
		}

		console.error("Registration failed:", error);

		return res.status(500).json({
			error: "Registration failed",
		});
	}
}

export async function login(
	req: Request<Record<string, never>, unknown, LoginInput>,
	res: Response<LoginResponse | ErrorResponse>,
) {
	try {
		const { identifier, password, rememberMe = true } = req.body;

		if (!identifier || !password) {
			return res.status(400).json({
				error: "identifier and password are required",
			});
		}

		const result = await login_user({
			identifier,
			password,
			rememberMe,
		});

		res.cookie("access_token", result.access_token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			maxAge: 15 * 60 * 1000,
		});

		// "Remember me" unchecked: no maxAge at all makes this a session
		// cookie, cleared when the browser closes, instead of persisting for
		// REMEMBER_ME_COOKIE_MAX_AGE_MS regardless of what the user picked.
		res.cookie("refresh_token", result.refresh_token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			...(rememberMe ? { maxAge: REMEMBER_ME_COOKIE_MAX_AGE_MS } : {}),
		});

		const { password_hash: _password_hash, ...safe_user } = result.user;

		return res.status(200).json({
			user: safe_user,
			role: result.role,
		});
	} catch (error) {
		if (error instanceof Error && error.message === "Invalid credentials") {
			return res.status(401).json({
				error: "Invalid credentials",
			});
		}

		if (error instanceof Error && error.message === "User role not found") {
			return res.status(500).json({
				error: "User role not found",
			});
		}

		console.error("Login failed:", error);

		return res.status(500).json({
			error: "Login failed",
		});
	}
}

export async function refresh(req: Request, res: Response<RefreshResponse | ErrorResponse>) {
	try {
		const refresh_token = req.cookies?.refresh_token;

		if (!refresh_token) {
			return res.status(401).json({
				error: "Refresh token required",
			});
		}

		const result = await refresh_tokens(refresh_token);

		res.cookie("access_token", result.access_token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			maxAge: 15 * 60 * 1000,
		});

		// Carries forward whatever "remember me" was chosen at login (see
		// refresh_tokens in auth.service.ts) - a session that started as
		// session-only shouldn't quietly become persistent just because its
		// access token expired and got silently refreshed.
		res.cookie("refresh_token", result.refresh_token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			...(result.remember ? { maxAge: REMEMBER_ME_COOKIE_MAX_AGE_MS } : {}),
		});

		return res.status(200).json({
			message: "Token refreshed successfully",
		});
	} catch (error) {
		if (error instanceof Error && error.message === "Invalid or expired refresh token") {
			return res.status(401).json({
				error: "Invalid or expired refresh token",
			});
		}

		if (error instanceof Error && error.message === "User role not found") {
			return res.status(500).json({
				error: "User role not found",
			});
		}

		console.error("Token refresh failed:", error);

		return res.status(500).json({
			error: "Token refresh failed",
		});
	}
}

export async function logout(_req: Request, res: Response<void>) {
	res.clearCookie("access_token");
	res.clearCookie("refresh_token");
	res.status(204).send();
}

export async function me(req: Request, res: Response<MeResponse>) {
	if (!req.user) {
		return res.json({ user: null, profile: null });
	}

	// Resolved alongside the JWT payload so the client always has its own
	// username/avatar without a second round trip - the Navbar profile
	// link, the global post composer, etc. all need this. Best-effort: a
	// missing profile row shouldn't fail /me, just come back as null.
	const profileRow = await getProfileByUserId(req.user.userId);
	const profile = profileRow
		? {
				userName: profileRow.userName,
				avatarUrl: profileRow.avatarUrl,
				artistsType: profileRow.artistsType,
			}
		: null;

	res.json({ user: req.user, profile });
}
