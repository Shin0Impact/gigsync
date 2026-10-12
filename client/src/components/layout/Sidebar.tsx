import { Link } from "react-router-dom";
import styles from "./Sidebar.module.css";
import { ROUTES } from "../../routes/routePaths";
import { Logo } from "@components/Logo";
import { LinkNav } from "@components/ui/Link";

interface SidebarProps {
	role: "creative" | "supporter" | "organizer" | "guest";
}

interface NavItem {
	to: string;
	label: string;
}

// Plain data, not markup - adding/removing/reordering a link for a role
// means editing this list, never touching SidebarNavList or SidebarShell
// below. New Piece/New Intermezzo used to live up here too, but both are
// one tap away from the + FAB on every creative page now (see Layout.tsx),
// so a dedicated nav entry for them was just a second, redundant path.
// Studio/Pieces/Portfolio used to be separate nav entries pointing at
// pages that all just showed some slice of "your own pieces" - they're
// merged into the Profile page now (Posts/Portfolio tabs), reached via
// the avatar in the Navbar, so there's no separate link for them here.
const NAV_ITEMS: Partial<Record<SidebarProps["role"], NavItem[]>> = {
	creative: [
		{ to: ROUTES.TIMELINE, label: "Following" },
		{ to: ROUTES.DISCOVERY, label: "Explore" },
		{ to: ROUTES.EVENTS, label: "Events" },
		{ to: ROUTES.SEARCH, label: "Find Artists" },
		{ to: ROUTES.NOTIFICATIONS, label: "Notifications" },
	],
};

// The nav list itself - fills whatever height SidebarShell gives it, so
// the whole left column is doing navigation work instead of a few links
// huddled in the middle with empty space above and below.
function SidebarNavList({ items }: { items: NavItem[] }) {
	return (
		<nav className={styles.navList}>
			{items.map((item) => (
				<LinkNav
					key={item.to}
					to={item.to}
					color="invert"
					className={styles.navItem}>
					{item.label}
				</LinkNav>
			))}
		</nav>
	);
}

// The shared shell every role gets: a flat black panel (no more full-height
// logo-mark-as-background - that made the panel's shape depend on the
// brand glyph's own cutouts, which fought with real nav content laid over
// it) with a small logo mark pinned at the top and whatever nav content is
// passed in filling the rest.
function SidebarShell({ children }: { children?: React.ReactNode }) {
	return (
		<div className={styles.sidebar}>
			<Link
				to={ROUTES.HOME}
				className={styles.glyphArea}
				aria-label="Home">
				<Logo
					variant="mark"
					orientation="vertical"
					purpose="static"
					size="s"
					className={styles.glyphIcon}
				/>
			</Link>
			{children}
		</div>
	);
}

const defaultSidebar = <SidebarShell />;

const creativeSidebar = (
	<SidebarShell>
		<SidebarNavList items={NAV_ITEMS.creative!} />
	</SidebarShell>
);

export function Sidebar({ role }: SidebarProps) {
	switch (role) {
		case "creative":
			return creativeSidebar;
		default:
			return defaultSidebar;
	}
}
