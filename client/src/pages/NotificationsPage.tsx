import { Link } from "react-router-dom";
import { useGetMyActivityQuery } from "../features/profiles";
import { usePostQuickView } from "../features/pieces";
import { ROUTES } from "../routes/routePaths";
import ProfilePicture from "../components/user/ProfilePicture";
import type { ActivityItem } from "@shared/types/index";
import styles from "./NotificationsPage.module.css";

function formatRelativeTime(isoDate: string): string {
	const then = new Date(isoDate).getTime();
	const diffSeconds = Math.max(0, Math.floor((Date.now() - then) / 1000));
	if (diffSeconds < 60) return "just now";
	const diffMinutes = Math.floor(diffSeconds / 60);
	if (diffMinutes < 60) return `${diffMinutes}m ago`;
	const diffHours = Math.floor(diffMinutes / 60);
	if (diffHours < 24) return `${diffHours}h ago`;
	const diffDays = Math.floor(diffHours / 24);
	if (diffDays < 30) return `${diffDays}d ago`;
	return new Date(isoDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function describe(item: ActivityItem): string {
	switch (item.type) {
		case "like":
			return "liked your piece";
		case "comment":
			return item.commentContent ? `commented: “${item.commentContent}”` : "commented on your piece";
		case "follow":
			return "started following you";
		case "application_accepted":
			return `accepted your application to ${item.eventTitle ?? "their event"}`;
		case "application_rejected":
			return `did not accept your application to ${item.eventTitle ?? "their event"} this time`;
		default:
			return "";
	}
}

// Derived/synthesized on the server from likes, comments, followings and
// event_applications - there is no notifications table, so nothing here
// can be marked read/unread, it is just a feed of recent activity (see
// get_my_activity in profiles.service.ts).
export function NotificationsPage() {
	const { data, isLoading, error } = useGetMyActivityQuery();
	const { openPost } = usePostQuickView();
	const activity = data?.activity ?? [];

	return (
		<main className={styles.container}>
			<header className={styles.header}>
				<div className={styles.titleGroup}>
					<h1 className={styles.title}>Notifications</h1>
					<p className={styles.subtitle}>Likes, comments, new followers and application updates</p>
				</div>
			</header>

			{isLoading && <div className={styles.loading}>Loading…</div>}

			{error && <div className={styles.error}>Unable to load notifications right now. Please try refreshing.</div>}

			{!isLoading && !error && activity.length === 0 && (
				<div className={styles.emptyState}>
					<h2 className={styles.emptyTitle}>All quiet for now</h2>
					<p className={styles.emptyText}>
						Likes, comments, new followers and application updates will show up here.
					</p>
				</div>
			)}

			{!isLoading && activity.length > 0 && (
				<ul className={styles.list}>
					{activity.map((item) => {
						const isClickable = (item.type === "like" || item.type === "comment") && item.workId != null;
						return (
							<li
								key={item.id}
								className={styles.item}
								role={isClickable ? "button" : undefined}
								tabIndex={isClickable ? 0 : undefined}
								data-clickable={isClickable}
								onClick={isClickable ? () => openPost(item.workId!) : undefined}
								onKeyDown={(e) => {
									if (isClickable && (e.key === "Enter" || e.key === " ")) {
										e.preventDefault();
										openPost(item.workId!);
									}
								}}>
								{item.actor ? (
									<Link
										to={ROUTES.PROFILE(item.actor.userName)}
										className={styles.actorLink}
										onClick={(e) => e.stopPropagation()}>
										<ProfilePicture
											avatarUrl={item.actor.avatarUrl}
											userName={item.actor.userName}
											variant="nav"
										/>
									</Link>
								) : (
									<div className={styles.systemIcon}>
										{item.type === "application_accepted" ? "🎉" : "📋"}
									</div>
								)}

								<div className={styles.itemBody}>
									<p className={styles.itemText}>
										{item.actor && (
											<Link
												to={ROUTES.PROFILE(item.actor.userName)}
												className={styles.actorName}
												onClick={(e) => e.stopPropagation()}>
												{item.actor.userName}
											</Link>
										)}{" "}
										{describe(item)}
									</p>
									<time className={styles.itemTime}>{formatRelativeTime(item.createdAt)}</time>
								</div>
							</li>
						);
					})}
				</ul>
			)}
		</main>
	);
}

export default NotificationsPage;
