import { useMeQuery } from "../auth";
import { UserFeed } from "./components/UserFeed";

export function DiscoveryPiecesFeed() {
	const { data: meData, isLoading } = useMeQuery();
	const userId = meData?.user?.userId;

	if (isLoading || !userId) {
		return <p>Loading…</p>;
	}

	return (
		<UserFeed
			scope="explore"
			emptyTitle="No pieces in the feed yet."
			emptyText="Explore works shared by other creatives."
			actionLabel="Browse Events"
		/>
	);
}
