import { Navigate } from "react-router-dom";
import { useMeQuery } from "../authApi";
import { ROUTES } from "../../../routes/routePaths";

interface RequireAuthProps {
	children: React.ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps) {
	const { data: user, isLoading } = useMeQuery();

	if (isLoading) return <p>Loading…</p>;
	if (!user)
		return (
			<Navigate
				to={ROUTES.LOGIN}
				replace
			/>
		);

	return <>{children}</>;
}
