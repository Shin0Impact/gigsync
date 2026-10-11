import { Logo } from "../../components/Logo";
import { useMeQuery } from "../../features/auth/authApi";
import { ROUTES } from "../../routes/routePaths";
import { ButtonLink } from "../ui/Button/ButtonLink";
import ProfilePicture from "../user/ProfilePicture";
import styles from "./Navbar.module.css";

interface NavbarProps {
	role: "creative" | "supporter" | "organizer";
}

export function Navbar({ role }: NavbarProps) {
	const { data, isLoading } = useMeQuery();
	const profile = data?.profile;

	return (
		<nav className={styles.navbar}>
			{role === "supporter" && (
				<ButtonLink
					to={ROUTES.HOME}
					variant="logo"
					className={styles.logoLink}
					aria-label="Home">
					<Logo
						variant="mark"
						size="l"
					/>
				</ButtonLink>
			)}

			<ul className={styles.links}>
				<li>
					<ButtonLink
						to={ROUTES.TIMELINE}
						variant="ghost">
						Following
					</ButtonLink>
				</li>
				<li>
					<ButtonLink
						to={ROUTES.DISCOVERY}
						variant="ghost">
						Explore
					</ButtonLink>
				</li>
			</ul>

			{/* Previously linked by userId, but ROUTES.PROFILE takes a username -
			   visiting your own nav avatar 404'd. profile.userName now comes back
			   on /api/auth/me (see MeResponse), so this is the one place that
			   actually needs it. Skip rendering the link until it's loaded rather
			   than guessing at a URL. */}
			{profile ? (
				<ButtonLink to={ROUTES.PROFILE(profile.userName)}>
					<ProfilePicture
						avatarUrl={profile.avatarUrl}
						userName={profile.userName}
						variant="profile"
					/>
				</ButtonLink>
			) : (
				<ProfilePicture
					isLoading={isLoading}
					variant="profile"
				/>
			)}
		</nav>
	);
}
