import type { IWorkUpdate as Intermezzo } from "@shared/types/social";
import { useState } from "react";
import { useListVignettesQuery, useDeleteIntermezzoMutation } from "../piecesApi";
import { VignetteMedia } from "./VignetteMedia";
import styles from "./IntermezzoCard.module.css";

interface IntermezzoCardProps {
	intermezzo: Intermezzo;
	canDelete?: boolean;
}

export function IntermezzoCard({ intermezzo, canDelete = false }: IntermezzoCardProps) {
	const [isConfirming, setIsConfirming] = useState(false);
	const [deleteIntermezzo, { isLoading: isDeleting, isError: deleteFailed }] = useDeleteIntermezzoMutation();

	const handleDelete = async () => {
		try {
			await deleteIntermezzo({ pieceId: intermezzo.workId, intermezzoId: intermezzo.id }).unwrap();
		} catch (err) {
			console.error("Failed to delete Intermezzo:", err);
		}
	};

	const { data: vignettesData, isLoading: isLoadingVignettes } = useListVignettesQuery(intermezzo.id);
	const vignettes = vignettesData?.media ?? [];

	const formattedDate = intermezzo.createdAt
		? new Date(intermezzo.createdAt).toLocaleDateString("en-US", {
				month: "short",
				day: "numeric",
				year: "numeric",
				hour: "2-digit",
				minute: "2-digit",
			})
		: null;

	return (
		<article className={styles.card}>
			<div className={styles.timelineBadge}>{intermezzo.versionNumber}</div>

			<div className={styles.cardContent}>
				<header className={styles.header}>
					<h3 className={styles.title}>Intermezzo #{intermezzo.versionNumber}</h3>
					{formattedDate && <time className={styles.date}>{formattedDate}</time>}
				</header>

				{canDelete && (
					<div className={styles.deleteRow}>
						{isConfirming ? (
							<>
								<span className={styles.deletePrompt}>Delete this intermezzo and its media?</span>
								<button
									type="button"
									className={`${styles.deleteBtn} ${styles.deleteConfirm}`}
									disabled={isDeleting}
									onClick={handleDelete}>
									{isDeleting ? "Deleting…" : "Yes, delete"}
								</button>
								<button
									type="button"
									className={styles.deleteBtn}
									disabled={isDeleting}
									onClick={() => setIsConfirming(false)}>
									Cancel
								</button>
								{deleteFailed && <span className={styles.deletePrompt}>Couldn't delete - try again.</span>}
							</>
						) : (
							<button
								type="button"
								className={styles.deleteBtn}
								onClick={() => setIsConfirming(true)}>
								Delete
							</button>
						)}
					</div>
				)}

				{intermezzo.description && <p className={styles.description}>{intermezzo.description}</p>}

				{isLoadingVignettes && <div className={styles.vignettesLoading}>Loading media...</div>}

				{!isLoadingVignettes && vignettes.length > 0 && (
					<div className={styles.vignettesGrid}>
						{vignettes.map((vignette) => (
							<VignetteMedia
								key={vignette.id}
								vignette={vignette}
							/>
						))}
					</div>
				)}
			</div>
		</article>
	);
}
