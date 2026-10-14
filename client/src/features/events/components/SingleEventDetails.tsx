import { useOutletContext } from "react-router-dom";
import styles from "./SingleEventDetails.module.css";

export function SingleEventDetails() {
	const { event, isLoadingEvent }: { event: any; isLoadingEvent: boolean } = useOutletContext();

	if (isLoadingEvent) {
		return <div className={styles.loading}>Loading event details...</div>;
	}

	if (!event) return <div className={styles.error}>Event not found.</div>;

	return (
		<div className={styles.eventContent}>
			<div className={styles.metaSection}>
				<span className={styles.badge}>{event.status || "Upcoming"}</span>
				{event.venue_name && <span className={styles.venue}>📍 {event.venue_name}</span>}
			</div>

			<p className={styles.description}>{event.descriptions || "No description provided for this happening."}</p>
		</div>
	);
}
