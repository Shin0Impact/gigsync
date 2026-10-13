// src/features/auth/components/RootRedirect.tsx
import { Navigate } from "react-router-dom";
import { useMeQuery } from "../authApi";
import { ROUTES } from "../../../routes/routePaths";
import { LandingPage } from "../../../pages/LandingPage";

export function RootRedirect() {
	const { data, isLoading } = useMeQuery();

	if (isLoading) return <p>Loading…</p>;

	const user = data?.user;
	const profile = data?.profile;

	if (user) {
		// Studio used to be its own page at /dashboard - artists/organizers
		// now land on their own profile instead (Posts/Portfolio tabs cover
		// the same ground). Falls back to home in the edge case where the
		// profile summary hasn't loaded yet.
		if ((user.role === "artist" || user.role === "organizer") && profile) {
			return (
				<Navigate
					to={ROUTES.PROFILE(profile.userName)}
					replace
				/>
			);
		}
		return (
			<Navigate
				to={ROUTES.HOME}
				replace
			/>
		);
	}

	return <LandingPage />;
}
