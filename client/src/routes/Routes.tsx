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
import NotificationsPage from "../pages/NotificationsPage";
import MessagesPage from "../pages/MessagesPage";
import SettingsPage from "../pages/SettingsPage";

export function AppRoutes() {
	return (
		<Routes>
			<Route
				path={ROUTES.HOME}
				element={<RootRedirect />}
			/>

			<Route element={<Layout type="form" />}>
				<Route element={<RequireGuest />}>
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

			<Route element={<Layout type="page" />}>
				// ============= ALL ROLES ==============
				<Route element={<RoleGuard allowedRoles={["artist", "fan", "organizer"]} />}>
					// ============= MAIN PAGES ==============
					<Route path={ROUTES.TIMELINE}>
						<Route
							index
							element={<div>Timeline</div>}
						/>
						<Route
							path={ROUTES.TIMELINE_PIECES}
							element={<div>Timeline Pieces</div>}
						/>
						<Route
							path={ROUTES.TIMELINE_HAPPENINGS}
							element={<div>Timeline Happenings</div>}
						/>
					</Route>
					<Route path={ROUTES.DISCOVERY}>
						<Route
							index
							element={<div>Discovery</div>}
						/>
						<Route
							path={ROUTES.DISCOVERY_PIECES}
							element={<div>Discovery Pieces</div>}
						/>
						<Route
							path={ROUTES.DISCOVERY_HAPPENINGS}
							element={<div>Discovery Happenings</div>}
						/>
					</Route>
					<Route
						path={ROUTES.NOTIFICATIONS}
						element={<div>Notifications</div>}
					/>
					// ============ SUBPAGES ==============
					<Route
						path={ROUTES.SINGLE_PIECE_PATTERN}
						element={<div>PieceDetails</div>}
					/>
				</Route>
				// ============= CREATIVES ==============
				<Route element={<RoleGuard allowedRoles={["artist"]} />}>
					<Route
						path={ROUTES.MY_PIECES}
						element={<MyPiecesPage />}
					/>
				</Route>
				// ============= ORGANIZERS ==============
				<Route element={<RoleGuard allowedRoles={["organizer"]} />}></Route>
				// ============= CREAIVES + ORGANIZERS ==============
				<Route element={<RoleGuard allowedRoles={["artist", "organizer"]} />}>
					<Route
						path={ROUTES.ON_AIR}
						element={<div>On Air</div>}
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
						path={ROUTES.SETTINGS}
						element={<SettingsPage />}
					/>
				</Route>
				<Route
					element={
						<Layout
							type="form"
							role="creative"
						/>
					}>
					<Route
						path={ROUTES.MY_APPLICATIONS}
						element={<div>My Applications</div>}
					/>
					<Route
						path={ROUTES.MY_HAPPENINGS}
						element={<div>My Happenings</div>}
					/>
					<Route
						path={ROUTES.PROFILE_PATTERN}
						element={<div>My Profile</div>}
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
