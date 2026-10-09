import { ButtonLink } from "@components/ui";
import { Logo } from "../../components/Logo";
import { ROUTES } from "../../routes/routePaths";
import styles from "./GuestNavigation.module.css";

export function GuestNavigation() {
	return (
		<nav className={styles.navbar}>
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

			<ul className={styles.links}>
				<li>
					<ButtonLink
						href="#about"
						variant="ghost">
						About
					</ButtonLink>
				</li>
				<li>
					<ButtonLink
						href="#mission"
						variant="ghost">
						Mission
					</ButtonLink>
				</li>
				<li>
					<ButtonLink
						href="#features"
						variant="ghost">
						Features
					</ButtonLink>
				</li>
			</ul>

			<ButtonLink
				to={ROUTES.SIGNUP}
				variant="expandable"
				hoverText="→">
				Start creating
			</ButtonLink>
		</nav>
	);
}
