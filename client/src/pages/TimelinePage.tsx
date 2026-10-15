import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Page, ButtonLink } from "@components";
import { ROUTES } from "../routes/routePaths";

export function TimelinePage() {
	const location = useLocation();
	const navigate = useNavigate();

	const isPieces = location.pathname.startsWith(ROUTES.TIMELINE_PIECES);
	const isEvents = location.pathname.startsWith(ROUTES.TIMELINE_EVENTS);

	// Clicking the "Timeline" title switches the feed back to Discovery (same tab)
	const handleSwitchFeed = () => {
		navigate(isEvents ? ROUTES.DISCOVERY_EVENTS : ROUTES.DISCOVERY_PIECES);
	};

	return (
		<Page type="main">
			<Page.Header
				title="Timeline"
				mode="button"
				titleOnClick={handleSwitchFeed}
				titleOnClickLabel="Switch to Discovery"
				actions={
					<div style={{ display: "flex", gap: "1rem" }}>
						<ButtonLink
							to={ROUTES.TIMELINE_PIECES}
							variant={isPieces ? "solid" : "ghost"}>
							Pieces
						</ButtonLink>
						<ButtonLink
							to={ROUTES.TIMELINE_EVENTS}
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

export default TimelinePage;
