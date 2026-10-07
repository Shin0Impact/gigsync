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

	if (!user) {
		return (
			<Navigate
				to={ROUTES.LOGIN}
				replace
			/>
		);
	}

	if (!allowedRoles.includes(user.role)) {
		if (user.role === "artist" || user.role === "organizer") {
			return (
				<Navigate
					to={ROUTES.DASHBOARD}
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
	return <Outlet />;
}
