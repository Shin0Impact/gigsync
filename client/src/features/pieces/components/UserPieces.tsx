import { useListPiecesQuery } from "../piecesApi";
import styles from "./UserPieces.module.css";
import { ButtonLink } from "@components";
import { ROUTES } from "../../../routes/routePaths";
import { PieceCard } from "./PieceCard";
import { IWork } from "@shared/types/social";

interface UserPiecesProps {
	userId: string;
	mine?: boolean;
}

export function UserPieces({ userId, mine = false }: UserPiecesProps) {
	const {
		data: piecesData,
		isLoading,
		error,
	} = useListPiecesQuery(userId ?? "", {
		skip: !userId,
	});

	const pieces = piecesData?.works ?? [];

	return (
		<main className={styles.container}>
			{isLoading && <div className={styles.loading}>{mine ? "Loading your Pieces..." : "Loading Pieces..."}</div>}

			{error && <div className={styles.error}>We had a problem loading Pieces. Please try refreshing.</div>}

			{!isLoading && !error && pieces.length === 0 && (
				<div className={styles.emptyState}>
					<h2 className={styles.emptyTitle}>No Pieces yet.</h2>
					<p className={styles.emptyText}>
						{mine
							? "Share your creative journey by starting your first Piece."
							: "Check back soon to see their Pieces."}
					</p>
					{mine && <ButtonLink to={ROUTES.CREATE_PIECE}>Start your First Piece</ButtonLink>}
				</div>
			)}

			{!isLoading && pieces.length > 0 && (
				<section className={styles.userPieces}>
					{pieces.map((piece: IWork) => (
						<PieceCard
							key={piece.id}
							piece={piece}
						/>
					))}
				</section>
			)}
		</main>
	);
}
