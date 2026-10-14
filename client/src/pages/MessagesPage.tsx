import { useParams } from "react-router-dom";
import { useGetConversationsQuery, ConversationList, MessageThread } from "../features/chat";
import styles from "./MessagesPage.module.css";

// Card #34 - the chat UI: an inbox (ConversationList) alongside the
// currently-open thread (MessageThread), the same two-pane shape as any
// messaging app. Everything here is our own React/CSS - no browser
// default notification or list chrome, matching NotificationsPage.
export function MessagesPage() {
	const { conversationId } = useParams<{ conversationId: string }>();
	const { data } = useGetConversationsQuery();
	const activeConversation = (data?.conversations ?? []).find((c) => c.id === conversationId) ?? null;

	return (
		<main className={styles.container}>
			<ConversationList activeConversationId={conversationId} />

			<section className={styles.threadPane}>
				{conversationId ? (
					<MessageThread
						key={conversationId}
						conversationId={conversationId}
						otherParticipant={activeConversation?.otherParticipant ?? null}
					/>
				) : (
					<div className={styles.placeholder}>
						<p className={styles.placeholderText}>Select a conversation to start messaging.</p>
					</div>
				)}
			</section>
		</main>
	);
}

export default MessagesPage;
