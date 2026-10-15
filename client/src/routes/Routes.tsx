import { Navigate, Route, Routes } from "react-router-dom";
import { ROUTES } from "./routePaths";
import { RootRedirect } from "../features/auth/components/RootRedirect";
import { RequireAuth } from "../features/auth/components/RequireAuth";
import { RoleGuard } from "../features/auth/components/RoleGuard";
import { NotFoundPage } from "../pages/NotFoundPage";
import Layout from "../layouts/Layout";
import { FormLogin, FormSignup, RequireGuest } from "../features/auth";
import { FormIntermezzoCreate, FormPieceCreate } from "../features/pieces/components";
import { FormAddToPortfolio } from "../features/portfolio/components/FormAddToPortfolio";
import ProfilePage from "../pages/ProfilePage";
import MessagesPage from "../pages/MessagesPage";
import SettingsPage from "../pages/SettingsPage";
import NotificationsPage from "../pages/NotificationsPage";
import { MyPiecesPage } from "../pages/MyPiecesPage";
import { DiscoveryPage } from "../pages/DiscoveryPage";
import { TimelinePage } from "../pages/TimelinePage";
import { MyEventsPage } from "../pages/MyEvents";
import SearchPage from "../pages/SearchPage";
import SingleEventPage from "../pages/subpages/SingleEventPage";
import SinglePiecePage from "../pages/subpages/SinglePiecePage";
import { DiscoveryPiecesFeed } from "../features/explore/DiscoveryPiecesFeed";
import { DiscoveryEventsFeed } from "../features/explore/DiscoveryEventsFeed";
import { TimelinePiecesFeed } from "../features/explore/TimelinePiecesFeed";
import { TimelineEventsFeed } from "../features/explore/TimelineEventsFeed";
import { SingleEventDetails } from "../features/events/components/SingleEventDetails";
import { SingleEventApplications } from "../features/events/components/SingleEventApplications";
import InboxPage from "../pages/InboxPage";

export function AppRoutes() {
	return (
		<Routes>
			<Route
				path={ROUTES.HOME}
				element={<RootRedirect />}
			/>

			<Route element={<RequireGuest />}>
				<Route element={<Layout type="form" />}>
					<Route
						path={ROUTES.LOGIN}
						element={<FormLogin />}
					/>
					<Route
						path={ROUTES.SIGNUP}
						element={<FormSignup />}
					/>
				</Route>
			</Route>

			<Route
				path={ROUTES.ONBOARDING}
				element={
					<RequireAuth>
						<RootRedirect />
					</RequireAuth>
				}
			/>

			<Route element={<RoleGuard allowedRoles={["artist", "fan", "organizer"]} />}>
				<Route element={<Layout type="page" />}>
					<Route
						path={ROUTES.DISCOVERY}
						element={<DiscoveryPage />}>
						<Route
							index
							element={
								<Navigate
									to={ROUTES.DISCOVERY_PIECES}
									replace
								/>
							}
						/>
						<Route
							path={ROUTES.DISCOVERY_PIECES}
							element={<DiscoveryPiecesFeed />}
						/>
						<Route
							path={ROUTES.DISCOVERY_EVENTS}
							element={<DiscoveryEventsFeed />}
						/>
					</Route>
					<Route
						path={ROUTES.TIMELINE}
						element={<TimelinePage />}>
						<Route
							index
							element={
								<Navigate
									to={ROUTES.TIMELINE_PIECES}
									replace
								/>
							}
						/>
						<Route
							path={ROUTES.TIMELINE_PIECES}
							element={<TimelinePiecesFeed />}
						/>
						<Route
							path={ROUTES.TIMELINE_EVENTS}
							element={<TimelineEventsFeed />}
						/>
					</Route>

					<Route
						path={ROUTES.SEARCH}
						element={<SearchPage />}
					/>
					<Route
						path={ROUTES.INBOX}
						element={<InboxPage />}>
						<Route
							index
							element={
								<Navigate
									to={ROUTES.NOTIFICATIONS}
									replace
								/>
							}
						/>
						<Route
							path="notifications"
							element={<NotificationsPage />}
						/>
						<Route
							path="messages"
							element={<MessagesPage />}
						/>
						<Route
							path={ROUTES.MESSAGE_THREAD_PATTERN}
							element={<MessagesPage />}
						/>
					</Route>

					<Route
						path={ROUTES.SETTINGS}
						element={<SettingsPage />}
					/>
					<Route
						path={ROUTES.MESSAGE_THREAD_PATTERN}
						element={<MessagesPage />}
					/>
					<Route
						path={ROUTES.SINGLE_EVENT_PATTERN}
						element={<SingleEventPage />}>
						<Route
							index
							element={<SingleEventDetails />}
						/>
						<Route
							path="applications"
							element={<RoleGuard allowedRoles={["organizer"]} />}>
							<Route
								index
								element={<SingleEventApplications />}
							/>
						</Route>
					</Route>
					<Route
						path={ROUTES.SINGLE_PIECE_PATTERN}
						element={<SinglePiecePage />}
					/>
					<Route
						path={ROUTES.PROFILE_PATTERN}
						element={<ProfilePage />}
					/>
				</Route>
			</Route>

			<Route element={<RoleGuard allowedRoles={["artist"]} />}>
				<Route element={<Layout type="page" />}>
					<Route
						path={ROUTES.MY_PIECES}
						element={<MyPiecesPage />}
					/>
				</Route>
				<Route element={<Layout type="form" />}>
					<Route
						path={ROUTES.CREATE_PIECE}
						element={<FormPieceCreate />}
					/>
					<Route
						path={ROUTES.CREATE_INTERMEZZO}
						element={<FormIntermezzoCreate />}
					/>
					<Route
						path={ROUTES.CREATE_PORTFOLIO_SECTION}
						element={<FormAddToPortfolio />}
					/>
				</Route>
			</Route>

			<Route element={<RoleGuard allowedRoles={["organizer"]} />}>
				<Route element={<Layout type="page" />}>
					<Route
						path={ROUTES.MY_EVENTS}
						element={<MyEventsPage />}
					/>
				</Route>
			</Route>

			<Route
				path="*"
				element={<NotFoundPage />}
			/>
		</Routes>
	);
}
