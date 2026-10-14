import { Request, Response } from "express";
import {
	change_password,
	login_user,
	refresh_tokens,
	register_user,
	request_password_reset,
	resend_email_verification,
	reset_password,
	verify_email,
} from "../services/auth.service";
import { get_my_profile } from "../services/users.service";
import {
	RegisterInput,
	LoginInput,
	RegisterResponse,
	LoginResponse,
	RefreshResponse,
	MeResponse,
	ChangePasswordInput,
	ForgotPasswordInput,
	ResetPasswordInput,
	VerifyEmailInput,
	MessageResponse,
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
		const { email, password, role, user_name, name, artists_type } = req.body;

		if (!email || !password || !role || !user_name || !name) {
			return res.status(400).json({
				error: "email, password, role, user_name, and name are required",
			});
		}

		const result = await register_user({
			email,
			password,
			role,
			user_name,
			name,
			artists_type,
		});

		const { password_hash: _password_hash, ...safe_user } = result.user;

		const response: RegisterResponse = {
			user: safe_user,
			role: result.role,
			profile: result.profile,
		};

		// No mail provider is wired up yet - outside production, hand the
		// fresh verification token back so the flow is testable end to end
		// (see mailer.service.ts). Never set in production builds.
		if (process.env.NODE_ENV !== "production") {
			response.dev_email_verification_token = result.email_verification_token;
		}

		return res.status(201).json(response);
	} catch (error) {
		if (
			error instanceof Error &&
			(error.message === "Email is already registered" || error.message === "Username is already taken")
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
				error.message === "Name is required" ||
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
			// Frontend (Cloudflare Workers) and API (Render) are different
			// registrable domains, so this is a cross-site request from the
			// browser's perspective - SameSite=Lax cookies never get attached to
			// those fetches, which is why "logged in" kept bouncing back to the
			// landing page right after a successful login. None is required for
			// cross-site, and browsers require Secure whenever SameSite=None is
			// used (true in production, where secure above is also true).
			secure: process.env.NODE_ENV === "production",
			sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
			maxAge: 15 * 60 * 1000,
		});

		// "Remember me" unchecked: no maxAge at all makes this a session
		// cookie, cleared when the browser closes, instead of persisting for
		// REMEMBER_ME_COOKIE_MAX_AGE_MS regardless of what the user picked.
		res.cookie("refresh_token", result.refresh_token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
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
			sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
			maxAge: 15 * 60 * 1000,
		});

		// Carries forward whatever "remember me" was chosen at login (see
		// refresh_tokens in auth.service.ts) - a session that started as
		// session-only shouldn't quietly become persistent just because its
		// access token expired and got silently refreshed.
		res.cookie("refresh_token", result.refresh_token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
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
	// clearCookie must be called with the same secure/sameSite options the
	// cookie was originally set with, or the browser won't recognize it as
	// the same cookie to delete - this was silently no-opping the clear on
	// the cross-site (Workers <-> Render) deployment, so "logging out" left
	// the old access/refresh cookies in place and the user stayed signed in.
	const cookieOptions = {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: (process.env.NODE_ENV === "production" ? "none" : "lax") as "none" | "lax",
	} as const;

	res.clearCookie("access_token", cookieOptions);
	res.clearCookie("refresh_token", cookieOptions);
	res.status(204).send();
}

// Hydrated session: the frontend needs username/avatar/role/artist type to
// render the logged-in shell, and the JWT payload alone only carries
// { userId, role } - so this joins profiles + roles (and email) from the DB.
// What the middleware decoded is only used to know *who* to look up.
export async function me(req: Request, res: Response<MeResponse | ErrorResponse>) {
	try {
		const user = await get_my_profile(req.user!.userId);
		return res.json({ user });
	} catch (error) {
		if (error instanceof Error && error.message === "Profile not found") {
			return res.status(404).json({ error: error.message });
		}

		console.error("Failed to load current user:", error);

		return res.status(500).json({
			error: "Failed to load current user",
		});
	}
}

// --- Account recovery handlers ----------------------------------------------

const RECOVERY_BAD_REQUEST_MESSAGES = [
	"currentPassword and newPassword are required",
	"Current password is incorrect",
	"Password must be at least 8 characters",
	"email is required",
	"token and newPassword are required",
	"token is required",
];

function handle_recovery_error(error: unknown, res: Response, fallback: string) {
	if (error instanceof Error) {
		if (error.message === "User not found") {
			return res.status(404).json({ error: error.message });
		}
		if (RECOVERY_BAD_REQUEST_MESSAGES.includes(error.message) || error.message.startsWith("Invalid or expired")) {
			return res.status(400).json({ error: error.message });
		}
	}

	console.error(fallback, error);

	return res.status(500).json({ error: fallback });
}

// POST /api/auth/change-password (authenticated)
export async function change_password_handler(
	req: Request<Record<string, never>, unknown, ChangePasswordInput>,
	res: Response<MessageResponse | ErrorResponse>,
) {
	try {
		await change_password(req.user!.userId, req.body?.currentPassword, req.body?.newPassword);
		return res.status(200).json({ message: "Password changed successfully" });
	} catch (error) {
		return handle_recovery_error(error, res, "Failed to change password");
	}
}

// POST /api/auth/forgot-password (public) - identical response whether or
// not the email exists, so it can't be used to enumerate accounts. The
// devResetToken field is only present in non-production builds (no mail
// provider yet - see mailer.service.ts).
export async function forgot_password_handler(
	req: Request<Record<string, never>, unknown, ForgotPasswordInput>,
	res: Response<MessageResponse | ErrorResponse>,
) {
	try {
		const result = await request_password_reset(req.body?.email);

		const response: MessageResponse = {
			message: "If an account exists for that email, a reset link has been sent.",
		};
		if (process.env.NODE_ENV !== "production" && result.dev_token) {
			response.devResetToken = result.dev_token;
		}

		return res.status(200).json(response);
	} catch (error) {
		return handle_recovery_error(error, res, "Failed to request password reset");
	}
}

// POST /api/auth/reset-password (public) - consumes a single-use token.
export async function reset_password_handler(
	req: Request<Record<string, never>, unknown, ResetPasswordInput>,
	res: Response<MessageResponse | ErrorResponse>,
) {
	try {
		await reset_password(req.body?.token, req.body?.newPassword);
		return res.status(200).json({ message: "Password reset successfully" });
	} catch (error) {
		return handle_recovery_error(error, res, "Failed to reset password");
	}
}

// POST /api/auth/verify-email (public) - token possession proves inbox
// control, so no auth is required.
export async function verify_email_handler(
	req: Request<Record<string, never>, unknown, VerifyEmailInput>,
	res: Response<MessageResponse | ErrorResponse>,
) {
	try {
		await verify_email(req.body?.token);
		return res.status(200).json({ message: "Email verified successfully" });
	} catch (error) {
		return handle_recovery_error(error, res, "Failed to verify email");
	}
}

// POST /api/auth/resend-verification (authenticated)
export async function resend_verification_handler(req: Request, res: Response<MessageResponse | ErrorResponse>) {
	try {
		const result = await resend_email_verification(req.user!.userId);

		const response: MessageResponse = {
			message: "Verification email sent",
		};
		if (process.env.NODE_ENV !== "production") {
			response.devVerificationToken = result.dev_token;
		}

		return res.status(200).json(response);
	} catch (error) {
		return handle_recovery_error(error, res, "Failed to resend verification email");
	}
}
