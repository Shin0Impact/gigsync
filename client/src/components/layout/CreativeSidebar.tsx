import { useMeQuery } from "../../features/auth/authApi";
import { ROUTES } from "../../routes/routePaths";
import styles from "./CreativeSidebar.module.css";
import { ButtonLink } from "../ButtonLink";
import { Button } from "../Button";
import { useNavigate } from "react-router-dom";

export function CreativeSidebar() {
	const { data } = useMeQuery();
	const navigate = useNavigate();
	const username = data?.user ? ((data.user as { username?: string }).username ?? "me") : "me";

	const navItems = [
		{ label: "Studio", href: ROUTES.STUDIO },
		{ label: "My Pieces", href: ROUTES.PIECES },
		{ label: "My Portfolio", href: ROUTES.USER_PORTFOLIO(username) },
		{ label: "Verification", href: ROUTES.VERIFICATION },
	];

	return (
		<aside className={styles.sidebar}>
			<div className="styles.buttons">
				<Button onClick={() => navigate(ROUTES.CREATE_INTERMEZZO)}>New Intermezzo</Button>
				<Button onClick={() => navigate(ROUTES.CREATE_PIECE)}>New Piece</Button>
			</div>
			<nav className="styles.navigation">
				{navItems.map((item) => (
					<ButtonLink
						key={item.href}
						to={item.href}>
						{item.label}
					</ButtonLink>
				))}
			</nav>
		</aside>
	);
}
