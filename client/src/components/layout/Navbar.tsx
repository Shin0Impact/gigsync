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
	const user = data?.user;

	return (
		<nav className={styles.navbar}>
			{role === "supporter" && (
				<ButtonLink
					to={ROUTES.FOLLOWING}
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
						to={ROUTES.FOLLOWING}
						variant="ghost">
						Timeline
					</ButtonLink>
				</li>
				<li>
					<ButtonLink
						to={ROUTES.EXPLORE}
						variant="ghost">
						Discovery
					</ButtonLink>
				</li>
			</ul>

			<ButtonLink to={ROUTES.PROFILE(user!.userId)}>
				<ProfilePicture
					isLoading={isLoading}
					variant="profile"
				/>
			</ButtonLink>
		</nav>
	);
}
