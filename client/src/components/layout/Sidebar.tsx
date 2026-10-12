import { Link } from "react-router-dom";
import styles from "./Sidebar.module.css";
import { ROUTES } from "../../routes/routePaths";
import { Logo } from "@components/Logo";
import { LinkNav } from "@components/ui/Link";
import { useMeQuery } from "../../features/auth/authApi";
import ProfilePicture from "../user/ProfilePicture";

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
// pages that all just showed some slice of "your own pieces" - they are
// merged into the Profile page now (Posts/Portfolio tabs), reached via
// the avatar at the top of this sidebar, so there is no separate link
// for them here.
const NAV_ITEMS: Partial<Record<SidebarProps["role"], NavItem[]>> = {
	creative: [
		{ to: ROUTES.TIMELINE, label: "Following" },
		{ to: ROUTES.DISCOVERY, label: "Explore" },
		{ to: ROUTES.EVENTS, label: "Events" },
		{ to: ROUTES.SEARCH, label: "Find Artists" },
		{ to: ROUTES.MESSAGES, label: "Messages" },
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

// Pinned at the top of the sidebar: the signed-in user's own profile
// picture (small - see Sidebar.module.css's .glyphAvatar), linking to
// their profile page. This replaces what used to be a big avatar in the
// Navbar plus a separate logo mark here - two places showing roughly the
// same "who am I / go to my stuff" affordance, eating vertical space at
// the top of every page. Falls back to the site logo for guests, who have
// no profile to show.
function SidebarGlyph({ role }: { role: SidebarProps["role"] }) {
	const { data, isLoading } = useMeQuery(undefined, { skip: role === "guest" });
	const profile = data?.profile;

	if (role === "guest") {
		return (
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
		);
	}

	return (
		<Link
			to={profile ? ROUTES.PROFILE(profile.userName) : ROUTES.HOME}
			className={styles.glyphArea}
			aria-label="My profile">
			{profile ? (
				<ProfilePicture
					avatarUrl={profile.avatarUrl}
					userName={profile.userName}
					variant="nav"
					className={styles.glyphAvatar}
				/>
			) : (
				<ProfilePicture
					isLoading={isLoading}
					variant="nav"
					className={styles.glyphAvatar}
				/>
			)}
		</Link>
	);
}

// The shared shell every role gets: a flat black panel (no more full-height
// logo-mark-as-background - that made the panel's shape depend on the
// brand glyph's own cutouts, which fought with real nav content laid over
// it) with SidebarGlyph pinned at the top and whatever nav content is
// passed in filling the rest.
function SidebarShell({ role, children }: { role: SidebarProps["role"]; children?: React.ReactNode }) {
	return (
		<div className={styles.sidebar}>
			<SidebarGlyph role={role} />
			{children}
		</div>
	);
}

export function Sidebar({ role }: SidebarProps) {
	switch (role) {
		case "creative":
			return (
				<SidebarShell role={role}>
					<SidebarNavList items={NAV_ITEMS.creative!} />
				</SidebarShell>
			);
		default:
			return <SidebarShell role={role} />;
	}
}
