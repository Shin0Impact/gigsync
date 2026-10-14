import { useState } from "react";
import type { ApplicationStatus } from "@shared/types/index";
import styles from "./ApplicationCard.module.css";
import { useGetProfileByIdQuery } from "../../profiles";
import { useUpdateApplicationStatusMutation } from "../eventsApi";
import { Button } from "@components";

interface ApplicationItemData {
	id: string;
	event_id: number;
	artist_id: string;
	status: ApplicationStatus;
	cover_note: string | null;
	applied_at: Date;
	updated_at: Date;
}

interface ApplicationCardProps {
	application: ApplicationItemData;
	eventId: number | string;
}

export function ApplicationCard({ application, eventId }: ApplicationCardProps) {
	const { data: profileData, isLoading: isLoadingProfile } = useGetProfileByIdQuery(application.artist_id);
	const [updateStatus, { isLoading: isUpdating }] = useUpdateApplicationStatusMutation();
	const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

	const profile = profileData?.profile;
	const displayName = profile?.name || profile?.userName || "Unknown Artist";

	const handleStatusChange = async (status: ApplicationStatus) => {
		try {
			await updateStatus({ eventId, appId: application.id, status }).unwrap();
			setIsUpdatingStatus(false);
		} catch (err) {
			console.error("Failed to update status", err);
		}
	};

	return (
		<div
			className={styles.cardWrapper}
			data-confirm={isUpdatingStatus}>
			<div className={styles.card}>
				<div className={styles.cardVignette}>
					{profile?.avatarUrl ? (
						<img
							src={profile.avatarUrl}
							alt={displayName}
						/>
					) : (
						<span>Artist</span>
					)}
				</div>

				<div className={styles.cardBody}>
					<div className={styles.metaTop}>
						<span
							className={styles.statusBadge}
							data-status={application.status}>
							{application.status}
						</span>
						<time className={styles.applicationDate}>
							{new Date(application.applied_at).toLocaleDateString("en-US", {
								month: "short",
								day: "numeric",
								year: "numeric",
							})}
						</time>
					</div>

					<div className={styles.details}>
						<div className={styles.text}>
							<header className={styles.header}>
								<span className={styles.title}>{isLoadingProfile ? "Loading artist..." : displayName}</span>
							</header>
							{profile?.userName && <span className={styles.venue}>@{profile.userName}</span>}

							<p className={`${styles.description} ${!application.cover_note ? styles.noDescription : ""}`}>
								{application.cover_note ? `"${application.cover_note}"` : "No cover note provided."}
							</p>
						</div>

						<div className={styles.actions}>
							<Button
								variant="solid"
								className={`${styles.actionButton} ${styles.primaryBtn}`}
								onClick={() => setIsUpdatingStatus(true)}>
								Update Status
							</Button>
						</div>
					</div>
				</div>
			</div>

			{/* Slide-out Status Update Panel */}
			<div className={styles.confirmDelete}>
				<p>Update Application</p>
				<p>Review this artist's application and change their participation status.</p>
				<div className={styles.confirmActions}>
					<Button
						className={styles.confirmButton}
						onClick={() => handleStatusChange("accepted")}
						disabled={isUpdating}
						variant="ghost">
						Accept Application
					</Button>
					<Button
						className={styles.confirmButton}
						onClick={() => handleStatusChange("rejected")}
						disabled={isUpdating}
						variant="ghost">
						Reject Application
					</Button>
					<Button
						className={styles.cancelButton}
						variant="solid"
						onClick={() => setIsUpdatingStatus(false)}>
						Cancel
					</Button>
				</div>
			</div>
		</div>
	);
}
