import { useLocation } from "react-router-dom";
import { ROUTES } from "../../routes/routePaths";
import styles from "./MobileNav.module.css";
import { ButtonLink } from "@components/ui";
import { HappeningIcon, HomeIcon, OnAirIcon, PieceIcon, PlusIcon } from "../../assets/icons";

interface MobileNavProps {
	role: string;
	username?: string;
	onToggleDrawer: () => void;
	isDrawerOpen: boolean;
}

export function MobileNav({ role, username, onToggleDrawer, isDrawerOpen }: MobileNavProps) {
	const location = useLocation();
	const path = location.pathname;

	const resolvePath = (to: string | ((username: string) => string)): string => {
		return typeof to === "function" ? to(username!) : to;
	};

	const isOrganizer = role === "organizer";
	const secondaryRoute = isOrganizer ? ROUTES.MY_HAPPENINGS : ROUTES.MY_PIECES;
	const secondaryActive = path === resolvePath(secondaryRoute);

	return (
		<nav className={styles.mobileNav}>
			<ButtonLink
				to={ROUTES.HOME}
				active={path === ROUTES.HOME || path === ROUTES.TIMELINE || path === ROUTES.DISCOVERY}
				aria-label="Home"
				className={styles.navButton}
				variant="nav">
				<HomeIcon className={styles.icon} />
			</ButtonLink>

			<ButtonLink
				to={resolvePath(secondaryRoute)}
				active={secondaryActive}
				aria-label={isOrganizer ? "Happenings" : "Pieces"}
				className={styles.navButton}
				variant="nav">
				{isOrganizer ? <HappeningIcon className={styles.icon} /> : <PieceIcon className={styles.icon} />}
			</ButtonLink>

			<button
				type="button"
				onClick={onToggleDrawer}
				className={`${styles.fabButton} ${isDrawerOpen ? styles.isOpen : ""}`}
				aria-label="Create new">
				<PlusIcon className={`${styles.icon} ${styles.plusIcon}`} />
			</button>

			<ButtonLink
				to={ROUTES.ON_AIR}
				active={path === ROUTES.ON_AIR}
				aria-label="On Air"
				className={styles.navButton}
				variant="nav">
				<OnAirIcon className={styles.icon} />
			</ButtonLink>

			<ButtonLink
				to={username ? ROUTES.PROFILE(username) : ROUTES.HOME}
				active={username ? path === resolvePath(ROUTES.PROFILE(username)) : false}
				aria-label="Profile"
				className={styles.navButton}
				variant="nav">
				<div className={styles.profileSquare} />
			</ButtonLink>
		</nav>
	);
}
