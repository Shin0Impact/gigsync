import { ButtonLink, Page } from "@components";
import { useMeQuery } from "../features/auth";
import { UserPieces } from "../features/pieces";
import { ROUTES } from "../routes/routePaths";

export function MyPiecesPage() {
	const { data: meData, isLoading } = useMeQuery();
	const userId = meData?.user?.userId;

	return (
		<Page type="main">
			<Page.Header
				title="My Pieces"
				actions={<ButtonLink to={ROUTES.CREATE_PIECE}>Start a new Piece</ButtonLink>}
				mode="button"
			/>
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
