import { Page } from "@components";
import { useMeQuery } from "../features/auth";
import { UserApplications } from "../features/events/components/UserApplications";

function MyApplicationsPage() {
	const { data, isLoading } = useMeQuery();
	const role = data?.user?.role;

	const pageTitle = "My Applications";

	return (
		<Page type="sub">
			<Page.Header title={pageTitle} />
			<Page.Body>
				{isLoading || !role ? (
					<div>Loading...</div>
				) : role !== "artist" ? (
					<div>Redirecting...</div>
				) : (
					<UserApplications />
				)}
			</Page.Body>
		</Page>
	);
}

export default MyApplicationsPage;
