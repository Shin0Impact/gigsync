import { Page } from "@components";
import { useMeQuery } from "../features/auth";
import { UserFeed } from "../features/explore/components/UserFeed";

export function TimelinePage() {
	const { data: meData, isLoading } = useMeQuery();
	const userId = meData?.user?.userId;

	return (
		<Page type="main">
			<Page.Header
				title="Timeline"
				mode="profile"
			/>
			<Page.Body>
				{isLoading || !userId ? (
					<p>Loading…</p>
				) : (
					<UserFeed
						scope="following"
						emptyTitle="Looks quiet..."
						emptyText="Follow your favorite artists to see their Intermezzi."
						actionLabel="Discover new artists"
					/>
				)}
			</Page.Body>
		</Page>
	);
}
