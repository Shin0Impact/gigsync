import React from "react";
import { useParams, Outlet, NavLink, useNavigate } from "react-router-dom";
import { Page, Button } from "@components";
import styles from "./SingleEventPage.module.css";
import { useMeQuery } from "../../features/auth";
import { useGetEventQuery } from "../../features/events";
import { useListMyApplicationsQuery } from "../../features/events/eventsApi";

export function SingleEventPage() {
	const { id: eventId } = useParams<{ id: string }>();
	const navigate = useNavigate();

	const numericEventId = eventId ? Number(eventId) : undefined;

	const { data: meData } = useMeQuery();
	const userRole = meData?.user?.role ?? "guest";

	const {
		data: eventData,
		isLoading: isLoadingEvent,
		error: eventError,
	} = useGetEventQuery(numericEventId!, {
		skip: !numericEventId,
	});

	const event = eventData?.event;
	const organizerId = event?.organizer_id;
	const currentUserId = meData?.user?.userId;
	const isMine = organizerId && currentUserId && String(organizerId) === String(currentUserId);

	const { data: myAppsData } = useListMyApplicationsQuery(undefined, {
		skip: userRole !== "artist",
	});
	const myApplications = myAppsData?.applications ?? [];
	const existingApplication = myApplications.find((app) => String(app.event_id) === String(numericEventId));

	const handleApply = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (!event) return;
		const searchParams = new URLSearchParams(window.location.search);
		searchParams.set("drawer", "open");
		searchParams.set("form", "apply");
		searchParams.set("eventId", String(event.id));
		navigate({ search: searchParams.toString() });
	};

	if (!numericEventId) {
		return (
			<Page type="sub">
				<Page.Body>
					<div className={styles.error}>Invalid Event ID.</div>
				</Page.Body>
			</Page>
		);
	}

	const eventTitle = event?.title ?? `Happening #${numericEventId}`;

	return (
		<Page type="sub">
			<Page.Header
				title={eventTitle}
				mode="button"
				actions={
					!isMine && userRole === "artist" ? (
						<Button
							variant="solid"
							onClick={handleApply}
							disabled={Boolean(existingApplication)}
							className={styles.actionBtn}>
							{existingApplication ? `Applied (${existingApplication.status})` : "Apply to Event"}
						</Button>
					) : null
				}
			/>
			<Page.Body>
				<div className={styles.container}>
					{eventError ? (
						<div className={styles.error}>Failed to load event information.</div>
					) : (
						<>
							{/* Tab navigation for organizers */}
							{isMine && (
								<div className={styles.tabsContainer}>
									<NavLink
										to=""
										end
										className={({ isActive }) => `${styles.tabLink} ${isActive ? styles.activeTab : ""}`}>
										Event
									</NavLink>
									<NavLink
										to="applications"
										className={({ isActive }) => `${styles.tabLink} ${isActive ? styles.activeTab : ""}`}>
										Applications
									</NavLink>
								</div>
							)}

							{/* Always render Outlet so child routes load */}
							<Outlet context={{ event, isMine, isLoadingEvent }} />
						</>
					)}
				</div>
			</Page.Body>
		</Page>
	);
}

export default SingleEventPage;
