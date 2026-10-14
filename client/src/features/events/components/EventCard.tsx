import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import type { MouseEvent } from "react";
import { useDeleteEventMutation, useListMyApplicationsQuery } from "../eventsApi";
import { ROUTES } from "../../../routes/routePaths";
import styles from "./EventCard.module.css";
import { Button } from "@components";
import { UserRole } from "@shared/types/index";
import { Metaballs } from "@paper-design/shaders-react";

interface EventCardProps {
	event: any;
	isMine?: boolean;
	userRole?: UserRole | "guest";
	application?: any;
}

export function EventCard({ event, isMine = false, userRole = "guest", application }: EventCardProps) {
	const [searchParams, setSearchParams] = useSearchParams();
	const navigate = useNavigate();
	const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
	const [isViewingCoverNote, setIsViewingCoverNote] = useState(false);

	const [deleteEvent, { isLoading: isDeleting, error: deleteError }] = useDeleteEventMutation();

	const { data: myAppsData } = useListMyApplicationsQuery(undefined, {
		skip: userRole !== "artist",
	});

	const myApplication = application || myAppsData?.applications?.find((app) => String(app.event_id) === String(event.id));
	const coverNoteText = myApplication?.cover_note || myApplication?.coverNote;

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
		setIsViewingCoverNote(false);
		setIsConfirmingDelete(true);
	};

	const handleCoverNoteClick = (e: MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsConfirmingDelete(false);
		setIsViewingCoverNote((prev) => !prev);
	};

	const handleConfirmDelete = async () => {
		try {
			await deleteEvent(event.id).unwrap();
			setIsConfirmingDelete(false);
		} catch (err) {
			console.error("Failed to delete event:", err);
		}
	};

	const handleApplyClick = (e: MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setSearchParams((prev) => {
			const next = new URLSearchParams(prev);
			next.set("drawer", "open");
			next.set("form", "apply");
			next.set("eventId", String(event.id));
			return next;
		});
	};

	const handleViewApplications = (e: MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		navigate(ROUTES.EVENT_APPLICATIONS(event.id));
	};

	const isDrawerActive = isConfirmingDelete || isViewingCoverNote;

	return (
		<div
			className={styles.cardWrapper}
			data-confirm={isDrawerActive}>
			<Link
				className={styles.card}
				role="button"
				to={ROUTES.SINGLE_EVENT(event.id)}
				style={{ textDecoration: "none" }}
				aria-label={`Open event ${event.title}`}>
				{/* <div className={styles.cardVignette}>{formattedDate ? <span>{formattedDate}</span> : <span>Event</span>}</div> */}
				<div className={styles.cardVignette}>
					<Metaballs
						width={"auto"}
						height={"100%"}
						colors={["#f3d66d"]}
						colorBack="#00000000"
						count={20}
						size={0.72}
						speed={1}
						scale={2}
					/>
				</div>

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
								<>
									<Button
										variant="solid"
										data-applied={Boolean(myApplication)}
										className={`${styles.actionButton} ${styles.primaryBtn}`}
										onClick={handleApplyClick}>
										{myApplication ? `Application ${myApplication.status}` : "Apply to Event"}
									</Button>
									{coverNoteText && (
										<Button
											type="button"
											variant="ghost"
											className={`${styles.actionButton} ${styles.coverBtn}`}
											onClick={handleCoverNoteClick}>
											{isViewingCoverNote ? "Close Note" : "Cover Note"}
										</Button>
									)}
								</>
							) : null}
						</div>
					</div>
				</div>
			</Link>

			<div className={`${styles.confirmDelete} ${isConfirmingDelete ? styles.activePanel : ""}`}>
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

			<div className={`${styles.confirmDelete} ${isViewingCoverNote ? styles.activePanel : ""}`}>
				<p>Cover Letter Note</p>
				<div className={styles.scrollableContent}>
					<p
						className={styles.coverLetterText}
						style={{ whiteSpace: "pre-wrap" }}>
						{coverNoteText}
					</p>
				</div>
				<div className={styles.confirmActions}>
					<Button
						className={styles.cancelButton}
						variant="solid"
						onClick={() => setIsViewingCoverNote(false)}>
						Close
					</Button>
				</div>
			</div>
		</div>
	);
}
