import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { MouseEvent, FormEvent } from "react";
import type { WorkFeedItem } from "@shared/types/social";
import { useLikeWorkMutation, useUnlikeWorkMutation, useAddCommentMutation } from "../../pieces/piecesApi";
import { ROUTES } from "../../../routes/routePaths";
import ProfilePicture from "../../../components/user/ProfilePicture";
import styles from "./FeedPostCard.module.css";
import { VignetteMedia } from "../../pieces/components/VignetteMedia";
import { Button, Form } from "@components";
import { LaughIcon as NodIcon, type LaughIconHandle as NodIconHandle } from "@animateicons/react/huge";
import { Message01Icon as EchoIcon, type Message01IconHandle as EchoIconHandle } from "@animateicons/react/huge";
import { LazyShader } from "@components/shader/LazyShader";

interface FeedPostCardProps {
	work: WorkFeedItem & { workVersion?: number | null };
}

export function FeedPostCard({ work }: FeedPostCardProps) {
	const [likeWork] = useLikeWorkMutation();
	const [unlikeWork] = useUnlikeWorkMutation();
	const [isCommenting, setIsCommenting] = useState(false);
	const [commentText, setCommentText] = useState("");
	const [commentError, setCommentError] = useState<string | null>(null);
	const [addComment, { isLoading: isPostingComment }] = useAddCommentMutation();

	const echoPanelRef = useRef<HTMLDivElement>(null);
	const nodIconRef = useRef<NodIconHandle>(null);
	const echoIconRef = useRef<EchoIconHandle>(null);

	const formattedDate = work.updatedAt
		? new Date(work.updatedAt).toLocaleDateString("en-US", {
				month: "short",
				day: "numeric",
				year: "numeric",
			})
		: null;

	// Focus the echo input only when the panel is actually opened. It used to
	// have `autoFocus`, and since every card keeps its (hidden) panel mounted,
	// the last card's input grabbed focus on page load and scrolled the feed
	// to the bottom. preventScroll keeps the feed where it is.
	useEffect(() => {
		if (isCommenting) echoPanelRef.current?.querySelector("input")?.focus({ preventScroll: true });
	}, [isCommenting]);

	const handleToggleLike = (e: MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		nodIconRef.current?.startAnimation();

		if (work.likedByMe) {
			unlikeWork(work.id);
		} else {
			likeWork(work.id);
		}
	};

	const handleCommentClick = (e: MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		// Trigger the echo icon animation and toggle the comment drawer
		echoIconRef.current?.startAnimation();
		setIsCommenting((prev) => !prev);
	};

	const handleAuthorClick = (e: MouseEvent) => {
		e.stopPropagation();
	};

	const handleCommentSubmit = async (e: FormEvent) => {
		e.preventDefault();
		const content = commentText.trim();
		if (!content) return;

		setCommentError(null);
		try {
			await addComment({ workId: work.id, body: { content } }).unwrap();
			setCommentText("");
			setIsCommenting(false);
		} catch {
			setCommentError("Couldn't post your echo. Please try again.");
		}
	};

	const pieceIdNum = Number(work.id) || 1;
	const randomCount = 10 + (pieceIdNum % 11); // Range: 10 to 20 (max 20)
	const randomSize = 0.7 + (pieceIdNum % 5) * 0.1; // Range: 0.6 to 1.0 (max 1.0)
	const randomSpeed = 0.8 + (pieceIdNum % 7) * 0.2; // Range: 0.8 to 2.0 (max 2.0)

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
					{work.coverMedia ? (
						<VignetteMedia vignette={work.coverMedia} />
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
								{work.description || "This Piece has no description."}
							</p>
						</div>

						<div className={styles.actions}>
							<button
								type="button"
								className={styles.nodButton}
								data-liked={work.likedByMe}
								onClick={handleToggleLike}
								aria-label={work.likedByMe ? "Nodded" : "Nod"}>
								<NodIcon
									ref={nodIconRef}
									size={16}
									color="currentColor"
								/>
								<span>{work.likeCount} Nods</span>
							</button>

							<button
								type="button"
								className={styles.echoButton}
								onClick={handleCommentClick}>
								<EchoIcon
									ref={echoIconRef}
									size={16}
									color="currentColor"
								/>
								<span>{work.commentCount} Echoes</span>
							</button>
						</div>
					</div>
				</div>
			</Link>

			<div
				className={styles.confirmDelete}
				ref={echoPanelRef}>
				<p>Your Echo</p>
				<Form
					onSubmit={handleCommentSubmit}
					style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%" }}>
					<Form.Field>
						<Form.Input
							id={`comment-input-${work.id}`}
							type="text"
							value={commentText}
							onChange={(e: any) => setCommentText(e.target.value)}
							placeholder="Share your thoughts..."
							disabled={isPostingComment}
							required
						/>
					</Form.Field>
					{commentError && <p role="alert">{commentError}</p>}

					<div className={styles.confirmActions}>
						<Form.Submit
							className={styles.confirmButton}
							disabled={isPostingComment}>
							{isPostingComment ? "Posting…" : "Post Comment"}
						</Form.Submit>
						<Button
							type="button"
							className={styles.cancelButton}
							variant="solid"
							onClick={() => setIsCommenting(false)}>
							Cancel
						</Button>
					</div>
				</Form>
			</div>
		</div>
	);
}
