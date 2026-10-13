import { Feed } from "./Feed";

// The "Discover" page - every public piece, newest first (see
// scope="explore" on listWorksFeed). FollowingPage.tsx is the sibling
// view scoped to who you follow.
export function ExplorePiecesPage() {
	return (
		<Feed
			scope="explore"
			title="Discover"
			subtitle="Fresh work from every artist on GigSync"
			emptyTitle="Nothing to discover yet"
			emptyText="Once artists start sharing pieces, they will show up here."
		/>
	);
}

export default ExplorePiecesPage;
