import { useState } from "react";
import { useListEventsQuery } from "../../features/events/eventsApi";
import { useListMyApplicationsQuery } from "../../features/events";
import { ApplyToEventModal } from "../../features/events/components/ApplyToEventModal";
import type { DbEvent } from "@shared/types/index";
import styles from "./Events.module.css";

function formatDateRange(startAt: string | Date, endAt: string | Date): string {
	const start = new Date(startAt);
	const end = new Date(endAt);
	const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };
	const startStr = start.toLocaleDateString("en-US", opts);
	const endStr = end.toLocaleDateString("en-US", opts);
	return startStr === endStr ? startStr : `${startStr} – ${endStr}`;
}

// Browse open gigs and apply - "My Applications" below tracks what you
// have already sent and whether the organizer has responded yet. There
// is no notifications table for application decisions, so NotificationsPage
// surfaces accepted/rejected outcomes too (see get_my_activity on the server).
export function Events() {
	const { data: eventsData, isLoading: isLoadingEvents, error: eventsError } = useListEventsQuery({ status: "open" });
	const { data: applicationsData, isLoading: isLoadingApplications } = useListMyApplicationsQuery();
	const [applyTarget, setApplyTarget] = useState<DbEvent | null>(null);

	const events = eventsData?.events ?? [];
	const applications = applicationsData?.applications ?? [];
	const appliedEventIds = new Set(applications.map((application) => application.event_id));

	return (
		<main className={styles.container}>
			<header className={styles.header}>
				<div className={styles.titleGroup}>
					<h1 className={styles.title}>Gigs & Events</h1>
					<p className={styles.subtitle}>Open opportunities looking for artists right now</p>
				</div>
			</header>

			{isLoadingEvents && <div className={styles.loading}>Loading open gigs…</div>}

			{eventsError && <div className={styles.error}>Unable to load events right now. Please try refreshing.</div>}

			{!isLoadingEvents && !eventsError && events.length === 0 && (
				<div className={styles.emptyState}>
					<h2 className={styles.emptyTitle}>No open gigs right now</h2>
					<p className={styles.emptyText}>Check back soon - organizers post new opportunities regularly.</p>
				</div>
			)}

			{!isLoadingEvents && events.length > 0 && (
				<section className={styles.grid}>
					{events.map((event) => {
						const alreadyApplied = appliedEventIds.has(event.id);
						return (
							<div
								key={event.id}
								className={styles.card}>
								<header className={styles.cardHeader}>
									<h3 className={styles.cardTitle}>{event.title}</h3>
									<time className={styles.cardDate}>{formatDateRange(event.start_at, event.end_at)}</time>
								</header>

								{event.venue_name && <p className={styles.venue}>📍 {event.venue_name}</p>}

								<p className={styles.description}>{event.descriptions}</p>

								{event.categories_needed && event.categories_needed.length > 0 && (
									<div className={styles.categories}>
										{event.categories_needed.map((category) => (
											<span
												key={category}
												className={styles.categoryBadge}>
												{category}
											</span>
										))}
									</div>
								)}

								<button
									type="button"
									className={styles.applyButton}
									disabled={alreadyApplied}
									onClick={() => setApplyTarget(event)}>
									{alreadyApplied ? "Already Applied" : "Apply"}
								</button>
							</div>
						);
					})}
				</section>
			)}

			<section className={styles.applicationsSection}>
				<h2 className={styles.sectionTitle}>My Applications</h2>

				{isLoadingApplications && <div className={styles.loading}>Loading your applications…</div>}

				{!isLoadingApplications && applications.length === 0 && (
					<p className={styles.emptyText}>You have not applied to any gigs yet.</p>
				)}

				{!isLoadingApplications && applications.length > 0 && (
					<ul className={styles.applicationList}>
						{applications.map((application) => (
							<li
								key={application.id}
								className={styles.applicationItem}>
								<div className={styles.applicationInfo}>
									<span className={styles.applicationTitle}>{application.event_title}</span>
									<time className={styles.applicationDate}>
										{new Date(application.event_start_at).toLocaleDateString("en-US", {
											month: "short",
											day: "numeric",
											year: "numeric",
										})}
									</time>
								</div>
								<span
									className={styles.statusBadge}
									data-status={application.status}>
									{application.status}
								</span>
							</li>
						))}
					</ul>
				)}
			</section>

			<ApplyToEventModal
				event={applyTarget}
				onClose={() => setApplyTarget(null)}
			/>
		</main>
	);
}

export default Events;
