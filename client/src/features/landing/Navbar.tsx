import { Logo } from "../../components/Logo";
import { ButtonLink } from "../../components/ButtonLink";
import navStyles from "./Navbar.module.css";
import { ROUTES } from "../../routes/routePaths";

export function Navbar() {
	return (
		<nav className={navStyles.navbar}>
			<ButtonLink
				to={ROUTES.HOME}
				variant="logo"
				className={navStyles.logoLink}
				aria-label="Home">
				<Logo
					variant="mark"
					size="l"
				/>
			</ButtonLink>

			<ul className={navStyles.links}>
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
