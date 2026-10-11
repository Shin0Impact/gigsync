import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
	useAddCommentMutation,
	useGetLikeStatusQuery,
	useLikeWorkMutation,
	useListCommentsQuery,
	useListIntermezzosQuery,
	useUnlikeWorkMutation,
} from "../piecesApi";
import { useMeQuery } from "../../auth";
import { ROUTES } from "../../../routes/routePaths";
import { IntermezzoCard } from "./IntermezzoCard";
import styles from "./PostQuickView.module.css";

interface PostQuickViewProps {
	pieceId: number | null;
	onClose: () => void;
}

// The "popup first, full page if you want it" pattern: clicking a post
// anywhere (My Pieces, Explore, a profile) opens this instead of
// navigating straight to PieceDetails - "Open full page" inside is the
// explicit way out to the real route, for anyone who wants to link to it,
// comment-thread-deep-link later, etc.
export function PostQuickView({ pieceId, onClose }: PostQuickViewProps) {
	const isOpen = pieceId !== null;

	const { data: intermezzosData, isLoading } = useListIntermezzosQuery(pieceId ?? 0, {
		skip: !isOpen,
	});
	const { data: likeStatus } = useGetLikeStatusQuery(pieceId ?? 0, { skip: !isOpen });
	const { data: commentsData } = useListCommentsQuery(pieceId ?? 0, { skip: !isOpen });
	const { data: meData } = useMeQuery();

	const [likeWork] = useLikeWorkMutation();
	const [unlikeWork] = useUnlikeWorkMutation();
	const [addComment, { isLoading: isCommenting }] = useAddCommentMutation();
	const [commentText, setCommentText] = useState("");

	if (!isOpen) return null;

	const intermezzi = intermezzosData?.updates ?? [];
	const comments = commentsData?.comments ?? [];
	const isSignedIn = Boolean(meData?.user);

	function handleToggleLike() {
		if (likeStatus?.liked) {
			unlikeWork(pieceId!);
		} else {
			likeWork(pieceId!);
		}
	}

	async function handleAddComment(e: FormEvent) {
		e.preventDefault();
		if (!commentText.trim()) return;
		try {
			await addComment({ workId: pieceId!, body: { content: commentText.trim() } }).unwrap();
			setCommentText("");
		} catch (err) {
			console.error("Failed to add comment:", err);
		}
	}

	return (
		<div
			className={styles.backdrop}
			onClick={onClose}>
			<div
				className={styles.modal}
				onClick={(e) => e.stopPropagation()}>
				<header className={styles.header}>
					<h2 className={styles.title}>Piece #{pieceId}</h2>
					<div className={styles.headerActions}>
						<Link
							to={ROUTES.SINGLE_PIECE(pieceId!)}
							className={styles.openPageLink}
							onClick={onClose}>
							Open full page ↗
						</Link>
						<button
							type="button"
							className={styles.closeButton}
							onClick={onClose}
							aria-label="Close">
							×
						</button>
					</div>
				</header>

				<div className={styles.body}>
					{isLoading && <div className={styles.loading}>Loading…</div>}

					{!isLoading && intermezzi.length === 0 && (
						<div className={styles.emptyState}>No Intermezzi posted yet for this piece.</div>
					)}

					{!isLoading && intermezzi.length > 0 && (
						<div className={styles.timeline}>
							{intermezzi.map((intermezzo) => (
								<IntermezzoCard
									key={intermezzo.id}
									intermezzo={intermezzo}
								/>
							))}
						</div>
					)}

					<section className={styles.engagement}>
						<button
							type="button"
							className={styles.likeButton}
							data-liked={likeStatus?.liked ?? false}
							onClick={handleToggleLike}
							disabled={!isSignedIn}
							title={isSignedIn ? undefined : "Sign in to like"}>
							{likeStatus?.liked ? "♥" : "♡"} {likeStatus?.likeCount ?? 0}
						</button>

						<div className={styles.comments}>
							<h3 className={styles.commentsTitle}>Comments ({comments.length})</h3>

							{comments.length === 0 && (
								<p className={styles.noComments}>No comments yet.</p>
							)}

							<ul className={styles.commentList}>
								{comments.map((comment) => (
									<li
										key={comment.id}
										className={styles.commentItem}>
										<span className={styles.commentAuthor}>{comment.userName}</span>
										<span className={styles.commentContent}>{comment.content}</span>
									</li>
								))}
							</ul>

							{isSignedIn && (
								<form
									className={styles.commentForm}
									onSubmit={handleAddComment}>
									<input
										className={styles.commentInput}
										value={commentText}
										onChange={(e) => setCommentText(e.target.value)}
										placeholder="Add a comment…"
										disabled={isCommenting}
									/>
									<button
										type="submit"
										className={styles.commentSubmit}
										disabled={isCommenting || !commentText.trim()}>
										Post
									</button>
								</form>
							)}
						</div>
					</section>
				</div>
			</div>
		</div>
	);
}
