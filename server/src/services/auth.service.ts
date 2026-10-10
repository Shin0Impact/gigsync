import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";
import crypto from "crypto";

import { pool } from "../config/db";
import {
	create_user,
	find_user_by_email,
	find_user_by_id,
	find_user_by_identifier,
	mark_user_email_verified,
	update_user_password,
} from "../db/queries/users.queries";
import { create_profile, find_profile_by_user_name } from "../db/queries/profiles.queries";
import { create_role, find_role_by_user_id } from "../db/queries/roles.queries";
import {
	create_auth_token,
	find_valid_auth_token,
	mark_auth_token_used,
} from "../db/queries/auth-tokens.queries";
import { send_email } from "./mailer.service";

import { env } from "../config/env";
import { AuthTokenPayload, UserRole, ArtistCategory, RegisterInput, LoginInput } from "../types";

// --- Account-recovery token constants ------------------------------------
//
// The raw token goes to the user (email link); only its SHA-256 hash is
// stored, so a leaked DB row alone can't reset anything. Single-use via
// used_at, expiring via expires_at, and creating a new token of the same
// type invalidates the user's older unused ones (see auth-tokens.queries).
const PASSWORD_RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const EMAIL_VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function generate_token_pair(): { raw: string; hash: string } {
	const raw = crypto.randomBytes(32).toString("hex");
	const hash = crypto.createHash("sha256").update(raw).digest("hex");
	return { raw, hash };
}

// Roles a person can self-assign through public registration. `admin` and
// `moderator` are deliberately excluded - those accounts review/approve
// verification requests and can view other users' uploaded ID documents,
// so they must be created out-of-band (a seed script, or an existing
// admin promoting someone), never picked by whoever fills out the signup
// form. `role` is typed as `UserRole` (includes admin/moderator) because
// that's what the rest of the app needs it to be after this check passes -
// this whitelist is what actually enforces the restriction at runtime.
const SELF_REGISTERABLE_ROLES: UserRole[] = ["artist", "organizer", "fan"];

export async function register_user(input: RegisterInput) {
	const { email, password, role, user_name, name, artists_type = null } = input;

	if (!SELF_REGISTERABLE_ROLES.includes(role)) {
		throw new Error("Invalid role");
	}

	if (!name || !name.trim()) {
		throw new Error("Name is required");
	}

	// Only a length floor, not a complexity rule (no forced uppercase/
	// digit/symbol) - NIST 800-63B's current guidance is that a minimum
	// length does more for real-world security than arbitrary composition
	// rules, which mostly just push people toward predictable patterns
	// like "Password1!". The controller already rejected a missing
	// password outright; this only rejects one that's too short to be
	// worth hashing and storing.
	const MIN_PASSWORD_LENGTH = 8;
	if (password.length < MIN_PASSWORD_LENGTH) {
		throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
	}

	const existing_user = await find_user_by_email(email);

	if (existing_user) {
		throw new Error("Email is already registered");
	}

	const existing_profile = await find_profile_by_user_name(user_name);

	if (existing_profile) {
		throw new Error("Username is already taken");
	}

	if (role === "artist" && !artists_type) {
		throw new Error("Artist type is required for artists");
	}

	if (role !== "artist" && artists_type) {
		throw new Error("Only artists can have an artist type");
	}

	const password_hash = await bcrypt.hash(password, 12);

	const client = await pool.connect();

	try {
		await client.query("BEGIN");

		const user = await create_user(client, email, password_hash);

		const role_record = await create_role(client, user.id, role);

		const profile = await create_profile(client, user.id, user_name, name.trim(), artists_type);

		// Every new account starts unverified; issue the first email
		// verification token in the same transaction so the flow works
		// even before any mail provider exists (the raw token is returned
		// to the caller, which only exposes it in non-production).
		const { raw, hash } = generate_token_pair();
		await create_auth_token(
			client,
			user.id,
			"email_verification",
			hash,
			new Date(Date.now() + EMAIL_VERIFICATION_TOKEN_TTL_MS),
		);

		await client.query("COMMIT");

		return {
			user,
			role: role_record,
			profile,
			email_verification_token: raw,
		};
	} catch (error) {
		await client.query("ROLLBACK");
		throw error;
	} finally {
		client.release();
	}
}

// Precomputed once at module load (same cost factor - 12 - used for real
// password hashes below) so login_user always has a hash to compare
// against, even when the account doesn't exist.
const DUMMY_PASSWORD_HASH = bcrypt.hashSync("dummy-password-for-constant-time-login", 12);

export async function login_user(input: LoginInput) {
	const { identifier, password } = input;

	const user = await find_user_by_identifier(identifier);

	// Always run bcrypt.compare, with the same cost factor, whether or not
	// the account exists - comparing against DUMMY_PASSWORD_HASH when it
	// doesn't. Previously a missing user returned immediately, skipping
	// bcrypt.compare entirely; since that call consistently takes tens of
	// milliseconds, timing a batch of login attempts let an attacker tell
	// "no such account" apart from "wrong password" and enumerate valid
	// emails - even though the error message itself was already the same
	// generic "Invalid credentials" either way.
	const password_matches = await bcrypt.compare(
		password,
		user?.password_hash ?? DUMMY_PASSWORD_HASH,
	);

	if (!user || !password_matches) {
		throw new Error("Invalid credentials");
	}

	const role_record = await find_role_by_user_id(user.id);

	if (!role_record) {
		throw new Error("User role not found");
	}

	const payload: AuthTokenPayload = {
		userId: user.id,
		role: role_record.role,
	};

	const access_token_options: SignOptions = {
		expiresIn: env.jwt.accessExpiresIn as SignOptions["expiresIn"],
	};

	const refresh_token_options: SignOptions = {
		expiresIn: env.jwt.refreshExpiresIn as SignOptions["expiresIn"],
	};

	const access_token = jwt.sign(payload, env.jwt.accessSecret, access_token_options);

	const refresh_token = jwt.sign(payload, env.jwt.refreshSecret, refresh_token_options);

	return {
		user,
		role: role_record,
		access_token,
		refresh_token,
	};
}

