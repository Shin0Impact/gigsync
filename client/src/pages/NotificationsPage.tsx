import { Link } from "react-router-dom";
import { useGetMyActivityQuery } from "../features/profiles";
import { ROUTES } from "../routes/routePaths";
import ProfilePicture from "../components/user/ProfilePicture";
import type { ActivityItem } from "@shared/types/index";
import styles from "./NotificationsPage.module.css";
import { EmptyState } from "@components/ui/EmptyState/EmptyState";
import { HandshakeIcon } from "@animateicons/react/huge";
import { useMeQuery } from "../features/auth";

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

export function NotificationsPage() {
	const { data, isLoading, error } = useGetMyActivityQuery();
	const { data: dataMe } = useMeQuery();
	const activity = data?.activity ?? [];
	const role = dataMe?.user?.role;
	const subtitle =
		role === "fan"
			? "Nods, Echoes, and new followers will show up here."
			: "Nods, Echoes, new followers and application updates will show up here.";

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
				<EmptyState
					title="All quiet for now."
					subtitle={subtitle}
					actionLabel="Discover Events and Pieces"
					to={ROUTES.DISCOVERY}
				/>
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
								onKeyDown={(e) => {
									if (isClickable && (e.key === "Enter" || e.key === " ")) {
										e.preventDefault();
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
										{item.type === "application_accepted" ? (
											<HandshakeIcon
												size={18}
												color="currentColor"
											/>
										) : (
											"📋"
										)}
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
