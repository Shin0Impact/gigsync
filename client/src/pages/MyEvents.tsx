import { Button, Page } from "@components";
import { useMeQuery } from "../features/auth";
import { UserEvents } from "../features/events/components/UserEvents";
import { useSearchParams } from "react-router-dom";
import { type MouseEvent } from "react";

export function MyEventsPage() {
	const [searchParams, setSearchParams] = useSearchParams();
	const isDrawerOpen = searchParams.get("drawer") === "open";

	const { data: meData, isLoading } = useMeQuery();
	const userId = meData?.user?.userId;
	const role = meData?.user?.role;

	const handleAddEvent = (e: MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setSearchParams((prev) => {
			const newParams = new URLSearchParams(prev);
			if (isDrawerOpen) {
				newParams.delete("drawer");
			} else {
				newParams.set("drawer", "open");
			}
			return newParams;
		});
	};

	return (
		<Page type="main">
			<Page.Header
				title="My Events"
				actions={
					<Button
						variant="solid"
						onClick={handleAddEvent}>
						Add Event
					</Button>
				}
				mode="button"
			/>
			<Page.Body>
				{isLoading || !userId || !role ? (
					<p>Loading…</p>
				) : (
					<UserEvents
						organizerId={userId}
						mine={true}
						userRole="organizer"
					/>
				)}
			</Page.Body>
		</Page>
	);
}
