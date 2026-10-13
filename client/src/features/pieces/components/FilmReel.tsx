import type { IWorkUpdate } from "@shared/types/social";
import { useListIntermezzosQuery, useListVignettesQuery } from "../piecesApi";
import { usePostQuickView } from "../PostQuickViewProvider";
import { getMediaUrl } from "../../../shared/mediaUrl";
import styles from "./FilmReel.module.css";

interface FilmReelProps {
	pieceId: number;
}

const MAX_FRAMES = 3;
// A single update is just the piece's current state, same as what its
// own PieceCard cover already shows - there's nothing to compare it
// against yet, so it doesn't count as a "history" worth a reel. Two or
// more is where it starts being a timeline.
const MIN_UPDATES_TO_SHOW = 2;

// A small history reel next to a single piece, on the profile page's
// Posts tab only (see ProfilePage.tsx - intentionally not embedded in
// PieceCard itself, so it doesn't follow PieceCard into the Explore/
// Following feeds or the quick-view popup). Shows that one piece's own
// last few Intermezzi (updates), newest first, like an old commit
// history. Renders nothing until there's an actual history to show.
export function FilmReel({ pieceId }: FilmReelProps) {
	const { data } = useListIntermezzosQuery(pieceId);
	const allUpdates = data?.updates ?? [];

	if (allUpdates.length < MIN_UPDATES_TO_SHOW) return null;

	const updates = allUpdates.slice(0, MAX_FRAMES);

	return (
		<aside
			className={styles.reel}
			aria-label="Piece history">
			{updates.map((update) => (
				<FilmFrame
					key={update.id}
					pieceId={pieceId}
					update={update}
				/>
			))}
		</aside>
	);
}

interface FilmFrameProps {
	pieceId: number;
	update: IWorkUpdate;
}

// Split out so each frame's useListVignettesQuery call is an unconditional
// top-level hook call (one per rendered frame) rather than a loop of
// hooks inside FilmReel - same pattern PieceCard/IntermezzoCard already
// use for their own cover-image fetches.
function FilmFrame({ pieceId, update }: FilmFrameProps) {
	const { openPost } = usePostQuickView();
	const { data } = useListVignettesQuery(update.id);
	const thumbnail = data?.media?.[0];

	return (
		<div className={styles.frameRow}>
			<span
				className={styles.sprocketCol}
				aria-hidden="true">
				<span className={styles.sprocket} />
				<span className={styles.sprocket} />
				<span className={styles.sprocket} />
				<span className={styles.sprocket} />
			</span>

			<button
				type="button"
				className={styles.frame}
				title={update.description ?? `Update #${update.versionNumber}`}
				onClick={(e) => {
					e.stopPropagation();
					openPost(pieceId);
				}}>
				{thumbnail && thumbnail.mediaType === "image" ? (
					<img
						src={getMediaUrl(thumbnail.r2Key)}
						alt=""
						className={styles.thumbnail}
						loading="lazy"
					/>
				) : (
					<span className={styles.fallback}>#{update.versionNumber}</span>
				)}
			</button>

			<span
				className={styles.sprocketCol}
				aria-hidden="true">
				<span className={styles.sprocket} />
				<span className={styles.sprocket} />
				<span className={styles.sprocket} />
				<span className={styles.sprocket} />
			</span>
		</div>
	);
}
