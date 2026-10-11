import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { MouseEvent } from "react";
import type { IWork as Piece } from "@shared/types/social";
import { useListIntermezzosQuery, useListVignettesQuery, useDeletePieceMutation } from "../piecesApi";
import { ROUTES } from "../../../routes/routePaths";
import { getMediaUrl } from "../../../shared/mediaUrl";
import { usePostQuickView } from "../PostQuickViewProvider";
import { ConfirmDialog } from "../../../components/ui";
import styles from "./PieceCard.module.css";

interface PieceCardProps {
	piece: Piece;
	// Hides the "+ Intermezzo" action - set this when rendering someone
	// else's piece (see ProfilePage.tsx), since only the owner can add to it.
	readOnly?: boolean;
}

export function PieceCard({ piece, readOnly = false }: PieceCardProps) {
	const navigate = useNavigate();
	const { openPost } = usePostQuickView();
	const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
	const [deletePiece, { isLoading: isDeleting, error: deleteError }] = useDeletePieceMutation();

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

	const handleAddIntermezzo = (e: MouseEvent) => {
		// This button lives inside the card's click target (see the onClick on
		// .card below, which opens the quick-view popup) - without this it used
		// to bubble up and open the popup AND navigate at the same time.
		e.stopPropagation();
		navigate(`${ROUTES.CREATE_INTERMEZZO}?pieceId=${piece.id}`);
	};

	const handleDeleteClick = (e: MouseEvent) => {
		// Same reason as handleAddIntermezzo above - stop this from also
		// opening the quick-view popup underneath the confirm dialog.
		e.stopPropagation();
		setIsConfirmingDelete(true);
	};

	const handleConfirmDelete = async () => {
		try {
			await deletePiece({ pieceId: piece.id, ownerId: piece.userId }).unwrap();
			setIsConfirmingDelete(false);
		} catch (err) {
			console.error("Failed to delete piece:", err);
		}
	};

	return (
		<>
		<div
			className={styles.card}
			role="button"
			tabIndex={0}
			onClick={() => openPost(piece.id)}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					openPost(piece.id);
				}
			}}
			aria-label={`Open piece #${piece.id}`}>
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

			{!readOnly && (
				<div className={styles.actions}>
					<button
						type="button"
						className={`${styles.actionButton} ${styles.addIntermezzoBtn}`}
						onClick={handleAddIntermezzo}>
						+ Intermezzo
					</button>
					<button
						type="button"
						className={`${styles.actionButton} ${styles.deleteBtn}`}
						onClick={handleDeleteClick}>
						Delete
					</button>
				</div>
			)}
		</div>
		<ConfirmDialog
			isOpen={isConfirmingDelete}
			title="Delete this piece?"
			message="This removes the piece and all of its Intermezzi, media, likes, and comments. This can't be undone."
			confirmLabel="Delete piece"
			isConfirming={isDeleting}
			errorMessage={deleteError ? "Failed to delete piece. Please try again." : null}
			onConfirm={handleConfirmDelete}
			onCancel={() => setIsConfirmingDelete(false)}
		/>
		</>
	);
}
