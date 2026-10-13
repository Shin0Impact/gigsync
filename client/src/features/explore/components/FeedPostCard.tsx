import type { MouseEvent } from "react";
import type { WorkFeedItem } from "@shared/types/social";
import { useLikeWorkMutation, useUnlikeWorkMutation } from "../../pieces/piecesApi";
import { usePostQuickView } from "../../pieces/PostQuickViewProvider";
import { ROUTES } from "../../../routes/routePaths";
import { getMediaUrl } from "../../../shared/mediaUrl";
import ProfilePicture from "../../../components/user/ProfilePicture";
import { Link } from "react-router-dom";
import styles from "./FeedPostCard.module.css";

interface FeedPostCardProps {
	work: WorkFeedItem;
}

// A work as it appears in the Explore / Following feeds - unlike PieceCard
// (My Pieces), the author, cover media and engagement counts all come
// pre-computed from listWorksFeed, so this card never fires its own
// per-card queries. Clicking it opens the same PostQuickView popup as
// everywhere else (see PieceCard.tsx for the original pattern).
export function FeedPostCard({ work }: FeedPostCardProps) {
	const { openPost } = usePostQuickView();
	const [likeWork] = useLikeWorkMutation();
	const [unlikeWork] = useUnlikeWorkMutation();

	const formattedDate = work.createdAt
		? new Date(work.createdAt).toLocaleDateString("en-US", {
				month: "short",
				day: "numeric",
				year: "numeric",
			})
		: null;

	const handleToggleLike = (e: MouseEvent) => {
		e.stopPropagation();
		if (work.likedByMe) {
			unlikeWork(work.id);
		} else {
			likeWork(work.id);
		}
	};

	const handleAuthorClick = (e: MouseEvent) => {
		e.stopPropagation();
	};

	return (
		<div
			className={styles.card}
			role="button"
			tabIndex={0}
			onClick={() => openPost(work.id)}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					openPost(work.id);
				}
			}}
			aria-label={`Open piece #${work.id} by ${work.author.userName}`}>
			<header className={styles.header}>
				<Link
					to={ROUTES.PROFILE(work.author.userName)}
					className={styles.author}
					onClick={handleAuthorClick}>
					<ProfilePicture
						avatarUrl={work.author.avatarUrl}
						userName={work.author.userName}
						variant="nav"
					/>
					<div className={styles.authorMeta}>
						<span className={styles.authorName}>{work.author.userName}</span>
						{formattedDate && <time className={styles.date}>{formattedDate}</time>}
					</div>
				</Link>
			</header>

			{work.coverMedia && (
				<div className={styles.cover}>
					{work.coverMedia.mediaType === "video" ? (
						<video
							src={getMediaUrl(work.coverMedia.r2Key)}
							className={styles.coverMedia}
							muted
							loop
							playsInline
							preload="metadata"
						/>
					) : work.coverMedia.mediaType === "audio" ? (
						<div className={styles.coverAudio}>♪</div>
					) : work.coverMedia.mediaType === "image" ? (
						<img
							src={getMediaUrl(work.coverMedia.r2Key)}
							alt=""
							className={styles.coverMedia}
							loading="lazy"
						/>
					) : (
						<div className={styles.coverFallback}>Attached file</div>
					)}
				</div>
			)}

			<p className={`${styles.description} ${!work.description ? styles.noDescription : ""}`}>
				{work.description || "Untitled Piece without description."}
			</p>

			<div className={styles.actions}>
				<button
					type="button"
					className={styles.likeButton}
					data-liked={work.likedByMe}
					onClick={handleToggleLike}
					aria-label={work.likedByMe ? "Unlike" : "Like"}>
					{work.likedByMe ? "♥" : "♡"} {work.likeCount}
				</button>
				<span className={styles.commentCount}>💬 {work.commentCount}</span>
			</div>
		</div>
	);
}
