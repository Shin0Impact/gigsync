import { Navigate, Outlet } from "react-router-dom";
import { useMeQuery } from "../authApi";
import { ROUTES } from "../../../routes/routePaths";

export function RequireGuest() {
	const { data, isLoading } = useMeQuery();

	if (isLoading) return null;

	if (data?.user)
		return (
			<Navigate
				to={ROUTES.HOME}
				replace
			/>
		);

	return <Outlet />;
}
