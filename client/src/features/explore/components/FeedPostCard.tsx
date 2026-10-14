import { useState } from "react";
import { Link } from "react-router-dom";
import type { MouseEvent, FormEvent } from "react";
import type { WorkFeedItem } from "@shared/types/social";
import { useLikeWorkMutation, useUnlikeWorkMutation } from "../../pieces/piecesApi";
import { ROUTES } from "../../../routes/routePaths";
import ProfilePicture from "../../../components/user/ProfilePicture";
import styles from "./FeedPostCard.module.css";
import { VignetteMedia } from "../../pieces/components/VignetteMedia";
import { Button, Form } from "@components";
import NodIcon from "../../../assets/icons/NodIcon";

interface FeedPostCardProps {
	work: WorkFeedItem & { workVersion?: number | null };
}

export function FeedPostCard({ work }: FeedPostCardProps) {
	const [likeWork] = useLikeWorkMutation();
	const [unlikeWork] = useUnlikeWorkMutation();
	const [isCommenting, setIsCommenting] = useState(false);
	const [commentText, setCommentText] = useState("");
	const [isNodding, setIsNodding] = useState(false);

	const formattedDate = work.updatedAt
		? new Date(work.updatedAt).toLocaleDateString("en-US", {
				month: "short",
				day: "numeric",
				year: "numeric",
			})
		: null;

	const handleToggleLike = (e: MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsNodding(true);
		setTimeout(() => {
			setIsNodding(false);
		}, 400);
		if (work.likedByMe) {
			unlikeWork(work.id);
		} else {
			likeWork(work.id);
		}
	};

	const handleCommentClick = (e: MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsCommenting((prev) => !prev);
	};

	const handleAuthorClick = (e: MouseEvent) => {
		e.stopPropagation();
	};

	const handleCommentSubmit = (e: FormEvent) => {
		e.preventDefault();
		// Add your comment submission logic here
		setCommentText("");
		setIsCommenting(false);
	};

	return (
		<div
			className={styles.cardWrapper}
			data-confirm={isCommenting}>
			<Link
				className={styles.card}
				role="button"
				to={ROUTES.SINGLE_PIECE(work.id)}
				style={{ textDecoration: "none" }}
				aria-label={`Open ${work.title} by ${work.author.userName}`}>
				<div className={styles.cardVignette}>
					{work.coverMedia ? <VignetteMedia vignette={work.coverMedia} /> : <div className={styles.shader} />}
				</div>

				<div className={styles.cardBody}>
					{work.workVersion && <div className={styles.version}>{work.workVersion}</div>}

					<div className={styles.details}>
						<div className={styles.text}>
							<header className={styles.header}>
								<span className={styles.title}>{work.title || `Piece #${work.id}`}</span>
							</header>

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
							<div className={styles.actions}>
								<button
									type="button"
									className={`${styles.actionButton} ${styles.likeBtn}`}
									data-liked={work.likedByMe}
									onClick={handleToggleLike}
									aria-label={work.likedByMe ? "Nodded" : "Nod"}>
									<NodIcon isNodding={isNodding} />
									<span>{work.likedByMe ? `Nodded (${work.likeCount})` : `Nod (${work.likeCount})`}</span>
								</button>
							</div>
							<button
								type="button"
								className={styles.commentTrigger}
								onClick={handleCommentClick}>
								💬 {work.commentCount} comments
							</button>
						</div>
					</div>
				</div>
			</Link>

			{/* Slide-out Comment Drawer */}
			<div className={styles.confirmDelete}>
				<p>Reply to Post</p>
				<form
					onSubmit={handleCommentSubmit}
					style={{ display: "flex", flexDirection: "column", gap: "0.75rem", height: "100%" }}>
					<Form.Input
						value={commentText}
						onChange={(e: any) => setCommentText(e.target.value)}
						placeholder="Write a comment..."
					/>
					<div className={styles.confirmActions}>
						<Button
							type="submit"
							className={styles.confirmButton}
							variant="ghost">
							Post Comment
						</Button>
						<Button
							type="button"
							className={styles.cancelButton}
							variant="solid"
							onClick={() => setIsCommenting(false)}>
							Cancel
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
}
