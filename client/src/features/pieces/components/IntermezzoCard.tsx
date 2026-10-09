import type { IWorkUpdate as Intermezzo } from "@shared/types/social";
import { useListVignettesQuery } from "../piecesApi";
import { VignetteMedia } from "./VignetteMedia";
import styles from "./IntermezzoCard.module.css";

interface IntermezzoCardProps {
	intermezzo: Intermezzo;
}

export function IntermezzoCard({ intermezzo }: IntermezzoCardProps) {
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
