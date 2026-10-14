import { Route, Routes } from "react-router-dom";
import { ROUTES } from "./routePaths";
import { RootRedirect } from "../features/auth/components/RootRedirect";
import { RequireAuth } from "../features/auth/components/RequireAuth";
import OnboardingPage from "../pages/OnboardingPage";
import { RoleGuard } from "../features/auth/components/RoleGuard";
import { NotFoundPage } from "../pages/NotFoundPage";
import Layout from "../layouts/Layout";
import { FormLogin, FormSignup, RequireGuest } from "../features/auth";
import { FormIntermezzoCreate, FormPieceCreate } from "../features/pieces/components";
import { PieceDetails } from "../pages/creative/PieceDetails";
import { FormAddToPortfolio } from "../features/portfolio/components/FormAddToPortfolio";
import { Events } from "../pages/creative/Events";
import { ArtistSearchPage } from "../pages/ArtistSearchPage";
import { ExplorePiecesPage } from "../features/explore/ExplorePiecesPage";
import { FollowingPage } from "../features/explore/FollowingPage";
import ProfilePage from "../pages/ProfilePage";
import MessagesPage from "../pages/MessagesPage";
import SettingsPage from "../pages/SettingsPage";
import NotificationsPage from "../pages/NotificationsPage";
import { MyPiecesPage } from "../pages/MyPiecesPage";
import MyApplicationsPage from "../pages/MyApplicationsPage";

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
						<OnboardingPage />
					</RequireAuth>
				}
			/>

			<Route element={<RoleGuard allowedRoles={["artist", "fan", "organizer"]} />}>
				<Route element={<Layout type="page" />}>
					<Route
						path={ROUTES.SETTINGS}
						element={<SettingsPage />}
					/>

					<Route
						path={ROUTES.SINGLE_PIECE_PATTERN}
						element={<PieceDetails />}
					/>
				</Route>
			</Route>

			<Route element={<RoleGuard allowedRoles={["artist"]} />}>
				<Route element={<Layout type="page" />}>
					<Route
						path={ROUTES.MY_PIECES}
						element={<MyPiecesPage />}
					/>
					<Route
						path={ROUTES.MY_APPLICATIONS}
						element={<MyApplicationsPage />}
					/>
					<Route
						path={ROUTES.DISCOVERY_HAPPENINGS}
						element={<Events />}
					/>
					<Route
						path={ROUTES.ON_AIR}
						element={<ArtistSearchPage />}
					/>
					<Route
						path={ROUTES.DISCOVERY}
						element={<ExplorePiecesPage />}
					/>
					<Route
						path={ROUTES.TIMELINE}
						element={<FollowingPage />}
					/>
					<Route
						path={ROUTES.NOTIFICATIONS}
						element={<NotificationsPage />}
					/>
					<Route
						path={ROUTES.MESSAGES}
						element={<MessagesPage />}
					/>
					<Route
						path={ROUTES.MESSAGE_THREAD_PATTERN}
						element={<MessagesPage />}
					/>

					<Route
						path={ROUTES.PROFILE_PATTERN}
						element={<ProfilePage />}
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

			<Route
				path="*"
				element={<NotFoundPage />}
			/>
		</Routes>
	);
}
