import { useState } from "react";
import { Page, Button } from "@components";
import { useMeQuery } from "../features/auth";
import { UserApplications } from "../features/events/components/UserApplications";

function MyApplicationsPage() {
	const { data, isLoading } = useMeQuery();
	const role = data?.user?.role;
	const [statusTab, setStatusTab] = useState<"pending" | "accepted" | "rejected">("pending");

	return (
		<Page type="main">
			<Page.Header
				title="My Applications"
				mode="button"
				actions={
					<div style={{ display: "flex", gap: "0.5rem" }}>
						<Button
							variant={statusTab === "pending" ? "solid" : "ghost"}
							onClick={() => setStatusTab("pending")}>
							Pending
						</Button>
						<Button
							variant={statusTab === "accepted" ? "solid" : "ghost"}
							onClick={() => setStatusTab("accepted")}>
							Accepted
						</Button>
						<Button
							variant={statusTab === "rejected" ? "solid" : "ghost"}
							onClick={() => setStatusTab("rejected")}>
							Rejected
						</Button>
					</div>
				}
			/>
			<Page.Body>
				{isLoading || !role ? (
					<div>Loading...</div>
				) : role !== "artist" ? (
					<div>Redirecting...</div>
				) : (
					<UserApplications statusFilter={statusTab} />
				)}
			</Page.Body>
		</Page>
	);
}

export default MyApplicationsPage;
