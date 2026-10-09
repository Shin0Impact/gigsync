import { useParams, useNavigate } from "react-router-dom";
import { ROUTES } from "../../routes/routePaths";
import styles from "./PieceDetails.module.css";
import { useListIntermezzosQuery } from "../../features/pieces";
import { IntermezzoCard } from "../../features/pieces/components/IntermezzoCard";

export function PieceDetails() {
	const { id: pieceId } = useParams<{ id: string }>();
	const navigate = useNavigate();

	const numericPieceId = pieceId ? Number(pieceId) : undefined;

	const {
		data: intermezzosData,
		isLoading,
		error,
	} = useListIntermezzosQuery(numericPieceId!, {
		skip: !numericPieceId,
	});

	const intermezzos = intermezzosData?.updates ?? [];

	const handleAddIntermezzo = () => {
		if (pieceId) {
			navigate(`${ROUTES.CREATE_INTERMEZZO}?pieceId=${pieceId}`);
		}
	};

	if (!numericPieceId) {
		return <div className={styles.error}>Invalid Piece ID.</div>;
	}

	return (
		<main className={styles.container}>
			<header className={styles.header}>
				<div className={styles.topBar}>
					<button
						type="button"
						className={styles.backButton}
						onClick={() => navigate(-1)}>
						← Back
					</button>

					<button
						type="button"
						className={styles.addIntermezzoBtn}
						onClick={handleAddIntermezzo}>
						+ Post Intermezzo
					</button>
				</div>

				<div className={styles.pieceMeta}>
					<h1 className={styles.title}>Piece #{pieceId}</h1>
				</div>
			</header>

			<section className={styles.timelineSection}>
				<h2 className={styles.sectionTitle}>Intermezzi ({intermezzos.length})</h2>

				{isLoading && <div className={styles.loading}>Loading Intermezzi...</div>}

				{error && <div className={styles.error}>Failed to load Intermezzos for this piece.</div>}

				{!isLoading && !error && intermezzos.length === 0 && (
					<div className={styles.emptyState}>
						<p className={styles.emptyText}>No Intermezzi posted yet for this piece.</p>
						<button
							type="button"
							className={styles.addIntermezzoBtn}
							onClick={handleAddIntermezzo}>
							Post First Intermezzo
						</button>
					</div>
				)}

				{!isLoading && intermezzos.length > 0 && (
					<div className={styles.timelineFeed}>
						{intermezzos.map((intermezzo) => (
							<IntermezzoCard
								key={intermezzo.id}
								intermezzo={intermezzo}
							/>
						))}
					</div>
				)}
			</section>
		</main>
	);
}
