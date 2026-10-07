import { Route, Routes } from "react-router-dom";
import { ROUTES } from "./routePaths";
import { RootRedirect } from "../features/auth/components/RootRedirect";
import { AuthPage } from "../pages/AuthPage";
import { RequireAuth } from "../features/auth/components/RequireAuth";
import OnboardingPage from "../pages/OnboardingPage";
import { RoleGuard } from "../features/auth/components/RoleGaurd";
import SupporterLayout from "../layouts/SupporterLayout";
import ExplorePage from "../pages/ExplorePage";
import PiecePage from "../pages/PiecePage";
import CreativeLayout from "../layouts/CreativeLayout";
import { NotFoundPage } from "../pages/NotFoundPage";
import CreativeDashboard from "../pages/creative/CreativeDashboard";
import ExplorePiecesPage from "../features/explore/ExplorePiecesPage";
import ExplorePiecesEvents from "../features/explore/ExploreEventsPage";
import { CreatePieceForm } from "../features/pieces/components/CreatePieceForm";
import { CreateIntermezzoForm } from "../features/pieces/components/CreateIntermezzoForm";

export function AppRoutes() {
	return (
		<Routes>
			<Route
				path={ROUTES.HOME}
				element={<RootRedirect />}
			/>
			<Route
				path={ROUTES.LOGIN}
				element={<AuthPage />}
			/>
			<Route
				path={ROUTES.SIGNUP}
				element={<AuthPage />}
			/>

			<Route
				path={ROUTES.ONBOARDING}
				element={
					<RequireAuth>
						<OnboardingPage />
					</RequireAuth>
				}
			/>

			<Route element={<RoleGuard allowedRoles={["fan"]} />}>
				<Route element={<SupporterLayout />}>
					<Route
						path={ROUTES.FOLLOWING}
						element={<ExplorePage />}
					/>
					<Route
						path={ROUTES.EXPLORE}
						element={<ExplorePage />}
					/>

					<Route
						path={ROUTES.EXPLORE_PIECES}
						element={<ExplorePiecesPage />}
					/>
					<Route
						path={ROUTES.EXPLORE_EVENTS}
						element={<ExplorePiecesEvents />}
					/>
					<Route
						path={ROUTES.SINGLE_PIECE(":id")}
						element={<PiecePage />}
					/>

					{/* <Route
						path={ROUTES.PROFILE(":username")}
						element={<ProfilePage />}
					/>
					<Route
						path={ROUTES.PORTFOLIO(":username")}
						element={<PortfolioPage />}
					/>
					<Route
						path={ROUTES.USER_PIECES(":username")}
						element={<UserPiecesPage />}
					/>
					<Route
						path={ROUTES.USER_EVENTS(":username")}
						element={<UserEventsPage />}
					/> */}
				</Route>
			</Route>

			<Route element={<RoleGuard allowedRoles={["artist"]} />}>
				<Route element={<CreativeLayout />}>
					<Route
						path={ROUTES.DASHBOARD}
						element={<CreativeDashboard />}
					/>
					<Route
						path={ROUTES.CREATE_PIECE}
						element={<CreatePieceForm />}
					/>
					<Route
						path={ROUTES.CREATE_INTERMEZZO}
						element={<CreateIntermezzoForm />}
					/>
					{/* <Route
						path={ROUTES.PIECES}
						element={<ManagePiecesPage />}
					/>
					<Route
						path={ROUTES.VERIFICATION}
						element={<VerificationPage />}
					/> */}
				</Route>
			</Route>

			{/* <Route element={<RoleGuard allowedRoles={["organizer"]} />}>
				<Route element={<OrganizerLayout />}>
					<Route
						path={ROUTES.DASHBOARD}
						element={<OrganizerDashboard />}
					/>
					<Route
						path={ROUTES.EVENTS}
						element={<ManageEventsPage />}
					/>
					<Route
						path={ROUTES.VERIFICATION}
						element={<VerificationPage />}
					/>
				</Route>
			</Route> */}

			{/* Fallback */}
			<Route
				path="*"
				element={<NotFoundPage />}
			/>
		</Routes>
	);
}
