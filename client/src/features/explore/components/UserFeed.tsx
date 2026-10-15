import styles from "./UserFeed.module.css";
import { ROUTES } from "../../../routes/routePaths";
import { EmptyState } from "@components/ui/EmptyState/EmptyState";
import { WorkFeedItem } from "@shared/types/social";
import { useListWorksFeedQuery } from "../../pieces";
import { FeedPostCard } from "./FeedPostCard";

interface UserFeedProps {
	scope: "explore" | "following";
	emptyTitle: string;
	emptyText: string;
	actionLabel?: string;
}

export function UserFeed({ scope, emptyTitle, emptyText, actionLabel = "" }: UserFeedProps) {
	const { data, isLoading, error } = useListWorksFeedQuery({ scope });
	const works = data?.works ?? [];

	return (
		<main className={styles.container}>
			{isLoading && <div className={styles.loading}>Loading…</div>}

			{error && <div className={styles.error}>Unable to load this feed right now. Please try refreshing.</div>}

			{!isLoading && !error && works.length === 0 && (
				<div className={styles.emptyState}>
					<EmptyState
						title={emptyTitle}
						subtitle={emptyText}
						actionLabel={actionLabel}
						// Timeline (following) -> go find people to follow; Discovery is already
						// that page, so point its empty state at events instead of back at itself
						to={scope === "following" ? ROUTES.DISCOVERY : ROUTES.DISCOVERY_EVENTS}
					/>
				</div>
			)}

			{!isLoading && works.length > 0 && (
				<section className={styles.userFeed}>
					{works.map((work: WorkFeedItem) => (
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
