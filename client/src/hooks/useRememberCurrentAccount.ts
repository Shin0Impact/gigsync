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

	useEffect(() => {
		if (!user) return;
		rememberAccount({
			userName: user.userName,
			role: user.role,
			avatarUrl: user.avatarUrl,
		});
	}, [user]);
}
