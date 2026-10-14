import { Navigate, Routes } from "react-router-dom";
import { useMeQuery } from "../authApi";
import { ROUTES } from "../../../routes/routePaths";
import { LandingPage } from "../../../pages/LandingPage";
import OnboardingPage from "../../../pages/OnboardingPage";

interface RootRedirectProps {
	onboarding?: boolean;
}

export function RootRedirect({ onboarding = false }: RootRedirectProps) {
	const { data, isLoading } = useMeQuery();

	if (isLoading) return <p>Loading…</p>;

	const user = data?.user;

	if (user) {
		if (onboarding) {
			return <OnboardingPage />;
		}

		// if (user.role === "artist") {
		// 	return (
		// 		<Navigate
		// 			to={ROUTES.MY_PIECES}
		// 			replace
		// 		/>
		// 	);
		// } else if (user.role === "organizer") {
		// 	return (
		// 		<Navigate
		// 			to={ROUTES.MY_EVENTS}
		// 			replace
		// 		/>
		// 	);
		// }
		return (
			<Navigate
				to={ROUTES.DISCOVERY}
				replace
			/>
		);
	}

	return <LandingPage />;
}
