import { useListMyApplicationsQuery } from "../eventsApi";
import styles from "./Applications.module.css";

export function UserApplications() {
	const { data: myAppsData, isLoading } = useListMyApplicationsQuery();
	const applications = myAppsData?.applications ?? [];

	if (isLoading) {
		return <div className={styles.loading}>Loading applications...</div>;
	}

	if (applications.length === 0) {
		return (
			<div className={styles.emptyState}>
				<p className={styles.emptyText}>You haven't applied to any Happenings yet.</p>
			</div>
		);
	}

	return (
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
	);
}
