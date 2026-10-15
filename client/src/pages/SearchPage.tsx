import { Outlet, useLocation } from "react-router-dom";
import { Page, ButtonLink } from "@components";
import { ROUTES } from "../routes/routePaths";

export function SearchPage() {
	const { pathname } = useLocation();
	const isEvents = pathname.startsWith(ROUTES.SEARCH_EVENTS);
	const isPeople = pathname.startsWith(ROUTES.SEARCH_PEOPLE);
	const isArtists = !isEvents && !isPeople;

	return (
		<Page type="main">
			<Page.Header
				title="Search"
				mode="button"
				actions={
					<div style={{ display: "flex", gap: "1rem" }}>
						<ButtonLink
							to={ROUTES.SEARCH}
							variant={isArtists ? "solid" : "ghost"}>
							Artists
						</ButtonLink>
						<ButtonLink
							to={ROUTES.SEARCH_PEOPLE}
							variant={isPeople ? "solid" : "ghost"}>
							People
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
