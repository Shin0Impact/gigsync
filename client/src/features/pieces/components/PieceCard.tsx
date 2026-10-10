import { Link, useNavigate } from "react-router-dom";
import type { IWork as Piece } from "@shared/types/social";
import { useListIntermezzosQuery, useListVignettesQuery } from "../piecesApi";
import { ROUTES } from "../../../routes/routePaths";
import { getMediaUrl } from "../../../shared/mediaUrl";
import styles from "./PieceCard.module.css";

interface PieceCardProps {
	piece: Piece;
}

export function PieceCard({ piece }: PieceCardProps) {
	const navigate = useNavigate();

	const { data: intermezzosData } = useListIntermezzosQuery(piece.id);
	const intermezzosCount = 1 + (intermezzosData?.updates?.length ?? 0);

	// Updates come back newest-first (see getWorkUpdates), so the first one
	// is the latest progress post - its first attached file, if any,
	// becomes this card's cover preview.
	const latestIntermezzo = intermezzosData?.updates?.[0];
	const { data: vignettesData } = useListVignettesQuery(latestIntermezzo?.id ?? 0, {
		skip: !latestIntermezzo,
	});
	const coverVignette = vignettesData?.media?.[0];

	const formattedDate = piece.createdAt
		? new Date(piece.createdAt).toLocaleDateString("en-US", {
				month: "short",
				day: "numeric",
				year: "numeric",
			})
		: null;

	const handleAddIntermezzo = () => {
		navigate(`${ROUTES.CREATE_INTERMEZZO}?pieceId=${piece.id}`);
	};

	return (
		<Link
			to={ROUTES.SINGLE_PIECE(`${piece.id}`)}
			className={styles.card}>
			{coverVignette && (
				<div className={styles.cover}>
					{coverVignette.mediaType === "video" ? (
						<video
							src={getMediaUrl(coverVignette.r2Key)}
							className={styles.coverMedia}
							muted
							loop
							playsInline
							preload="metadata"
						/>
					) : coverVignette.mediaType === "audio" ? (
						<div className={styles.coverAudio}>♪</div>
					) : coverVignette.mediaType === "image" ? (
						<img
							src={getMediaUrl(coverVignette.r2Key)}
							alt=""
							className={styles.coverMedia}
							loading="lazy"
						/>
					) : (
						<div className={styles.coverFallback}>Attached file</div>
					)}
				</div>
			)}

			<header className={styles.header}>
				<span className={styles.pieceId}>Piece #{piece.id}</span>
				{formattedDate && <time className={styles.date}>{formattedDate}</time>}
			</header>

			<p className={`${styles.description} ${!piece.description ? styles.noDescription : ""}`}>
				{piece.description || "Untitled Piece without description."}
			</p>

			<div className={styles.updatesSummary}>
				{intermezzosCount === 1 ? "1 Intermezzo posted" : `${intermezzosCount} Intermezzi posted`}
			</div>

			<div className={styles.actions}>
				<button
					type="button"
					className={`${styles.actionButton} ${styles.addIntermezzoBtn}`}
					onClick={handleAddIntermezzo}>
					+ Intermezzo
				</button>
			</div>
		</Link>
	);
}
