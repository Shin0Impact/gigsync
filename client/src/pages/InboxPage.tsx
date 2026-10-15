import { Outlet, useLocation } from "react-router-dom";
import { Page, ButtonLink } from "@components";
import { ROUTES } from "../routes/routePaths";

export function InboxPage() {
	const location = useLocation();

	const isNotifications = location.pathname.startsWith(ROUTES.NOTIFICATIONS);
	const isMessages = location.pathname.startsWith(ROUTES.MESSAGES);

	return (
		<Page type="main">
			<Page.Header
				title="Inbox"
				mode="button"
				actions={
					<div style={{ display: "flex", gap: "1rem" }}>
						<ButtonLink
							to={ROUTES.NOTIFICATIONS}
							variant={isNotifications ? "solid" : "ghost"}>
							Notifications
						</ButtonLink>
						<ButtonLink
							to={ROUTES.MESSAGES}
							variant={isMessages ? "solid" : "ghost"}>
							Messages
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

export default InboxPage;
