export interface RememberedAccount {
	userName: string;
	role: "artist" | "organizer" | "fan" | "admin" | "moderator";
	avatarUrl: string | null;
}

const STORAGE_KEY = "gigsync:known-accounts";

// Nothing secret lives here - just enough to recognize an account and
// jump the login form's identifier field straight to it (that field
// already accepts a username, not just an email - see FormLogin.tsx).
// No password, token, or session is ever stored client-side, and the
// backend has no concept of multiple simultaneous sessions yet, so this
// is a faster way *into the login form* for a different account, not a
// true switch without re-entering a password. See SettingsPage.tsx.
function readAll(): RememberedAccount[] {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];
		return parsed.filter(
			(entry): entry is RememberedAccount => typeof entry?.userName === "string" && typeof entry?.role === "string",
		);
	} catch {
		return [];
	}
}

function writeAll(accounts: RememberedAccount[]) {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
	} catch {
		// Best-effort only - nothing breaks if this doesn't persist.
	}
}

export function getRememberedAccounts(): RememberedAccount[] {
	return readAll();
}

export function rememberAccount(account: RememberedAccount) {
	const accounts = readAll().filter((entry) => entry.userName !== account.userName);
	accounts.unshift(account);
	writeAll(accounts.slice(0, 5));
}

export function forgetAccount(userName: string) {
	writeAll(readAll().filter((entry) => entry.userName !== userName));
}
