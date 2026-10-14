import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { LogOut, UserRoundCog } from "lucide-react";
import { ThemeToggle } from "../components/ui/ThemeToggle";
import { ConfirmDialog } from "../components/ui";
import ProfilePicture from "../components/user/ProfilePicture";
import { useLogoutMutation, useMeQuery } from "../features/auth/authApi";
import { getRememberedAccounts, forgetAccount, type RememberedAccount } from "../features/auth/accountSwitcher";
import { api } from "../shared/api";
import { ROUTES } from "../routes/routePaths";
import type { AppDispatch } from "../app/store";
import styles from "./SettingsPage.module.css";

// The site had no settings entry point at all - no logout, nowhere that
// showed which account was signed in, nothing. This is that entry point:
// appearance (ThemeToggle), the current account, and a quick way back
// into the login form for a different one. There's no backend support
// yet for two sessions at once, so "switch" here means "sign out of
// this one and jump straight to the login form with that account's
// username already filled in" (see accountSwitcher.ts and FormLogin.tsx's
// ?as= handling), not a seamless swap - a real multi-session switcher
// would need its own session-store work on the server.
export default function SettingsPage() {
	const navigate = useNavigate();
	const dispatch = useDispatch<AppDispatch>();
	const { data } = useMeQuery();
	const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();
	const [confirmingLogout, setConfirmingLogout] = useState(false);
	const [knownAccounts, setKnownAccounts] = useState<RememberedAccount[]>(() => getRememberedAccounts());

	const profile = data?.profile;
	const role = data?.user?.role;
	const otherAccounts = knownAccounts.filter((account) => account.userName !== profile?.userName);

	async function handleLogout(switchToUserName?: string) {
		try {
			await logout().unwrap();
		} catch {
			// The cookies are what actually matter for auth - even if this
			// request itself fails (already logged out elsewhere, network
			// hiccup), still clear local state and send the user to the
			// login form below.
		}
		dispatch(api.util.resetApiState());
		navigate(switchToUserName ? `${ROUTES.LOGIN}?as=${encodeURIComponent(switchToUserName)}` : ROUTES.LOGIN, {
			replace: true,
		});
	}

	function handleForget(userName: string) {
		forgetAccount(userName);
		setKnownAccounts((current) => current.filter((account) => account.userName !== userName));
	}

	return (
		<div className={styles.page}>
			<h1 className={styles.title}>Settings</h1>

			<section className={styles.section}>
				<h2 className={styles.sectionTitle}>Appearance</h2>
				<p className={styles.sectionHint}>Light is the default - switch any time, it's remembered on this device.</p>
				<ThemeToggle size="md" />
			</section>

			<section className={styles.section}>
				<h2 className={styles.sectionTitle}>Account</h2>

				{profile && (
					<div className={styles.currentAccount}>
						<ProfilePicture
							avatarUrl={profile.avatarUrl}
							userName={profile.userName}
							variant="nav"
						/>
						<div>
							<p className={styles.accountName}>@{profile.userName}</p>
							{role && <p className={styles.accountRole}>{role}</p>}
						</div>
					</div>
				)}

				<button
					type="button"
					className={styles.logoutButton}
					onClick={() => setConfirmingLogout(true)}
					disabled={isLoggingOut}>
					<LogOut size={18} />
					Log out
				</button>

				{otherAccounts.length > 0 && (
					<div className={styles.switcher}>
						<p className={styles.sectionHint}>
							<UserRoundCog size={16} />
							Switch to an account you've used on this device
						</p>
						<ul className={styles.accountList}>
							{otherAccounts.map((account) => (
								<li
									key={account.userName}
									className={styles.accountRow}>
									<ProfilePicture
										avatarUrl={account.avatarUrl}
										userName={account.userName}
										variant="nav"
									/>
									<span className={styles.accountName}>@{account.userName}</span>
									<button
										type="button"
										className={styles.switchButton}
										onClick={() => handleLogout(account.userName)}
										disabled={isLoggingOut}>
										Switch
									</button>
									<button
										type="button"
										className={styles.forgetButton}
										aria-label={`Forget ${account.userName}`}
										onClick={() => handleForget(account.userName)}>
										×
									</button>
								</li>
							))}
						</ul>
					</div>
				)}
			</section>

			<ConfirmDialog
				isOpen={confirmingLogout}
				title="Log out?"
				message="You'll need to log back in to see your feed, messages, and profile again."
				confirmLabel={isLoggingOut ? "Logging out\u2026" : "Log out"}
				cancelLabel="Stay logged in"
				isConfirming={isLoggingOut}
				onConfirm={() => handleLogout()}
				onCancel={() => setConfirmingLogout(false)}
			/>
		</div>
	);
}
