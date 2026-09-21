import { Navigate } from "react-router-dom";
import { useMeQuery } from "../authApi";
import { ROUTES } from "../../../routes/routePaths";

export function RootRedirect() {
	const { data: user, isLoading } = useMeQuery();

	if (isLoading) return <p>Loading…</p>;
	if (user)
		return (
			<Navigate
				to={ROUTES.FEED}
				replace
			/>
		);
	return (
		<Navigate
			to={ROUTES.LOGIN}
			replace
		/>
	);
}
