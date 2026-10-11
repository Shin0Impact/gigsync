import { Feed } from "./Feed";

// The "Following" timeline - works from artists you follow (see
// scope="following" on listWorksFeed). Sibling of ExplorePiecesPage,
// same Feed component, different scope.
export function FollowingPage() {
	return (
		<Feed
			scope="following"
			title="Following"
			subtitle="New work from artists you follow"
			emptyTitle="Your feed is quiet"
			emptyText="Follow some artists from their profile to see their work here."
		/>
	);
}

export default FollowingPage;
