import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import type { MouseEvent } from "react";
import type { IWork as Piece } from "@shared/types/social";
import { useListIntermezzosQuery, useListVignettesQuery, useDeletePieceMutation } from "../piecesApi";
import { ROUTES } from "../../../routes/routePaths";
import styles from "./PieceCard.module.css";
import { VignetteMedia } from "./VignetteMedia";
import { Button } from "@components";
import { Metaballs, SimplexNoise } from "@paper-design/shaders-react";
import Placeholder from "@components/ui/Placeholder/Placeholder";

interface PieceCardProps {
	piece: Piece;
	readOnly?: boolean;
}

export function PieceCard({ piece, readOnly = false }: PieceCardProps) {
	const [searchParams, setSearchParams] = useSearchParams();
	const isDrawerOpen = searchParams.get("drawer") === "open";

	const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
	const [deletePiece, { isLoading: isDeleting, error: deleteError }] = useDeletePieceMutation();

	const { data: intermezzosData, isLoading: isLoadingIntermezzo } = useListIntermezzosQuery(piece.id);
	const intermezzosCount = 1 + (intermezzosData?.updates?.length ?? 0);

	const latestIntermezzo = intermezzosData?.updates?.[0];
	const { data: vignettesData } = useListVignettesQuery(latestIntermezzo?.id ?? 0, {
		skip: !latestIntermezzo,
	});
	const coverVignette = vignettesData?.media?.[0];

	// const formattedDate = piece.createdAt
	// 	? new Date(piece.createdAt).toLocaleDateString("en-US", {
	// 			month: "short",
	// 			day: "numeric",
	// 			year: "numeric",
	// 		})
	// 	: null;

	const handleAddIntermezzo = (e: MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setSearchParams((prev) => {
			const newParams = new URLSearchParams(prev);
			if (isDrawerOpen) {
				newParams.delete("drawer");
			} else {
				newParams.set("drawer", "open");
			}
			return newParams;
		});
	};

	const handleDeleteClick = (e: MouseEvent) => {
		e.preventDefault();
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
			<Link
				className={styles.card}
				role="button"
				to={ROUTES.SINGLE_PIECE(piece.id)}
				style={{ textDecoration: "none" }}
				aria-label={`Open Piece #${piece.id}`}>
				<div className={styles.cardVignette}>
					{coverVignette ? (
						<VignetteMedia vignette={coverVignette} />
					) : (
						<div className={styles.shader}>
							<Metaballs
								width={"auto"}
								height={"100%"}
								colors={["#f3d66d"]}
								colorBack="#00000000"
								count={20}
								size={0.72}
								speed={1}
								scale={2}
							/>
						</div>
					)}
				</div>

				<div className={styles.cardBody}>
					<div className={styles.version}>{intermezzosCount}</div>

					<div className={styles.details}>
						<div className={styles.text}>
							<header className={styles.header}>
								<span className={styles.title}>{piece.title}</span>
							</header>
							{/* {formattedDate && <time className={styles.date}>{formattedDate}</time>} */}

							<p className={`${styles.description} ${!piece.description ? styles.noDescription : ""}`}>
								{piece.description || "Untitled Piece without description."}
							</p>
						</div>

						{readOnly ? (
							<div>Like share etc</div>
						) : (
							<div className={styles.actions}>
								<Button
									variant="solid"
									className={`${styles.actionButton} ${styles.addIntermezzoBtn}`}
									onClick={handleAddIntermezzo}>
									Add Intermezzo
								</Button>
								<Button
									type="button"
									className={`${styles.actionButton} ${styles.deleteBtn}`}
									onClick={handleDeleteClick}>
									Del
								</Button>
							</div>
						)}
					</div>
				</div>
			</Link>

			<div className={styles.confirmDelete}>
				<p>Delete this Piece?</p>
				<p>
					This will remove this Piece and all of its Intermezzi, Vignettes, Nods, and Echoes. This action cannot be
					undone.
				</p>
				{deleteError && <p className={styles.errorText}>Failed to delete piece. Please try again.</p>}
				<div className={styles.confirmActions}>
					<Button
						className={styles.confirmButton}
						onClick={handleConfirmDelete}
						disabled={isDeleting}
						variant="ghost">
						{isDeleting ? "Deleting..." : "Delete Piece"}
					</Button>
					<Button
						className={styles.cancelButton}
						variant="solid"
						onClick={() => setIsConfirmingDelete(false)}>
						Cancel
					</Button>
				</div>
			</div>
		</div>
	);
}
