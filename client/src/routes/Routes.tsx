import { BrowserRouter, Routes, Route } from "react-router-dom";
import { RequireAuth } from "../features/auth/components/RequireAuth";
import { RootRedirect } from "../features/auth/components/RootRedirect";
import { AuthPage } from "../pages/AuthPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { ROUTES } from "./routePaths";
import OnboardingPage from "../pages/OnboardingPage";
import FeedPage from "../pages/FeedPage";
import ProjectPage from "../pages/ProjectPage";
import PortfolioPage from "../pages/PortfolioPage";

// import { OnboardingPage } from '../pages/OnboardingPage'; // not built yet
// import { FeedPage } from '../pages/FeedPage';             // not built yet
// import { ProjectPage } from '../pages/ProjectPage';       // not built yet
// import { PortfolioPage } from '../pages/PortfolioPage';   // not built yet

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

			<Route
				path={ROUTES.FEED}
				element={
					<RequireAuth>
						<FeedPage />
					</RequireAuth>
				}
			/>

			<Route
				path="/project/:id"
				element={
					<RequireAuth>
						<ProjectPage />
					</RequireAuth>
				}
			/>

			<Route
				path="/portfolio/:username"
				element={
					<RequireAuth>
						<PortfolioPage />
					</RequireAuth>
				}
			/>

			<Route
				path="*"
				element={<NotFoundPage />}
			/>
		</Routes>
	);
}
