import { useState, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import type { MouseEvent } from "react";
import type { IWork as Piece } from "@shared/types/social";
import { useListIntermezzosQuery, useListVignettesQuery, useDeletePieceMutation } from "../piecesApi";
import { ROUTES } from "../../../routes/routePaths";
import styles from "./PieceCard.module.css";
import { VignetteMedia } from "./VignetteMedia";
import { Button } from "@components";
import { Metaballs } from "@paper-design/shaders-react";
import { AlarmClockIcon, type AlarmClockIconHandle } from "@animateicons/react/lucide";
import { LazyShader } from "@components/shader/LazyShader";

interface PieceCardProps {
	piece: Piece & { likedByMe?: boolean; likeCount?: number; commentCount?: number };
	readOnly?: boolean;
}

export function PieceCard({ piece, readOnly = false }: PieceCardProps) {
	const [searchParams, setSearchParams] = useSearchParams();
	const isDrawerOpen = searchParams.get("drawer") === "open";
	const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

	const [deletePiece, { isLoading: isDeleting, error: deleteError }] = useDeletePieceMutation();

	const alarmClockIconRef = useRef<AlarmClockIconHandle>(null);

	const { data: intermezzosData } = useListIntermezzosQuery(piece.id);
	const intermezzosCount = intermezzosData?.updates?.length ?? 0;

	const latestIntermezzo = intermezzosData?.updates?.[0];
	const { data: vignettesData } = useListVignettesQuery(latestIntermezzo?.id ?? 0, {
		skip: !latestIntermezzo,
	});
	const coverVignette = vignettesData?.media?.[0];

	const formattedDate = piece.updatedAt
		? new Date(piece.updatedAt).toLocaleDateString("en-US", {
				month: "short",
				day: "numeric",
				year: "numeric",
			})
		: null;

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

	const pieceIdNum = Number(piece.id) || 1;
	const randomCount = 10 + (pieceIdNum % 11); // Range: 10 to 20 (max 20)
	const randomSize = 0.6 + (pieceIdNum % 5) * 0.1; // Range: 0.6 to 1.0 (max 1.0)
	const randomSpeed = 0.8 + (pieceIdNum % 7) * 0.2; // Range: 0.8 to 2.0 (max 2.0)

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
							<LazyShader
								count={randomCount}
								size={randomSize}
								speed={randomSpeed}
								color="#f3d66d"
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

							{formattedDate && (
								<div
									className={styles.dateRow}
									onMouseEnter={() => alarmClockIconRef.current?.startAnimation()}
									onMouseLeave={() => alarmClockIconRef.current?.stopAnimation()}>
									<AlarmClockIcon
										ref={alarmClockIconRef}
										size={14}
										style={{ display: "inline-block", verticalAlign: "middle", marginRight: "0.2rem" }}
									/>
									<span>{formattedDate}</span>
								</div>
							)}

							<p className={`${styles.description} ${!piece.description ? styles.noDescription : ""}`}>
								{piece.description || "Untitled Piece without description."}
							</p>
						</div>

						{!readOnly && (
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

			{!readOnly && (
				<div className={`${styles.confirmDelete} ${isConfirmingDelete ? styles.activePanel : ""}`}>
					<p>Delete this Piece?</p>
					<p>
						This will remove this Piece and all of its Intermezzi, Vignettes, Nods, and Echoes. This action cannot
						be undone.
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
			)}
		</div>
	);
}

export default PieceCard;
