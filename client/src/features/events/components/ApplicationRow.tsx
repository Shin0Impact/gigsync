import type { ApplicationStatus } from "@shared/types/index";
import styles from "./Applications.module.css";
import { useGetProfileByIdQuery } from "../../profiles";
import { useUpdateApplicationStatusMutation } from "../eventsApi";

interface ApplicationItemData {
	id: string;
	event_id: number;
	artist_id: string;
	status: ApplicationStatus;
	cover_note: string | null;
	applied_at: Date;
	updated_at: Date;
}

interface ApplicationRowProps {
	application: ApplicationItemData;
	eventId: number | string;
}

export function ApplicationRow({ application, eventId }: ApplicationRowProps) {
	const { data: profileData, isLoading: isLoadingProfile } = useGetProfileByIdQuery(application.artist_id);
	const [updateStatus, { isLoading: isUpdating }] = useUpdateApplicationStatusMutation();

	const profile = profileData?.profile;
	const displayName = profile?.name || profile?.userName || "Unknown Artist";

	const handleStatusChange = async (status: ApplicationStatus) => {
		try {
			await updateStatus({ eventId, appId: application.id, status }).unwrap();
		} catch (err) {
			console.error("Failed to update status", err);
		}
	};

	return (
		<li className={styles.applicationItem}>
			<div className={styles.applicationInfo}>
				<div className={styles.artistHeader}>
					{profile?.avatarUrl && (
						<img
							src={profile.avatarUrl}
							alt={displayName}
							className={styles.avatar}
						/>
					)}
					<div>
						<span className={styles.applicationTitle}>{isLoadingProfile ? "Loading artist..." : displayName}</span>
						{profile?.userName && <span className={styles.artistUsername}>@{profile.userName}</span>}
					</div>
				</div>

				{application.cover_note && <p className={styles.coverNote}>"{application.cover_note}"</p>}

				<time className={styles.applicationDate}>
					Applied on{" "}
					{new Date(application.applied_at).toLocaleDateString("en-US", {
						month: "short",
						day: "numeric",
						year: "numeric",
					})}
				</time>
			</div>

			<div className={styles.actionGroup}>
				<span
					className={styles.statusBadge}
					data-status={application.status}>
					{application.status}
				</span>

				{application.status === "pending" && (
					<div className={styles.buttons}>
						<button
							type="button"
							disabled={isUpdating}
							className={styles.acceptButton}
							onClick={() => handleStatusChange("accepted")}>
							Accept
						</button>
						<button
							type="button"
							disabled={isUpdating}
							className={styles.rejectButton}
							onClick={() => handleStatusChange("rejected")}>
							Reject
						</button>
					</div>
				)}
			</div>
		</li>
	);
}
