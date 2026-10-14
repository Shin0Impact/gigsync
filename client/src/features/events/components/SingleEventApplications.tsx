import { useOutletContext } from "react-router-dom";
import { useListEventApplicationsQuery } from "../eventsApi";
import styles from "./SingleEventDetails.module.css";
import { ApplicationCard } from "./ApplicationCard";

export function SingleEventApplications() {
	const { event }: { event: any } = useOutletContext();
	const eventId = event?.id;

	const {
		data: appsData,
		isLoading,
		error,
	} = useListEventApplicationsQuery(eventId, {
		skip: !eventId,
	});

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
			{applications.map((application: any) => (
				<ApplicationCard
					key={application.id}
					application={application}
					eventId={eventId}
				/>
			))}
		</ul>
	);
}
