import { Link, useLocation } from "react-router-dom";
import styles from "./Sidebar.module.css";
import { ROUTES } from "../../routes/routePaths";
import { Logo } from "@components/Logo";
import { LinkNav } from "@components/ui/Link";
import { useMeQuery } from "../../features/auth";
import { useMediaQuery } from "../../hooks";

interface NavItem {
	to: string | ((username: string) => string);
	label: string;
}

const TOP_NAV_ITEMS: NavItem[] = [
	{ to: ROUTES.TIMELINE, label: "Timeline" },
	{ to: ROUTES.DISCOVERY, label: "Discovery" },
	{ to: ROUTES.NOTIFICATIONS, label: "Notifications" },
];

const ROLE_NAV_ITEMS: Record<string, NavItem[]> = {
	creative: [
		{ to: ROUTES.ON_AIR, label: "On Air" },
		{ to: ROUTES.MY_PIECES, label: "Pieces" },
	],
	artist: [
		{ to: ROUTES.ON_AIR, label: "On Air" },
		{ to: ROUTES.MY_PIECES, label: "Pieces" },
	],
	organizer: [
		{ to: ROUTES.ON_AIR, label: "On Air" },
		{ to: ROUTES.MY_HAPPENINGS, label: "Happenings" },
	],
};

const BOTTOM_NAV_ITEMS: NavItem[] = [{ to: (username: string) => ROUTES.PROFILE(username), label: "Profile" }];

export function Sidebar() {
	const { data, isLoading } = useMeQuery();
	const isMobile = useMediaQuery("(max-width: 768px)");
	const location = useLocation();
	const path = location.pathname;

	if (isLoading || !data)
		return (
			<div className={styles.sidebar}>
				<div className={styles.glyphContainer}>
					<Link
						to={ROUTES.HOME}
						className={styles.glyphArea}
						aria-label="Home">
						<Logo
							variant="mark"
							orientation={isMobile ? "horizontal" : "vertical"}
							size="fill"
							className={styles.verticalGlyph}
						/>
					</Link>
				</div>
			</div>
		);

	console.log(path);

	const role = data.user?.role;
	const username = data.profile?.userName;

	const resolvePath = (to: string | ((username: string) => string)): string => {
		return typeof to === "function" ? to(username!) : to;
	};

	const roleItems = ROLE_NAV_ITEMS[role!] || [];

	return (
		<div className={styles.sidebar}>
			<div className={styles.glyphContainer}>
				<Link
					to={ROUTES.HOME}
					className={styles.glyphArea}
					aria-label="Home">
					<Logo
						variant="mark"
						orientation={isMobile ? "horizontal" : "vertical"}
						purpose="static"
						size="fill"
						className={styles.verticalGlyph}
					/>
				</Link>
			</div>

			<div className={styles.linkContainer}>
				<nav className={styles.topNav}>
					{TOP_NAV_ITEMS.map((item) => (
						<LinkNav
							key={item.label}
							to={resolvePath(item.to)}
							color="invert"
							active={resolvePath(item.to) === path}>
							{item.label}
						</LinkNav>
					))}
				</nav>

				<aside className={styles.bottomNav}>
					{roleItems.length > 0 && (
						<div className={styles.roleNav}>
							{roleItems.map((item) => (
								<LinkNav
									key={item.label}
									to={resolvePath(item.to)}
									color="invert"
									active={resolvePath(item.to) === path}>
									{item.label}
								</LinkNav>
							))}
						</div>
					)}

					{BOTTOM_NAV_ITEMS.map((item) => (
						<LinkNav
							key={item.label}
							to={resolvePath(item.to)}
							color="invert"
							active={resolvePath(item.to) === path}>
							{item.label}
						</LinkNav>
					))}
				</aside>
			</div>
		</div>
	);
}
