import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { MouseEvent } from "react";
import { useDeleteEventMutation, useListMyApplicationsQuery } from "../eventsApi";
import { ROUTES } from "../../../routes/routePaths";
import styles from "./EventCard.module.css";
import { Button } from "@components";
import { UserRole } from "@shared/types/index";
import { Metaballs } from "@paper-design/shaders-react";
import { useDrawer } from "../../../hooks/useDrawer";
import {
	UndoIcon as RecurringIcon,
	type UndoIconHandle,
	Clock01Icon as TimeIcon,
	type Clock01IconHandle as TimeIconHandle,
} from "@animateicons/react/huge";
import { MapPinIcon, AlarmClockIcon, type MapPinIconHandle, type AlarmClockIconHandle } from "@animateicons/react/lucide";

interface EventCardProps {
	event: any;
	isMine?: boolean;
	userRole?: UserRole | "guest";
	application?: any;
}

export function EventCard({ event, isMine = false, userRole = "guest", application }: EventCardProps) {
	const navigate = useNavigate();
	const [isOptionsOpen, setIsOptionsOpen] = useState(false);
	const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
	const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);
	const [isViewingCoverNote, setIsViewingCoverNote] = useState(false);

	const recurringIconRef = useRef<UndoIconHandle>(null);
	const mapPinIconRef = useRef<MapPinIconHandle>(null);
	const alarmClockIconRef = useRef<AlarmClockIconHandle>(null);
	const timeIconRef = useRef<TimeIconHandle>(null);

	const [deleteEvent, { isLoading: isDeleting, error: deleteError }] = useDeleteEventMutation();

	const { data: myAppsData } = useListMyApplicationsQuery(undefined, {
		skip: userRole !== "artist",
	});

	const myApplication = application || myAppsData?.applications?.find((app) => String(app.event_id) === String(event.id));
	const coverNoteText = myApplication?.cover_note || myApplication?.coverNote;

	const { toggleDrawer } = useDrawer();

	const handleOptionsClick = (e: MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsViewingCoverNote(false);
		setIsConfirmingDelete(false);
		setIsConfirmingCancel(false);
		setIsOptionsOpen((prev) => !prev);
	};

	const handleCoverNoteClick = (e: MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsOptionsOpen(false);
		setIsConfirmingDelete(false);
		setIsConfirmingCancel(false);
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

	const handleConfirmCancel = async () => {
		try {
			setIsConfirmingCancel(false);
		} catch (err) {
			console.error("Failed to cancel event:", err);
		}
	};

	const handleApplyClick = (e: MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		toggleDrawer({
			openParams: {
				form: "apply",
				eventId: String(event.id),
			},
			keysToDeleteOnClose: ["eventId"],
		});
	};

	const handleViewApplications = (e: MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		navigate(ROUTES.EVENT_APPLICATIONS(event.id));
	};

	const isDrawerActive = isOptionsOpen || isConfirmingDelete || isConfirmingCancel || isViewingCoverNote;
	const isRecurring = Boolean(event.is_recurring ?? event.isRecurring);
	const isUrgent = Boolean(event.is_urgent ?? event.isUrgent);
	const venueName = event.venue_name ?? event.venueName;
	const description = event.descriptions ?? event.description;
	const startAt = event.start_at ?? event.startAt;
	const endAt = event.end_at ?? event.endAt;

	const formatDate = (dateString?: string) => {
		if (!dateString) return null;
		try {
			return new Date(dateString).toLocaleDateString("en-US", {
				month: "short",
				day: "numeric",
				hour: "2-digit",
				minute: "2-digit",
			});
		} catch {
			return null;
		}
	};

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
						{isUrgent && (
							<span
								className={styles.tag}
								onMouseEnter={() => alarmClockIconRef.current?.startAnimation()}
								onMouseLeave={() => alarmClockIconRef.current?.stopAnimation()}>
								<AlarmClockIcon
									ref={alarmClockIconRef}
									size={14}
									style={{ display: "inline-block", verticalAlign: "middle", marginRight: "0.2rem" }}
								/>
								Urgent
							</span>
						)}
						{isRecurring && (
							<span
								className={styles.tag}
								onMouseEnter={() => recurringIconRef.current?.startAnimation()}
								onMouseLeave={() => recurringIconRef.current?.stopAnimation()}>
								<RecurringIcon
									ref={recurringIconRef}
									size={14}
									style={{ display: "inline-block", verticalAlign: "middle", marginRight: "0.2rem" }}
								/>
								Recurring
							</span>
						)}
						<span className={styles.tag}>{event.status || "Upcoming"}</span>
					</div>

					<div className={styles.details}>
						<div className={styles.text}>
							<header className={styles.header}>
								<span className={styles.title}>{event.title}</span>
							</header>

							<div className={styles.infoRow}>
								{venueName && (
									<span
										className={styles.venue}
										onMouseEnter={() => mapPinIconRef.current?.startAnimation()}
										onMouseLeave={() => mapPinIconRef.current?.stopAnimation()}>
										<MapPinIcon
											ref={mapPinIconRef}
											size={14}
											style={{ display: "inline-block", verticalAlign: "middle", marginRight: "0.2rem" }}
										/>
										{venueName}
									</span>
								)}
								{startAt && (
									<span
										className={styles.dates}
										onMouseEnter={() => timeIconRef.current?.startAnimation()}
										onMouseLeave={() => timeIconRef.current?.stopAnimation()}>
										<TimeIcon
											ref={timeIconRef}
											size={14}
											style={{ display: "inline-block", verticalAlign: "middle", marginRight: "0.2rem" }}
										/>{" "}
										{formatDate(startAt)} {endAt ? `– ${formatDate(endAt)}` : ""}
									</span>
								)}
							</div>

							<p className={`${styles.description} ${!description ? styles.noDescription : ""}`}>
								{description ?? "No description provided for this happening."}
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
										onClick={handleOptionsClick}>
										Options
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

			{/* Options Panel */}
			<div className={`${styles.confirmDelete} ${isOptionsOpen ? styles.activePanel : ""}`}>
				<p>Event Management</p>
				<p>Choose an action for this happening.</p>
				<div
					className={styles.confirmActions}
					style={{ flexDirection: "column", gap: "0.5rem" }}>
					<Button
						className={styles.confirmButton}
						onClick={() => {
							setIsOptionsOpen(false);
							setIsConfirmingDelete(true);
						}}
						variant="ghost">
						Delete Event
					</Button>
					<Button
						className={styles.confirmButton}
						onClick={() => {
							setIsOptionsOpen(false);
							setIsConfirmingCancel(true);
						}}
						variant="ghost">
						Cancel Event
					</Button>
					<Button
						className={styles.cancelButton}
						variant="solid"
						onClick={() => setIsOptionsOpen(false)}>
						Close
					</Button>
				</div>
			</div>

			{/* Delete Confirmation Panel */}
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

			{/* Cancel Confirmation Panel */}
			<div className={`${styles.confirmDelete} ${isConfirmingCancel ? styles.activePanel : ""}`}>
				<p>Cancel this Event?</p>
				<p>This will mark the event as cancelled and notify participating artists.</p>
				<div className={styles.confirmActions}>
					<Button
						className={styles.confirmButton}
						onClick={handleConfirmCancel}
						variant="ghost">
						Confirm Cancellation
					</Button>
					<Button
						className={styles.cancelButton}
						variant="solid"
						onClick={() => setIsConfirmingCancel(false)}>
						Back
					</Button>
				</div>
			</div>

			{/* Cover Note Panel */}
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

export default EventCard;
