import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { MouseEvent } from "react";
import type { IWork as Piece } from "@shared/types/social";
import { useListIntermezzosQuery, useListVignettesQuery, useDeletePieceMutation } from "../piecesApi";
import { ROUTES } from "../../../routes/routePaths";
import styles from "./PieceCard.module.css";
import { VignetteMedia } from "./VignetteMedia";
import { Button } from "@components";

interface PieceCardProps {
	piece: Piece;
	readOnly?: boolean;
}

export function PieceCard({ piece, readOnly = false }: PieceCardProps) {
	const navigate = useNavigate();
	const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
	const [deletePiece, { isLoading: isDeleting, error: deleteError }] = useDeletePieceMutation();

	const { data: intermezzosData } = useListIntermezzosQuery(piece.id);
	const intermezzosCount = 1 + (intermezzosData?.updates?.length ?? 0);

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
		e.stopPropagation();
		navigate(`${ROUTES.CREATE_INTERMEZZO}?pieceId=${piece.id}`);
	};

	const handleDeleteClick = (e: MouseEvent) => {
		e.stopPropagation();
		setIsConfirmingDelete(true);
	};

	const handleConfirmDelete = async () => {
		try {
			await deletePiece({ pieceId: piece.id, ownerId: piece.userId }).unwrap();
			setIsConfirmingDelete(false);
		} catch (err) {
			console.error("Failed to delete Piece:", err);
		}
	};

	return (
		<div
			className={styles.cardWrapper}
			data-confirm={isConfirmingDelete}>
			<div
				className={styles.card}
				role="button"
				tabIndex={0}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
					}
				}}
				aria-label={`Open Piece #${piece.id}`}>
				{coverVignette && <VignetteMedia vignette={coverVignette} />}

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

			<div className={styles.confirmDelete}>
				<p>Delete this Piece?</p>
				<p>
					This will remove this Piece and all of its Intermezzi, Vignettes, Nods, and Echoes. This action cannot be
					undone.
				</p>
				{deleteError && <p className={styles.errorText}>Failed to delete piece. Please try again.</p>}
				<div className={styles.confirmActions}>
					<Button
						onClick={handleConfirmDelete}
						disabled={isDeleting}
						variant="ghost">
						{isDeleting ? "Deleting..." : "Delete Piece"}
					</Button>
					<Button
						variant="solid"
						onClick={() => setIsConfirmingDelete(false)}>
						Cancel
					</Button>
				</div>
			</div>
		</div>
	);
}
