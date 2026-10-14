import { useEffect } from "react";
import { useMeQuery } from "../features/auth/authApi";
import { rememberAccount } from "../features/auth/accountSwitcher";

// Keeps the lightweight "known accounts on this device" list
// (features/auth/accountSwitcher.ts) in sync with whoever is actually
// signed in right now, so the quick-switch list on the Settings page is
// never stale. Mounted once from Layout.tsx, same spot as
// useSocketConnection.
export function useRememberCurrentAccount() {
	const { data } = useMeQuery();
	const user = data?.user;
	const profile = data?.profile;

	useEffect(() => {
		if (!user || !profile) return;
		rememberAccount({
			userName: profile.userName,
			role: user.role,
			avatarUrl: profile.avatarUrl,
		});
	}, [user, profile]);
}
