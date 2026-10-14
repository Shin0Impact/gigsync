import { Outlet, useLocation } from "react-router-dom";
import { Page, ButtonLink } from "@components";
import { ROUTES } from "../routes/routePaths";

export function DiscoveryPage() {
	const location = useLocation();

	const isPieces = location.pathname.startsWith(ROUTES.DISCOVERY_PIECES);
	const isEvents = location.pathname.startsWith(ROUTES.DISCOVERY_EVENTS);

	return (
		<Page type="main">
			<Page.Header
				title="Discovery"
				mode="button"
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
