import { Link } from "react-router-dom";
import type { MouseEvent } from "react";
import type { WorkFeedItem } from "@shared/types/social";
import { useLikeWorkMutation, useUnlikeWorkMutation } from "../../pieces/piecesApi";
import { ROUTES } from "../../../routes/routePaths";
import { getMediaUrl } from "../../../shared/mediaUrl";
import ProfilePicture from "../../../components/user/ProfilePicture";
import styles from "./FeedPostCard.module.css";

interface FeedPostCardProps {
	work: WorkFeedItem;
}

export function FeedPostCard({ work }: FeedPostCardProps) {
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
		e.preventDefault();
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
		<div className={styles.cardWrapper}>
			<Link
				className={styles.card}
				role="button"
				to={ROUTES.SINGLE_PIECE(work.id)}
				style={{ textDecoration: "none" }}
				aria-label={`Open piece #${work.id} by ${work.author.userName}`}>
				{/* 1x1 Cover Vignette on the Left */}
				<div className={styles.cardVignette}>
					{work.coverMedia ? (
						work.coverMedia.mediaType === "video" ? (
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
						) : (
							<img
								src={getMediaUrl(work.coverMedia.r2Key)}
								alt=""
								className={styles.coverMedia}
								loading="lazy"
							/>
						)
					) : (
						<div className={styles.coverFallback} />
					)}
				</div>

				<div className={styles.cardBody}>
					{/* Like count badge in top-right */}
					<div className={styles.version}>{work.likeCount} ♥</div>

					<div className={styles.details}>
						<div className={styles.text}>
							<header className={styles.header}>
								<span className={styles.title}>{work.title || `Piece #${work.id}`}</span>
							</header>

							{/* Author Profile Link with PFP */}
							<Link
								to={ROUTES.PROFILE(work.author.userName)}
								className={styles.authorRow}
								onClick={handleAuthorClick}>
								<ProfilePicture
									avatarUrl={work.author.avatarUrl}
									userName={work.author.userName}
									variant="nav"
								/>
								<span className={styles.authorName}>{work.author.userName}</span>
								{formattedDate && <span className={styles.dot}>•</span>}
								{formattedDate && <time className={styles.date}>{formattedDate}</time>}
							</Link>

							<p className={`${styles.description} ${!work.description ? styles.noDescription : ""}`}>
								{work.description || "Untitled Piece without description."}
							</p>
						</div>

						{/* Action Bar */}
						<div className={styles.actions}>
							<button
								type="button"
								className={`${styles.actionButton} ${styles.likeBtn}`}
								data-liked={work.likedByMe}
								onClick={handleToggleLike}
								aria-label={work.likedByMe ? "Unlike" : "Like"}>
								{work.likedByMe ? "♥ Liked" : "♡ Like"}
							</button>
							<span className={styles.commentCount}>💬 {work.commentCount} comments</span>
						</div>
					</div>
				</div>
			</Link>
		</div>
	);
}
