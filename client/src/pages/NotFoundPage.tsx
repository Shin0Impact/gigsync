import { Link } from "react-router-dom";
import { ROUTES } from "../routes/routePaths";

export function NotFoundPage() {
	return (
		<div className="not-found-page">
			<h1>Page not found</h1>
			<p>There's nothing here.</p>
			<Link to={ROUTES.HOME}>Go back</Link>
		</div>
	);
}
