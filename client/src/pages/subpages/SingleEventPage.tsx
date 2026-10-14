import { useParams, useSearchParams } from "react-router-dom";
import { Page, Button } from "@components";
import styles from "./SingleEventPage.module.css";
import { useMeQuery } from "../../features/auth";
import { useGetEventQuery } from "../../features/events";
import { useApplyToEventMutation, useListEventApplicationsQuery } from "../../features/events/eventsApi";

export function SingleEventPage() {
	const { id: eventId } = useParams<{ id: string }>();
	const [searchParams, setSearchParams] = useSearchParams();
	const isDrawerOpen = searchParams.get("drawer") === "open";

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

	const { data: applicationsData, isLoading: isLoadingApps } = useListEventApplicationsQuery(numericEventId!, {
		skip: !numericEventId || !isMine,
	});

	const applications = applicationsData?.applications ?? [];
	const [applyToEvent, { isLoading: isApplying }] = useApplyToEventMutation();

	const handleToggleDrawer = () => {
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

	const handleApply = async () => {
		if (!numericEventId) return;
		try {
			await applyToEvent({ eventId: numericEventId }).unwrap();
			alert("Successfully applied to this event!");
		} catch (err) {
			console.error("Failed to apply:", err);
			alert("Failed to submit application.");
		}
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
	const formattedDate = event?.start_at
		? new Date(event.start_at).toLocaleDateString("en-US", {
				month: "long",
				day: "numeric",
				year: "numeric",
			})
		: null;

	return (
		<Page type="sub">
			<Page.Header
				title={eventTitle}
				// subtitle={formattedDate ? `Happening on ${formattedDate}` : "Happening details"}
				mode="button"
				actions={
					isMine ? (
						<Button
							variant="solid"
							onClick={handleToggleDrawer}
							className={styles.actionBtn}>
							{isDrawerOpen ? "Close Manager" : "Manage Applications"}
						</Button>
					) : userRole === "artist" ? (
						<Button
							variant="solid"
							onClick={handleApply}
							disabled={isApplying}
							className={styles.actionBtn}>
							{isApplying ? "Applying..." : "Apply to Event"}
						</Button>
					) : null
				}
			/>
			<Page.Body>
				<div className={styles.container}>
					{isLoadingEvent ? (
						<div className={styles.loading}>Loading event details...</div>
					) : eventError ? (
						<div className={styles.error}>Failed to load event information.</div>
					) : event ? (
						<div className={styles.eventContent}>
							<div className={styles.metaSection}>
								<span className={styles.badge}>{event.status || "Upcoming"}</span>
								{event.venue_name && <span className={styles.venue}>📍 {event.venue_name}</span>}
							</div>

							<p className={styles.description}>
								{event.descriptions || "No description provided for this happening."}
							</p>
						</div>
					) : null}

					{/* Organizer view: Application tracker list */}
					{isMine && (
						<section className={styles.applicationsSection}>
							<h2 className={styles.sectionTitle}>Artist Applications ({applications.length})</h2>

							{isLoadingApps && <div className={styles.loading}>Loading applications...</div>}

							{!isLoadingApps && applications.length === 0 && (
								<div className={styles.emptyState}>
									<p className={styles.emptyText}>No artist applications received yet.</p>
								</div>
							)}

							{!isLoadingApps && applications.length > 0 && (
								<div className={styles.applicationsList}>
									{applications.map((app: any) => (
										<div
											key={app.id}
											className={styles.applicationCard}>
											<div className={styles.appInfo}>
												<span className={styles.artistName}>Artist ID: {app.artistId}</span>
												<span className={styles.appStatus}>Status: {app.status}</span>
											</div>
											{app.coverNote && <p className={styles.coverNote}>"{app.coverNote}"</p>}
										</div>
									))}
								</div>
							)}
						</section>
					)}
				</div>
			</Page.Body>
		</Page>
	);
}

export default SingleEventPage;
