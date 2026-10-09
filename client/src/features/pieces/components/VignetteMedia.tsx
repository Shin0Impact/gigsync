import type { IUpdateMedia as Vignette } from "@shared/types/social";
import styles from "./VignetteMedia.module.css";

interface VignetteMediaProps {
	vignette: Vignette;
}

export function VignetteMedia({ vignette }: VignetteMediaProps) {
	const mediaUrl = `/api/media/${vignette.r2Key}`;

	switch (vignette.mediaType) {
		case "image":
			return (
				<div className={styles.mediaContainer}>
					<img
						src={mediaUrl}
						alt="Vignette media"
						className={styles.image}
						loading="lazy"
					/>
				</div>
			);

		case "video":
			return (
				<div className={styles.mediaContainer}>
					<video
						src={mediaUrl}
						controls
						className={styles.video}
					/>
				</div>
			);

		case "audio":
			return (
				<div className={styles.audioContainer}>
					<audio
						src={mediaUrl}
						controls
						className={styles.audio}
					/>
				</div>
			);

		default:
			return (
				<div className={styles.fallbackContainer}>
					<span className={styles.fallbackText}>Attached file: {vignette.r2Key}</span>
				</div>
			);
	}
}
