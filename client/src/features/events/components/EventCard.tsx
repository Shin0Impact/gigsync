import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { MouseEvent } from "react";
import { useDeleteEventMutation, useApplyToEventMutation } from "../eventsApi";
import { ROUTES } from "../../../routes/routePaths";
import styles from "./EventCard.module.css";
import { Button } from "@components";

interface EventCardProps {
	event: any; // Replace with your generated event type from shared types
	isMine?: boolean;
	userRole?: "artist" | "organizer" | "fan" | "guest";
}

export function EventCard({ event, isMine = false, userRole = "guest" }: EventCardProps) {
	const navigate = useNavigate();
	const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

	const [deleteEvent, { isLoading: isDeleting, error: deleteError }] = useDeleteEventMutation();
	const [applyToEvent, { isLoading: isApplying }] = useApplyToEventMutation();

	const formattedDate = event.startAt
		? new Date(event.startAt).toLocaleDateString("en-US", {
				month: "short",
				day: "numeric",
				year: "numeric",
			})
		: null;

	const handleDeleteClick = (e: MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsConfirmingDelete(true);
	};

	const handleConfirmDelete = async () => {
		try {
			await deleteEvent(event.id).unwrap();
			setIsConfirmingDelete(false);
		} catch (err) {
			console.error("Failed to delete event:", err);
		}
	};

	const handleApplyClick = async (e: MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		try {
			await applyToEvent({ eventId: event.id }).unwrap();
			alert("Application submitted successfully!");
		} catch (err) {
			console.error("Failed to apply to event:", err);
			alert("Failed to submit application.");
		}
	};

	const handleViewApplications = (e: MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		navigate(`${ROUTES.DISCOVERY_HAPPENINGS}/${event.id}/applications`);
	};

	return (
		<div
			className={styles.cardWrapper}
			data-confirm={isConfirmingDelete}>
			<Link
				className={styles.card}
				role="button"
				to={ROUTES.SINGLE_EVENT(event.id)}
				style={{ textDecoration: "none" }}
				aria-label={`Open event ${event.title}`}>
				{/* Vignette / Date Badge */}
				<div className={styles.cardVignette}>{formattedDate ? <span>{formattedDate}</span> : <span>Event</span>}</div>

				<div className={styles.cardBody}>
					<div className={styles.metaTop}>
						<span>{event.status || "Upcoming"}</span>
						{event.isRecurring && <span>🔄 Recurring</span>}
					</div>

					<div className={styles.details}>
						<div className={styles.text}>
							<header className={styles.header}>
								<span className={styles.title}>{event.title}</span>
							</header>
							{event.venueName && <span className={styles.venue}>📍 {event.venueName}</span>}

							<p className={`${styles.description} ${!event.description ? styles.noDescription : ""}`}>
								{event.description || "No description provided for this happening."}
							</p>
						</div>

						{/* Role-Based Actions */}
						<div className={styles.actions}>
							{isMine ? (
								<>
									<Button
										variant="solid"
										className={`${styles.actionButton} ${styles.primaryBtn}`}
										onClick={handleViewApplications}>
										See Applications
									</Button>
									<Button
										type="button"
										className={`${styles.actionButton} ${styles.deleteBtn}`}
										onClick={handleDeleteClick}>
										Del
									</Button>
								</>
							) : userRole === "artist" ? (
								<Button
									variant="solid"
									className={`${styles.actionButton} ${styles.primaryBtn}`}
									onClick={handleApplyClick}
									disabled={isApplying}>
									{isApplying ? "Applying..." : "Apply to Event"}
								</Button>
							) : null}
						</div>
					</div>
				</div>
			</Link>

			{/* Slide-out Delete Confirmation Panel */}
			<div className={styles.confirmDelete}>
				<p>Delete this Event?</p>
				<p>This action cannot be undone. All incoming artist applications for this happening will be removed.</p>
				{deleteError && <p className={styles.errorText}>Failed to delete event. Please try again.</p>}
				<div className={styles.confirmActions}>
					<Button
						className={styles.confirmButton}
						onClick={handleConfirmDelete}
						disabled={isDeleting}
						variant="ghost">
						{isDeleting ? "Deleting..." : "Delete Event"}
					</Button>
					<Button
						className={styles.cancelButton}
						variant="solid"
						onClick={() => setIsConfirmingDelete(false)}>
						Cancel
					</Button>
				</div>
			</div>
		</div>
	);
}
