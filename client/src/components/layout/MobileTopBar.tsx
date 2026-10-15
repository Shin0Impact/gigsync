import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ROUTES } from "../../routes/routePaths";
import { TOP_NAV_ITEMS, ROLE_NAV_ITEMS, BOTTOM_NAV_ITEMS, type NavItem } from "./Sidebar";
import styles from "./MobileTopBar.module.css";

interface MobileTopBarProps {
	role: string;
	username?: string;
}

export function MobileTopBar({ role, username }: MobileTopBarProps) {
	const [open, setOpen] = useState(false);
	const location = useLocation();
	const path = location.pathname;

	// close the menu whenever the route changes
	useEffect(() => {
		setOpen(false);
	}, [path]);

	const resolve = (to: NavItem["to"]) => (typeof to === "function" ? to(username ?? "") : to);
	const items: NavItem[] = [...TOP_NAV_ITEMS, ...(ROLE_NAV_ITEMS[role] ?? []), ...BOTTOM_NAV_ITEMS].filter(
		(item) => username || typeof item.to !== "function",
	);

	return (
		<header className={styles.bar}>
			<Link
				to={ROUTES.HOME}
				className={styles.brand}
				aria-label="GigSync home">
				GigSync
			</Link>

			<button
				type="button"
				className={styles.burger}
				aria-label={open ? "Close menu" : "Open menu"}
				aria-expanded={open}
				onClick={() => setOpen((v) => !v)}>
				<span className={`${styles.line} ${open ? styles.lineTop : ""}`} />
				<span className={`${styles.line} ${open ? styles.lineMid : ""}`} />
				<span className={`${styles.line} ${open ? styles.lineBot : ""}`} />
			</button>

			{open && (
				<nav
					className={styles.menu}
					aria-label="Main menu">
					{items.map((item) => {
						const to = resolve(item.to);
						const active = path === to || (to !== "/" && path.startsWith(to + "/"));
						return (
							<Link
								key={item.label}
								to={to}
								className={styles.menuLink}
								data-active={active}>
								{item.label}
							</Link>
						);
					})}
				</nav>
			)}
		</header>
	);
}
