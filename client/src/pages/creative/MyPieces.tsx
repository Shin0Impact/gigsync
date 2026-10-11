import styles from "./MyPieces.module.css";
import { PieceCard } from "../../features/pieces/components/PieceCard";
import { useComposer } from "../../features/pieces";
import { useMeQuery } from "../../features/auth";
import { useListPiecesQuery } from "../../features/pieces";

export function MyPieces() {
	const { openComposer } = useComposer();

	const { data: meData, isLoading: isLoadingMe } = useMeQuery();
	const userId = meData?.user?.userId;

	const {
		data: piecesData,
		isLoading: isLoadingPieces,
		error: piecesError,
	} = useListPiecesQuery(userId!, {
		skip: !userId,
	});

	const isLoading = isLoadingMe || isLoadingPieces;
	const pieces = piecesData?.works ?? [];

	return (
		<main className={styles.container}>
			<header className={styles.header}>
				<div className={styles.titleGroup}>
					<h1 className={styles.title}>My Pieces</h1>
					<p className={styles.subtitle}>Your active body of work and progress logs</p>
				</div>
			</header>

			{isLoading && <div className={styles.loading}>Loading your portfolio...</div>}

			{piecesError && <div className={styles.error}>Unable to load pieces at this time. Please try refreshing.</div>}

			{!isLoading && !piecesError && pieces.length === 0 && (
				<div className={styles.emptyState}>
					<h2 className={styles.emptyTitle}>No pieces yet</h2>
					<p className={styles.emptyText}>Start sharing your creative journey by publishing your first piece.</p>
					<button
						type="button"
						className={styles.createButton}
						onClick={openComposer}>
						Create Your First Piece
					</button>
				</div>
			)}

			{!isLoading && pieces.length > 0 && (
				<section className={styles.feed}>
					{pieces.map((piece) => (
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
