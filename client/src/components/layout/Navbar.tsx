import { Logo } from "../../components/Logo";
import { ROUTES } from "../../routes/routePaths";
import { ButtonLink } from "../ui/Button/ButtonLink";
import styles from "./Navbar.module.css";

interface NavbarProps {
	role: "creative" | "supporter" | "organizer";
}

// The profile avatar that used to live here moved to the top of the
// Sidebar (see Sidebar.tsx's SidebarGlyph) - having it in both places
// was redundant and, on the creative pages this sits above, was most of
// what made the top of the page feel so tall. All that is left here is
// the supporter-only home logo; on every other role this renders an
// empty (zero-height) nav.
export function Navbar({ role }: NavbarProps) {
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

			{/* Following/Explore moved into the Sidebar nav list - see
			   Sidebar.tsx - so all navigation lives in one place. */}
		</nav>
	);
}
