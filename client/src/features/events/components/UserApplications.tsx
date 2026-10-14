import { useListMyApplicationsQuery, useListEventsQuery } from "../eventsApi";
import { EventCard } from "./EventCard";
import styles from "./Applications.module.css";
import { useMeQuery } from "../../auth";

interface UserApplicationsProps {
	statusFilter?: "pending" | "accepted" | "rejected";
}

export function UserApplications({ statusFilter = "pending" }: UserApplicationsProps) {
	const { data: myAppsData, isLoading: isLoadingApps } = useListMyApplicationsQuery();
	const { data: eventsData, isLoading: isLoadingEvents } = useListEventsQuery();
	const { data: meData } = useMeQuery();

	const userRole = meData?.user?.role ?? "artist";
	const applications = myAppsData?.applications ?? [];
	const allEvents = eventsData?.events ?? [];

	if (isLoadingApps || isLoadingEvents) {
		return <div className={styles.loading}>Loading applications...</div>;
	}

	// Filter applications by the selected status tab (case-insensitive check)
	const filteredApps = applications.filter((app) => app.status?.toLowerCase() === statusFilter.toLowerCase());

	if (filteredApps.length === 0) {
		return (
			<div className={styles.emptyState}>
				<p className={styles.emptyText}>No {statusFilter} applications found.</p>
			</div>
		);
	}

	const appliedEvents = filteredApps
		.map((app) => {
			const eventObj = allEvents.find((ev) => String(ev.id) === String(app.event_id));
			return { app, eventObj };
		})
		.filter((item) => item.eventObj != null);

	return (
		<div
			className={styles.applicationListContainer}
			style={{ display: "flex", flexDirection: "column", gap: "1rem", width: "100%", alignItems: "center" }}>
			{appliedEvents.map(({ app, eventObj }) => (
				<EventCard
					key={app.id}
					event={eventObj}
					isMine={false}
					userRole={userRole}
					application={app}
				/>
			))}
		</div>
	);
}
