import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Page, ButtonLink } from "@components";
import { ROUTES } from "../routes/routePaths";

export function DiscoveryPage() {
	const location = useLocation();
	const navigate = useNavigate();

	const isPieces = location.pathname.startsWith(ROUTES.DISCOVERY_PIECES);
	const isEvents = location.pathname.startsWith(ROUTES.DISCOVERY_EVENTS);

	// Clicking the "Discovery" title switches the feed to Timeline (same tab)
	const handleSwitchFeed = () => {
		navigate(isEvents ? ROUTES.TIMELINE_EVENTS : ROUTES.TIMELINE_PIECES);
	};

	return (
		<Page type="main">
			<Page.Header
				title="Discovery"
				mode="button"
				titleOnClick={handleSwitchFeed}
				titleOnClickLabel="Switch to Timeline"
				actions={
					<div style={{ display: "flex", gap: "1rem" }}>
						<ButtonLink
							to={ROUTES.DISCOVERY_PIECES}
							variant={isPieces ? "solid" : "ghost"}>
							Pieces
						</ButtonLink>
						<ButtonLink
							to={ROUTES.DISCOVERY_EVENTS}
							variant={isEvents ? "solid" : "ghost"}>
							Events
						</ButtonLink>
					</div>
				}
			/>
			<Page.Body>
				<Outlet />
			</Page.Body>
		</Page>
	);
}

export default DiscoveryPage;
