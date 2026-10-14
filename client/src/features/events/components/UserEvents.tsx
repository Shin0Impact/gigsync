import { useListEventsQuery, useListMyApplicationsQuery } from "../eventsApi";
import styles from "./UserEvents.module.css";
import { ROUTES } from "../../../routes/routePaths";
import { EventCard } from "./EventCard";
import { EmptyState } from "@components/ui/EmptyState/EmptyState";
import { UserRole } from "@shared/types/index";

interface UserEventsProps {
	organizerId?: string;
	mine?: boolean;
	userRole?: UserRole | "guest";
}

export function UserEvents({ organizerId, mine = false, userRole = "guest" }: UserEventsProps) {
	const {
		data: eventsData,
		isLoading: isLoadingEvents,
		error,
	} = useListEventsQuery(organizerId ? { organizerId } : undefined);
	const { data: myAppsData, isLoading: isLoadingApps } = useListMyApplicationsQuery(undefined, {
		skip: userRole !== "artist",
	});

	const events = eventsData?.events ?? [];
	const applications = myAppsData?.applications ?? [];

	const isLoading = isLoadingEvents || (userRole === "artist" && isLoadingApps);

	return (
		<main className={styles.container}>
			{isLoading && <div className={styles.loading}>{mine ? "Loading your Events..." : "Loading Events..."}</div>}

			{error && <div className={styles.error}>We had a problem loading events. Please try refreshing.</div>}

			{!isLoading && !error && events.length === 0 && (
				<div className={styles.emptyState}>
					<EmptyState
						title="No Events yet."
						subtitle={
							mine
								? "Host your first Event and connect with creatives in the community."
								: "Check back soon for upcoming Events."
						}
						actionLabel={mine ? "Host an Event" : "Explore Events"}
						to={ROUTES.DISCOVERY_EVENTS}
					/>
				</div>
			)}

			{!isLoading && events.length > 0 && (
				<section className={styles.userEvents}>
					{events.map((event: any) => {
						// Find if the current artist has an application for this specific event
						const matchedApp = applications.find(
							(app: any) => String(app.event_id ?? app.eventId) === String(event.id),
						);

						return (
							<EventCard
								key={event.id}
								event={event}
								isMine={mine}
								userRole={userRole}
								application={matchedApp}
							/>
						);
					})}
				</section>
			)}
		</main>
	);
}
