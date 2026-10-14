import { Link } from "react-router-dom";
import { useGetConversationsQuery } from "../chatApi";
import { useMeQuery } from "../../auth/authApi";
import { ROUTES } from "../../../routes/routePaths";
import ProfilePicture from "../../../components/user/ProfilePicture";
import styles from "./ConversationList.module.css";

interface ConversationListProps {
	activeConversationId?: string;
}

function formatPreviewTime(isoDate: string): string {
	const then = new Date(isoDate).getTime();
	const diffSeconds = Math.max(0, Math.floor((Date.now() - then) / 1000));
	if (diffSeconds < 60) return "now";
	const diffMinutes = Math.floor(diffSeconds / 60);
	if (diffMinutes < 60) return `${diffMinutes}m`;
	const diffHours = Math.floor(diffMinutes / 60);
	if (diffHours < 24) return `${diffHours}h`;
	const diffDays = Math.floor(diffHours / 24);
	if (diffDays < 7) return `${diffDays}d`;
	return new Date(isoDate).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// The inbox list - every conversation the signed-in user is part of,
// newest activity first (see list_conversations in
// conversations.service.ts). Entirely our own markup/CSS, same as
// NotificationsPage - no native browser list/notification chrome
// anywhere in this feature.
export function ConversationList({ activeConversationId }: ConversationListProps) {
	const { data, isLoading, error } = useGetConversationsQuery();
	const { data: me } = useMeQuery();
	const myUserId = me?.user?.userId;
	const conversations = data?.conversations ?? [];

	return (
		<aside className={styles.list}>
			<header className={styles.header}>
				<h1 className={styles.title}>Messages</h1>
			</header>

			{isLoading && <div className={styles.status}>Loading conversations…</div>}

			{error && <div className={styles.status}>Unable to load conversations right now.</div>}

			{!isLoading && !error && conversations.length === 0 && (
				<div className={styles.emptyState}>
					<p className={styles.emptyText}>
						No conversations yet. Visit someone&rsquo;s profile and tap Message to start one.
					</p>
				</div>
			)}

			{!isLoading && conversations.length > 0 && (
				<ul className={styles.items}>
					{conversations.map((conversation) => {
						const other = conversation.otherParticipant;
						const lastMessage = conversation.lastMessage;
						const isMine = lastMessage?.senderId === myUserId;

						return (
							<li key={conversation.id}>
								<Link
									to={ROUTES.MESSAGE_THREAD(conversation.id)}
									className={styles.item}
									data-active={conversation.id === activeConversationId}>
									<ProfilePicture
										avatarUrl={other?.avatarUrl}
										userName={other?.userName}
										variant="nav"
										className={styles.avatar}
									/>
									<div className={styles.itemBody}>
										<div className={styles.itemTopRow}>
											<span className={styles.name}>{other?.userName ?? "Unknown"}</span>
											{lastMessage && (
												<time className={styles.time}>{formatPreviewTime(lastMessage.createdAt)}</time>
											)}
										</div>
										<p className={styles.preview}>
											{lastMessage ? (
												<>
													{isMine && <span className={styles.youPrefix}>You: </span>}
													{lastMessage.content}
												</>
											) : (
												<span className={styles.noMessages}>No messages yet</span>
											)}
										</p>
									</div>
								</Link>
							</li>
						);
					})}
				</ul>
			)}
		</aside>
	);
}

export default ConversationList;
