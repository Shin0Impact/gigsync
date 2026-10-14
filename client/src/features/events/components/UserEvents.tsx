import { useListEventsQuery } from "../eventsApi";
import styles from "./UserEvents.module.css";
import { ROUTES } from "../../../routes/routePaths";
import { EventCard } from "./EventCard";
import { EmptyState } from "@components/ui/EmptyState/EmptyState";

interface UserEventsProps {
	organizerId?: string;
	mine?: boolean;
	userRole?: "artist" | "organizer" | "fan" | "guest";
}

export function UserEvents({ organizerId, mine = false, userRole = "guest" }: UserEventsProps) {
	const { data: eventsData, isLoading, error } = useListEventsQuery(organizerId ? { organizerId } : undefined);

	const events = eventsData?.events ?? [];

	return (
		<main className={styles.container}>
			{isLoading && (
				<div className={styles.loading}>{mine ? "Loading your Happenings..." : "Loading Happenings..."}</div>
			)}

			{error && <div className={styles.error}>We had a problem loading events. Please try refreshing.</div>}

			{!isLoading && !error && events.length === 0 && (
				<div className={styles.emptyState}>
					<EmptyState
						title="No Happenings yet."
						subtitle={
							mine
								? "Host your first event and connect with artists in the community."
								: "Check back soon for upcoming events."
						}
						actionLabel={mine ? "Host a Happening" : "Explore Happenings"}
						to={ROUTES.DISCOVERY_HAPPENINGS}
					/>
				</div>
			)}

			{!isLoading && events.length > 0 && (
				<section className={styles.userEvents}>
					{events.map((event: any) => (
						<EventCard
							key={event.id}
							event={event}
							isMine={mine}
							userRole={userRole}
						/>
					))}
				</section>
			)}
		</main>
	);
}
