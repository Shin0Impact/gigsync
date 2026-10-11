import { Navigate, Outlet } from "react-router-dom";
import { UserRole } from "@shared/types/index";
import { useMeQuery } from "../authApi";
import { ROUTES } from "../../../routes/routePaths";

interface RoleGuardProps {
	allowedRoles: UserRole[];
}

export function RoleGuard({ allowedRoles }: RoleGuardProps) {
	const { data, isLoading } = useMeQuery();

	if (isLoading) return <p>Loading…</p>;

	const user = data?.user;
	const profile = data?.profile;

	if (!user) {
		return (
			<Navigate
				to={ROUTES.LOGIN}
				replace
			/>
		);
	}

	if (!allowedRoles.includes(user.role)) {
		// Same reasoning as RootRedirect - Studio (/dashboard) is gone, so
		// an artist/organizer landing here on a page they can't access gets
		// sent to their own profile instead.
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
	return <Outlet />;
}
