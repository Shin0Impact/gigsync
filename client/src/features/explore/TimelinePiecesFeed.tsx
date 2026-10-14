import { UserFeed } from "./components/UserFeed";

export function TimelinePiecesFeed() {
	return (
		<UserFeed
			scope="following"
			emptyTitle="Looks quiet..."
			emptyText="Follow your favorite artists to see their Intermezzi."
			actionLabel="Discover new artists"
		/>
	);
}
