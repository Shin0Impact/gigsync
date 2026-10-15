import { Button, Page } from "@components";
import { useMeQuery } from "../features/auth";
import { UserEvents } from "../features/events/components/UserEvents";
import { useSearchParams } from "react-router-dom";

export function MyEventsPage() {
	const [searchParams, setSearchParams] = useSearchParams();
	const status = (searchParams.get("status") as "open" | "filled" | "completed" | "cancelled") || "open";

	const { data: meData, isLoading } = useMeQuery();
	const userId = meData?.user?.userId;
	const role = meData?.user?.role;

	const statuses: ("open" | "filled" | "completed" | "cancelled")[] = ["open", "filled", "completed", "cancelled"];

	return (
		<Page type="main">
			<Page.Header
				title="My Events"
				mode="button"
				actions={
					<div style={{ display: "flex", gap: "1rem" }}>
						{statuses.map((s) => (
							<Button
								onClick={() => {
									setSearchParams(
										(prev) => {
											const newParams = new URLSearchParams(prev);
											newParams.set("status", s);
											return newParams;
										},
										{ replace: true },
									);
								}}
								variant={status === s ? "solid" : "ghost"}>
								{s.charAt(0).toUpperCase() + s.slice(1)}
							</Button>
						))}
					</div>
				}
			/>
			<Page.Body>
				{isLoading || !userId || !role ? (
					<p>Loading…</p>
				) : (
					<UserEvents
						organizerId={userId}
						mine={true}
						userRole="organizer"
						status={status}
					/>
				)}
			</Page.Body>
		</Page>
	);
}

export default MyEventsPage;
