import { Page } from "@components";
import { useMeQuery } from "../features/auth";
import { UserPieces } from "../features/pieces";

export function MyPiecesPage() {
	const { data: meData, isLoading } = useMeQuery();
	const userId = meData?.user?.userId;

	return (
		<Page type="main">
			<Page.Header title="My Pieces" />
			<Page.Body>
				{isLoading || !userId ? (
					<p>Loading…</p>
				) : (
					<UserPieces
						userId={userId}
						mine={true}
					/>
				)}
			</Page.Body>
		</Page>
	);
}
