import type { IWorkUpdate } from "@shared/types/social";
import { useListCommentsQuery } from "../../piecesApi";
import ProfilePicture from "../../../../components/user/ProfilePicture";
import styles from "./CompositionComments.module.css";

interface CompositionCommentsProps {
	pieceId: number | string;
	intermezzos: IWorkUpdate[];
}

// A comment belongs to the version that was current when it was written:
// the newest intermezzo posted at or before the comment's timestamp.
function versionAt(createdAt: string, intermezzos: IWorkUpdate[]): number | null {
	const t = new Date(createdAt).getTime();
	let best: IWorkUpdate | null = null;
	for (const u of intermezzos) {
		if (new Date(u.createdAt).getTime() <= t && (!best || u.versionNumber > best.versionNumber)) best = u;
	}
	return best ? best.versionNumber : null;
}

export function CompositionComments({ pieceId, intermezzos }: CompositionCommentsProps) {
	const { data, isLoading, isError } = useListCommentsQuery(pieceId);
	const comments = [...(data?.comments ?? [])].sort(
		(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
	);

	return (
		<aside
			className={styles.panel}
			aria-label="Comments">
			<h3 className={styles.heading}>
				Comments <span className={styles.count}>{comments.length}</span>
			</h3>

			{isLoading && <p className={styles.note}>Loading comments…</p>}
			{isError && <p className={styles.note}>Couldn't load comments.</p>}
			{!isLoading && !isError && comments.length === 0 && <p className={styles.note}>No comments yet.</p>}

			<ul className={styles.list}>
				{comments.map((comment) => {
					const version = versionAt(comment.createdAt, intermezzos);
					return (
						<li
							key={comment.id}
							className={styles.item}>
							<ProfilePicture
								avatarUrl={comment.avatarUrl}
								userName={comment.userName}
								variant="nav"
							/>
							<div className={styles.body}>
								<div className={styles.meta}>
									<span className={styles.author}>{comment.userName}</span>
									{version !== null && <span className={styles.version}>V{version}</span>}
									<time className={styles.date}>
										{new Date(comment.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
									</time>
								</div>
								<p className={styles.text}>{comment.content}</p>
							</div>
						</li>
					);
				})}
			</ul>
		</aside>
	);
}
