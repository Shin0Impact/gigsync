import { Page } from "@components";
import { useMeQuery } from "../features/auth";
import { UserFeed } from "../features/explore/components/UserFeed";

export function DiscoveryPage() {
	const { data: meData, isLoading } = useMeQuery();
	const userId = meData?.user?.userId;

	return (
		<Page type="main">
			<Page.Header
				title="Discovery"
				mode="profile"
			/>
			<Page.Body>
				{isLoading || !userId ? (
					<p>Loading…</p>
				) : (
					<UserFeed
						scope="explore"
						emptyTitle=""
						emptyText=""
					/>
				)}
			</Page.Body>
		</Page>
	);
}
