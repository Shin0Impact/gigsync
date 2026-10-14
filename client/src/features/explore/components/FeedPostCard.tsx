import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { MouseEvent, FormEvent } from "react";
import type { WorkFeedItem } from "@shared/types/social";
import { useLikeWorkMutation, useUnlikeWorkMutation } from "../../pieces/piecesApi";
import { ROUTES } from "../../../routes/routePaths";
import ProfilePicture from "../../../components/user/ProfilePicture";
import styles from "./FeedPostCard.module.css";
import { VignetteMedia } from "../../pieces/components/VignetteMedia";
import { Button, Form } from "@components";
import { LaughIcon as NodIcon, type LaughIconHandle as NodIconHandle } from "@animateicons/react/huge";
import { Message01Icon as EchoIcon, type Message01IconHandle as EchoIconHandle } from "@animateicons/react/huge";

interface FeedPostCardProps {
	work: WorkFeedItem & { workVersion?: number | null };
}

export function FeedPostCard({ work }: FeedPostCardProps) {
	const [likeWork] = useLikeWorkMutation();
	const [unlikeWork] = useUnlikeWorkMutation();
	const [isCommenting, setIsCommenting] = useState(false);
	const [commentText, setCommentText] = useState("");

	const nodIconRef = useRef<NodIconHandle>(null);
	const echoIconRef = useRef<EchoIconHandle>(null);

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
								{work.description || "This Piece has no description."}
							</p>
						</div>

						<div className={styles.actions}>
							{/* <span>{work.updatedAt}</span> */}
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

			<div className={styles.confirmDelete}>
				<p>Your Echo</p>
				<Form
					onSubmit={handleCommentSubmit}
					style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%" }}>
					<Form.Field>
						<Form.Input
							id="newCommentInput"
							type="text"
							value={commentText}
							onChange={(e: any) => setCommentText(e.target.value)}
							placeholder="Share your thoughts..."
							autoFocus
							required
						/>
					</Form.Field>

					<div className={styles.confirmActions}>
						<Form.Submit className={styles.confirmButton}>Post Comment</Form.Submit>
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
