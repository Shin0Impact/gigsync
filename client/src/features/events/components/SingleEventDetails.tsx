import { useNavigate, useOutletContext } from "react-router-dom";
import ProfilePicture from "@components/user/ProfilePicture";
import { getMediaUrl } from "../../../shared/mediaUrl";
import { ROUTES } from "../../../routes/routePaths";
import { useListEventMediaQuery } from "../eventsApi";
import styles from "./SingleEventDetails.module.css";

function format_when(startAt?: string, endAt?: string): string | null {
	if (!startAt) return null;
	const start = new Date(startAt);
	if (Number.isNaN(start.getTime())) return null;
	const day = start.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
	const time = (d: Date) => d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
	if (!endAt) return `${day} · ${time(start)}`;
	const end = new Date(endAt);
	if (Number.isNaN(end.getTime())) return `${day} · ${time(start)}`;
	const sameDay = start.toDateString() === end.toDateString();
	return sameDay
		? `${day} · ${time(start)} – ${time(end)}`
		: `${day} ${time(start)} → ${end.toLocaleDateString("en-US", { month: "short", day: "numeric" })} ${time(end)}`;
}

export function SingleEventDetails() {
	const { event, isLoadingEvent }: { event: any; isLoadingEvent: boolean } = useOutletContext();
	const navigate = useNavigate();
	const { data: mediaData } = useListEventMediaQuery(event?.id ?? 0, { skip: !event?.id });

	if (isLoadingEvent) {
		return <div className={styles.loading}>Loading event details...</div>;
	}

	if (!event) return <div className={styles.error}>Event not found.</div>;

	const media = mediaData?.media ?? [];
	const images = media.filter((m) => m.media_type === "image");
	const videos = media.filter((m) => m.media_type === "video");
	const hero = images[0];
	const gallery = images.slice(1);

	const when = format_when(event.start_at, event.end_at);
	const categories: string[] = event.categories_needed ?? [];
	const organizerUserName: string | null = event.organizer_user_name ?? null;
	const organizerName: string | null = event.organizer_name ?? null;

	return (
		<article className={styles.eventContent}>
			{hero ? (
				<img
					className={styles.hero}
					src={getMediaUrl(hero.object_key)}
					alt={hero.alt_text || event.title}
				/>
			) : (
				<div
					className={styles.heroFallback}
					aria-hidden="true"
				/>
			)}

			<div className={styles.titleRow}>
				<div className={styles.badges}>
					<span className={styles.badge}>{event.status || "Upcoming"}</span>
					{event.is_urgent && <span className={`${styles.badge} ${styles.urgent}`}>Urgent</span>}
					{event.is_recurring && <span className={styles.badge}>Recurring</span>}
				</div>
				<h2 className={styles.title}>{event.title}</h2>
			</div>

			{organizerUserName && (
				<button
					type="button"
					className={styles.organizer}
					onClick={() => navigate(ROUTES.PROFILE(organizerUserName))}>
					<ProfilePicture
						avatarUrl={event.organizer_avatar_url}
						userName={organizerUserName}
						variant="chat"
					/>
					<span className={styles.organizerText}>
						<span className={styles.organizerLabel}>Hosted by</span>
						<strong>{organizerName || organizerUserName}</strong>
						<span className={styles.organizerHandle}>@{organizerUserName}</span>
					</span>
				</button>
			)}

			<dl className={styles.facts}>
				{when && (
					<div className={styles.fact}>
						<dt>When</dt>
						<dd>{when}</dd>
					</div>
				)}
				{event.venue_name && (
					<div className={styles.fact}>
						<dt>Where</dt>
						<dd>{event.venue_name}</dd>
					</div>
				)}
				{categories.length > 0 && (
					<div className={styles.fact}>
						<dt>Looking for</dt>
						<dd className={styles.chips}>
							{categories.map((c) => (
								<span
									key={c}
									className={styles.chip}>
									{c}
								</span>
							))}
						</dd>
					</div>
				)}
			</dl>

			<section className={styles.about}>
				<h3 className={styles.sectionTitle}>About</h3>
				<p className={styles.description}>{event.descriptions || "No description provided for this happening."}</p>
			</section>

			{(gallery.length > 0 || videos.length > 0) && (
				<section className={styles.about}>
					<h3 className={styles.sectionTitle}>Gallery</h3>
					<div className={styles.gallery}>
						{gallery.map((m) => (
							<img
								key={m.id}
								src={getMediaUrl(m.object_key)}
								alt={m.alt_text || event.title}
								loading="lazy"
							/>
						))}
						{videos.map((m) => (
							<video
								key={m.id}
								src={getMediaUrl(m.object_key)}
								controls
								preload="metadata"
							/>
						))}
					</div>
				</section>
			)}
		</article>
	);
}
