import { useMeQuery } from "../auth";
import { UserEvents } from "../events/components/UserEvents";

export function TimelineEventsFeed() {
	const { data: meData, isLoading } = useMeQuery();
	const userRole = meData?.user?.role ?? "guest";

	if (isLoading) {
		return <p>Loading…</p>;
	}

	return <UserEvents userRole={userRole} />;
}
