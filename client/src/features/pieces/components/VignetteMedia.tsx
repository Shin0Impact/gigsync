import type { IUpdateMedia as Vignette } from "@shared/types/social";
import styles from "./VignetteMedia.module.css";
import { getMediaUrl } from "../../../shared/mediaUrl";

interface VignetteMediaProps {
	vignette: Vignette;
	// Card preview mode: the media fills its (square) parent, cropped with
	// object-fit: cover. Videos are shown as a still/muted loop without native
	// controls so the whole card stays one clickable link.
	fill?: boolean;
}

export function VignetteMedia({ vignette, fill = false }: VignetteMediaProps) {
	const mediaUrl = getMediaUrl(vignette.r2Key);

	switch (vignette.mediaType) {
		case "image":
			return (
				<div className={`${styles.mediaContainer} ${fill ? styles.fill : ""}`}>
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
				<div className={`${styles.mediaContainer} ${fill ? styles.fill : ""}`}>
					{fill ? (
						<video
							src={`${mediaUrl}#t=0.1`}
							className={styles.video}
							muted
							loop
							playsInline
							preload="metadata"
							onMouseEnter={(e) => void e.currentTarget.play().catch(() => {})}
							onMouseLeave={(e) => {
								e.currentTarget.pause();
								e.currentTarget.currentTime = 0.1;
							}}
						/>
					) : (
						<video
							src={mediaUrl}
							controls
							className={styles.video}
						/>
					)}
				</div>
			);

		case "audio":
			return (
				<div className={`${styles.audioContainer} ${fill ? styles.audioFill : ""}`}>
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
