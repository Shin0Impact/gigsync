import { BrowserRouter, Routes, Route } from "react-router-dom";
import { RequireAuth } from "../features/auth/components/RequireAuth";
import { RootRedirect } from "../features/auth/components/RootRedirect";
import { AuthPage } from "../pages/AuthPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { ROUTES } from "./routePaths";

// import { OnboardingPage } from '../pages/OnboardingPage'; // not built yet
// import { FeedPage } from '../pages/FeedPage';             // not built yet

export function AppRoutes() {
	return (
		<BrowserRouter>
			<Routes>
				{/* "/" is a dispatcher, not a page — see RootRedirect */}
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
							{/* <OnboardingPage /> */}
							<p>Onboarding — TODO</p>
						</RequireAuth>
					}
				/>

				<Route
					path={ROUTES.FEED}
					element={
						<RequireAuth>
							{/* <FeedPage /> */}
							<p>Feed — TODO</p>
						</RequireAuth>
					}
				/>

				<Route
					path="*"
					element={<NotFoundPage />}
				/>
			</Routes>
		</BrowserRouter>
	);
}
