import { Outlet, useLocation } from "react-router-dom";
import { Page, ButtonLink } from "@components";
import { ROUTES } from "../routes/routePaths";

export function SearchPage() {
	const location = useLocation();
	const isEvents = location.pathname.startsWith(ROUTES.SEARCH_EVENTS);

	return (
		<Page type="main">
			<Page.Header
				title={isEvents ? "Find Events" : "Find Artists"}
				mode="button"
				actions={
					<div style={{ display: "flex", gap: "1rem" }}>
						<ButtonLink
							to={ROUTES.SEARCH}
							variant={isEvents ? "ghost" : "solid"}>
							Artists
						</ButtonLink>
						<ButtonLink
							to={ROUTES.SEARCH_EVENTS}
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

export default SearchPage;
