import { useListEventApplicationsQuery } from "../eventsApi";
import { ApplicationRow } from "./ApplicationRow";
import styles from "./Applications.module.css";

interface EventApplicationsProps {
	eventId: number | string;
}

export function EventApplications({ eventId }: EventApplicationsProps) {
	const { data: appsData, isLoading, error } = useListEventApplicationsQuery(eventId);

	const applications = appsData?.applications ?? [];

	if (isLoading) {
		return <div className={styles.loading}>Loading applications...</div>;
	}

	if (error) {
		return <div className={styles.error}>Unable to load event applications.</div>;
	}

	if (applications.length === 0) {
		return (
			<div className={styles.emptyState}>
				<p className={styles.emptyText}>No applications have been submitted to this event yet.</p>
			</div>
		);
	}

	return (
		<ul className={styles.applicationList}>
			{applications.map((application) => (
				<ApplicationRow
					key={application.id}
					application={application}
					eventId={eventId}
				/>
			))}
		</ul>
	);
}