export async function refresh_tokens(refresh_token: string) {
	let payload: AuthTokenPayload;

	try {
		payload = jwt.verify(refresh_token, env.jwt.refreshSecret) as AuthTokenPayload;
	} catch {
		throw new Error("Invalid or expired refresh token");
	}

	const role_record = await find_role_by_user_id(payload.userId);

	if (!role_record) {
		throw new Error("User role not found");
	}

	const new_payload: AuthTokenPayload = {
		userId: payload.userId,
		role: role_record.role,
	};

	const access_token_options: SignOptions = {
		expiresIn: env.jwt.accessExpiresIn as SignOptions["expiresIn"],
	};

	const refresh_token_options: SignOptions = {
		expiresIn: env.jwt.refreshExpiresIn as SignOptions["expiresIn"],
	};

	const new_access_token = jwt.sign(new_payload, env.jwt.accessSecret, access_token_options);

	const new_refresh_token = jwt.sign(new_payload, env.jwt.refreshSecret, refresh_token_options);

	return {
		access_token: new_access_token,
		refresh_token: new_refresh_token,
	};
}

// --- Account recovery -------------------------------------------------------
//
// change_password  (auth): verify the current password, store the new hash.
// Note the same caveat as logout: access tokens are stateless JWTs with no
// server-side session list, so an already-issued token lives out its 15
// minutes even after a password change.
export async function change_password(
	userId: string,
	currentPassword: string,
	newPassword: string,
) {
	if (!currentPassword || !newPassword) {
		throw new Error("currentPassword and newPassword are required");
	}

	const MIN_PASSWORD_LENGTH = 8;
	if (newPassword.length < MIN_PASSWORD_LENGTH) {
		throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
	}

	const user = await find_user_by_id(userId);
	if (!user) {
		throw new Error("User not found");
	}

	const current_matches = await bcrypt.compare(currentPassword, user.password_hash);
	if (!current_matches) {
		throw new Error("Current password is incorrect");
	}

	const new_hash = await bcrypt.hash(newPassword, 12);
	await update_user_password(userId, new_hash);
}

// request_password_reset (public): always resolves the same way whether or
// not the email exists - a response that says "unknown email" would let
// anyone probe for registered addresses. When the account exists, any
// previous reset token is invalidated and a fresh one is issued and
// "emailed" (currently the mailer stub - see mailer.service.ts).
export async function request_password_reset(email: string) {
	if (!email) {
		throw new Error("email is required");
	}

	const user = await find_user_by_email(email);

	if (!user) {
		return { delivered: false as const, dev_token: null as string | null };
	}

	const { raw, hash } = generate_token_pair();

	const client = await pool.connect();
	try {
		await client.query("BEGIN");
		await create_auth_token(
			client,
			user.id,
			"password_reset",
			hash,
			new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS),
		);
		await client.query("COMMIT");
	} catch (error) {
		await client.query("ROLLBACK");
		throw error;
	} finally {
		client.release();
	}

	await send_email({
		to: user.email,
		subject: "Reset your Mezzo password",
		text: `A password reset was requested for your account.\n\nReset token (valid for 1 hour): ${raw}\n\nIf this wasn't you, ignore this message.`,
	});

	return { delivered: true as const, dev_token: raw };
}

export async function reset_password(token: string, newPassword: string) {
	if (!token || !newPassword) {
		throw new Error("token and newPassword are required");
	}

	const MIN_PASSWORD_LENGTH = 8;
	if (newPassword.length < MIN_PASSWORD_LENGTH) {
		throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
	}

	const hash = crypto.createHash("sha256").update(token).digest("hex");
	const record = await find_valid_auth_token("password_reset", hash);

	if (!record) {
		throw new Error("Invalid or expired reset token");
	}

	const new_hash = await bcrypt.hash(newPassword, 12);
	await update_user_password(record.user_id, new_hash);
	await mark_auth_token_used(record.id);
}

// verify_email (public): token possession proves control of the inbox, so
// no auth is required - same model as reset_password.
export async function verify_email(token: string) {
	if (!token) {
		throw new Error("token is required");
	}

	const hash = crypto.createHash("sha256").update(token).digest("hex");
	const record = await find_valid_auth_token("email_verification", hash);

	if (!record) {
		throw new Error("Invalid or expired verification token");
	}

	await mark_user_email_verified(record.user_id);
	await mark_auth_token_used(record.id);
}

export async function resend_email_verification(userId: string) {
	const user = await find_user_by_id(userId);
	if (!user) {
		throw new Error("User not found");
	}

	const { raw, hash } = generate_token_pair();

	const client = await pool.connect();
	try {
		await client.query("BEGIN");
		await create_auth_token(
			client,
			userId,
			"email_verification",
			hash,
			new Date(Date.now() + EMAIL_VERIFICATION_TOKEN_TTL_MS),
		);
		await client.query("COMMIT");
	} catch (error) {
		await client.query("ROLLBACK");
		throw error;
	} finally {
		client.release();
	}

	await send_email({
		to: user.email,
		subject: "Verify your Mezzo email",
		text: `Verify your email address with this token (valid for 24 hours): ${raw}`,
	});

	return { dev_token: raw };
}
