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
import { MyPieces } from "../pages/creative/MyPieces";
import { PieceDetails } from "../pages/creative/PieceDetails";
import { MyPortfolio } from "../pages/creative/MyPortfolio";
import { FormAddToPortfolio } from "../features/portfolio/components/FormAddToPortfolio";

export function AppRoutes() {
	return (
		<Routes>
			<Route
				path={ROUTES.HOME}
				element={<RootRedirect />}
			/>
			<Route element={<RequireGuest />}>
				<Route
					element={
						<Layout
							type="form"
							role="guest"
						/>
					}>
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
				<Route
					path={ROUTES.SINGLE_PIECE_PATTERN}
					element={<PieceDetails />}
				/>
				<Route
					path={ROUTES.USER_PORTFOLIO_PATTERN}
					element={<MyPortfolio />}
				/>
			</Route>

			<Route element={<RoleGuard allowedRoles={["artist"]} />}>
				<Route
					element={
						<Layout
							type="page"
							role="creative"
						/>
					}>
					<Route
						path={ROUTES.DASHBOARD}
						element={<MyPieces />}
					/>
					<Route
						path={ROUTES.PIECES}
						element={<MyPieces />}
					/>
					<Route
						path={ROUTES.PORTFOLIO}
						element={<MyPortfolio />}
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
