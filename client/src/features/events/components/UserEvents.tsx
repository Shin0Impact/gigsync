import { useListEventsQuery, useListMyApplicationsQuery } from "../eventsApi";
import styles from "./UserEvents.module.css";
import { ROUTES } from "../../../routes/routePaths";
import { EventCard } from "./EventCard";
import { EmptyState } from "@components/ui/EmptyState/EmptyState";
import { UserRole } from "@shared/types/index";
import { useNavigate } from "react-router-dom";
import { useDrawer } from "../../../hooks/useDrawer";

interface UserEventsProps {
	organizerId?: string;
	mine?: boolean;
	userRole?: UserRole | "guest";
	status?: "open" | "filled" | "completed" | "cancelled";
}

export function UserEvents({ organizerId, mine = false, userRole = "guest", status = "open" }: UserEventsProps) {
	const navigate = useNavigate();
	const { toggleDrawer } = useDrawer();

	const {
		data: eventsData,
		isLoading: isLoadingEvents,
		error,
	} = useListEventsQuery(organizerId ? { organizerId } : undefined);
	const { data: myAppsData, isLoading: isLoadingApps } = useListMyApplicationsQuery(undefined, {
		skip: userRole !== "artist",
	});

	const allEvents = eventsData?.events ?? [];
	const applications = myAppsData?.applications ?? [];

	const events = allEvents.filter((event: any) => (status ? event.status === status : true));

	const isLoading = isLoadingEvents || (userRole === "artist" && isLoadingApps);

	const EMPTY_STATE_MESSAGES: Record<string, { title: string; subtitle: string }> = {
		open: {
			title: "Not much going on yet.",
			subtitle: mine
				? "You have no open Events right now. Host a new Event to start accepting proposals from creatives."
				: "Check back soon for upcoming Events.",
		},
		filled: {
			title: "Confirmed and finalized.",
			subtitle: "Events with booked artists will appear here once you finalize your lineup.",
		},
		completed: {
			title: "Your Event archive.",
			subtitle: "Once your Events conclude, you can find them here.",
		},
		cancelled: {
			title: "Nothing shelved.",
			subtitle: "Any events you choose to withdraw or cancel will be kept here, visible only to you.",
		},
	};

	const currentEmptyState = EMPTY_STATE_MESSAGES[status] ?? EMPTY_STATE_MESSAGES.open;

	return (
		<main className={styles.container}>
			{isLoading && <div className={styles.loading}>{mine ? "Loading your Events..." : "Loading Events..."}</div>}

			{error && <div className={styles.error}>We had a problem loading events. Please try refreshing.</div>}

			{!isLoading && !error && events.length === 0 && (
				<div className={styles.emptyState}>
					<EmptyState
						title={currentEmptyState.title}
						subtitle={currentEmptyState.subtitle}
						actionLabel={mine ? "Host an Event" : "Explore Events"}
						onAction={mine ? () => toggleDrawer() : () => navigate(ROUTES.DISCOVERY_EVENTS)}
					/>
				</div>
			)}

			{!isLoading && events.length > 0 && (
				<section className={styles.userEvents}>
					{events.map((event: any) => {
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

export default UserEvents;
