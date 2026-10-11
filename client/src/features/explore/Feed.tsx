import { useListWorksFeedQuery } from "../pieces/piecesApi";
import { FeedPostCard } from "./components/FeedPostCard";
import styles from "./Feed.module.css";

interface FeedProps {
	scope: "explore" | "following";
	title: string;
	subtitle: string;
	emptyTitle: string;
	emptyText: string;
}

// Shared by ExplorePiecesPage (scope="explore") and FollowingPage
// (scope="following") - both just point the same feed query/rendering at
// a different slice of works (see listWorksFeed in db/social.queries.ts
// on the server for how the scope is resolved).
export function Feed({ scope, title, subtitle, emptyTitle, emptyText }: FeedProps) {
	const { data, isLoading, error } = useListWorksFeedQuery({ scope });
	const works = data?.works ?? [];

	return (
		<main className={styles.container}>
			<header className={styles.header}>
				<div className={styles.titleGroup}>
					<h1 className={styles.title}>{title}</h1>
					<p className={styles.subtitle}>{subtitle}</p>
				</div>
			</header>

			{isLoading && <div className={styles.loading}>Loading…</div>}

			{error && <div className={styles.error}>Unable to load this feed right now. Please try refreshing.</div>}

			{!isLoading && !error && works.length === 0 && (
				<div className={styles.emptyState}>
					<h2 className={styles.emptyTitle}>{emptyTitle}</h2>
					<p className={styles.emptyText}>{emptyText}</p>
				</div>
			)}

			{!isLoading && works.length > 0 && (
				<section className={styles.feed}>
					{works.map((work) => (
						<FeedPostCard
							key={work.id}
							work={work}
						/>
					))}
				</section>
			)}
		</main>
	);
}
