import { Link } from "react-router-dom";
import styles from "./Sidebar.module.css";
import { ROUTES } from "../../routes/routePaths";
import { Logo } from "@components/Logo";
import { LinkNav } from "@components/ui/Link";

interface SidebarProps {
	role: "creative" | "supporter" | "organizer" | "guest";
}

const defaultSidebar = (
	<div className={styles.sidebar}>
		<div className={styles.glyphContainer}>
			<Link
				to={ROUTES.HOME}
				className={styles.glyphArea}
				aria-label="Home">
				<Logo
					variant="mark"
					orientation="vertical"
					size="fill"
					className={styles.verticalGlyph}
				/>
			</Link>
		</div>
	</div>
);

const creativeSidebar = (
	<div className={styles.sidebar}>
		<div className={styles.glyphContainer}>
			<Link
				to={ROUTES.HOME}
				className={styles.glyphArea}
				aria-label="Home">
				<Logo
					variant="mark"
					orientation="vertical"
					purpose="static"
					size="fill"
					className={styles.verticalGlyph}
				/>
			</Link>
		</div>
		<div className={styles.linkContainer}>
			<aside className={styles.sidebarActions}>
				<LinkNav
					to={ROUTES.CREATE_PIECE}
					color="invert">
					New Piece
				</LinkNav>
				<LinkNav
					to={ROUTES.CREATE_INTERMEZZO}
					color="invert">
					New Intermezzo
				</LinkNav>
			</aside>
			<nav className={styles.navLinks}>
				<LinkNav to={ROUTES.DASHBOARD}>Studio</LinkNav>
			</nav>
			<aside className={styles.sidebarNav}>
				<LinkNav
					to={ROUTES.PIECES}
					color="invert">
					Pieces
				</LinkNav>
				<LinkNav
					to={ROUTES.PORTFOLIO}
					color="invert">
					Portfolio
				</LinkNav>
			</aside>
			{/* <span className={styles.sidebarWordmark}>Mezzo</span> */}
		</div>
	</div>
);

export function Sidebar({ role }: SidebarProps) {
	switch (role) {
		case "creative":
			return creativeSidebar;
		default:
			return defaultSidebar;
	}
}
