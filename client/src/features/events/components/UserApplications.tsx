import { useListMyApplicationsQuery, useListEventsQuery } from "../eventsApi";
import { EventCard } from "./EventCard";
import styles from "./UserApplications.module.css";
import { useMeQuery } from "../../auth";
import { EmptyState } from "@components/ui/EmptyState/EmptyState";
import { ROUTES } from "../../../routes/routePaths";

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

	const isLoading = isLoadingApps || isLoadingEvents;

	// Filter applications by the selected status tab (case-insensitive check)
	const filteredApps = applications.filter((app) => app.status?.toLowerCase() === statusFilter.toLowerCase());

	const appliedEvents = filteredApps
		.map((app) => {
			const eventObj = allEvents.find((ev) => String(ev.id) === String(app.event_id));
			return { app, eventObj };
		})
		.filter((item) => item.eventObj != null);

	return (
		<main className={styles.container}>
			{isLoading && <div className={styles.loading}>Loading applications...</div>}

			{!isLoading && appliedEvents.length === 0 && (
				<div className={styles.emptyState}>
					<EmptyState
						title={`No ${statusFilter} applications found.`}
						subtitle="Events you apply for will appear here."
						actionLabel="Discover upcoming Events"
						to={ROUTES.DISCOVERY_EVENTS}
					/>
				</div>
			)}

			{!isLoading && appliedEvents.length > 0 && (
				<section className={styles.applicationList}>
					{appliedEvents.map(({ app, eventObj }) => (
						<EventCard
							key={app.id}
							event={eventObj}
							isMine={false}
							userRole={userRole}
							application={app}
						/>
					))}
				</section>
			)}
		</main>
	);
}
