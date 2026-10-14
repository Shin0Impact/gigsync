// src/features/auth/components/RootRedirect.tsx
import { Navigate } from "react-router-dom";
import { useMeQuery } from "../authApi";
import { ROUTES } from "../../../routes/routePaths";
import { LandingPage } from "../../../pages/LandingPage";

export function RootRedirect() {
	const { data, isLoading } = useMeQuery();

	if (isLoading) return <p>Loading…</p>;

	const user = data?.user;

	if (user) {
		if (user.role === "artist") {
			return (
				<Navigate
					to={ROUTES.MY_PIECES}
					replace
				/>
			);
		} else if (user.role === "organizer") {
			return (
				<Navigate
					to={ROUTES.MY_HAPPENINGS}
					replace
				/>
			);
		}
		return (
			<Navigate
				to={ROUTES.TIMELINE}
				replace
			/>
		);
	}

	return <LandingPage />;
}
