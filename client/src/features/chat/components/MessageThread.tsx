import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useGetMessagesQuery } from "../chatApi";
import { useMeQuery } from "../../auth/authApi";
import { joinConversation, leaveConversation, sendMessage } from "../../../sockets/client";
import type { RootState } from "../../../app/store";
import type { ConversationParticipantSummary, MessageDto } from "@shared/types/index";
import ProfilePicture from "../../../components/user/ProfilePicture";
import styles from "./MessageThread.module.css";

interface MessageThreadProps {
	conversationId: string;
	otherParticipant: ConversationParticipantSummary | null;
}

function formatMessageTime(isoDate: string): string {
	return new Date(isoDate).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

// History comes from REST (getMessages, loaded once per conversation);
// the live tail comes from chatSlice, populated by the socket's
// receive_message listener (see sockets/listeners.ts) while this thread
// is joined. Deduplicated by id since the message this client itself
// just sent arrives back the same way everyone else's does - the server
// broadcasts receive_message to the whole room, sender included, rather
// than the socket ack being the only source of truth for your own
// messages (see sockets/index.ts's send_message handler).
export function MessageThread({ conversationId, otherParticipant }: MessageThreadProps) {
	const { data, isLoading, error } = useGetMessagesQuery(conversationId);
	const { data: me } = useMeQuery();
	const myUserId = me?.user?.userId;

	const liveMessages = useSelector((state: RootState) => state.chat.messages[conversationId] ?? []);

	const [draft, setDraft] = useState("");
	const bottomRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		joinConversation(conversationId);
		return () => leaveConversation(conversationId);
	}, [conversationId]);

	const messages: MessageDto[] = useMemo(() => {
		const historyMessages = data?.messages ?? [];
		const seenIds = new Set(historyMessages.map((m) => m.id));
		// IMessage types createdAt as a Date, but it actually arrives over the
		// socket as JSON, i.e. an ISO string at runtime - normalize to
		// MessageDto's shape (the REST history's own shape) rather than fight
		// two slightly different wire-vs-type representations of the same
		// data.
		const newLiveMessages: MessageDto[] = liveMessages
			.filter((m) => !seenIds.has(m.id))
			.map((m) => ({ ...m, createdAt: String(m.createdAt) }));
		return [...historyMessages, ...newLiveMessages].sort(
			(a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
		);
	}, [data, liveMessages]);

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ block: "end" });
	}, [messages.length]);

	const handleSend = (e: React.FormEvent) => {
		e.preventDefault();
		const trimmed = draft.trim();
		if (!trimmed) return;
		sendMessage(conversationId, trimmed);
		setDraft("");
	};

	return (
		<div className={styles.thread}>
			<header className={styles.header}>
				<ProfilePicture
					avatarUrl={otherParticipant?.avatarUrl}
					userName={otherParticipant?.userName}
					variant="nav"
					className={styles.headerAvatar}
				/>
				<span className={styles.headerName}>{otherParticipant?.userName ?? "Conversation"}</span>
			</header>

			<div className={styles.messages}>
				{isLoading && <div className={styles.status}>Loading messages…</div>}
				{error && <div className={styles.status}>Unable to load this conversation right now.</div>}

				{!isLoading && !error && messages.length === 0 && (
					<div className={styles.status}>No messages yet. Say hello.</div>
				)}

				{messages.map((message) => {
					const isMine = message.senderId === myUserId;
					return (
						<div
							key={message.id}
							className={styles.messageRow}
							data-mine={isMine}>
							<div className={styles.bubble}>
								<p className={styles.bubbleText}>{message.content}</p>
								<time className={styles.bubbleTime}>{formatMessageTime(message.createdAt)}</time>
							</div>
						</div>
					);
				})}
				<div ref={bottomRef} />
			</div>

			<form
				className={styles.composer}
				onSubmit={handleSend}>
				<input
					type="text"
					className={styles.composerInput}
					placeholder="Write a message…"
					value={draft}
					onChange={(e) => setDraft(e.target.value)}
					aria-label="Message"
				/>
				<button
					type="submit"
					className={styles.sendButton}
					disabled={!draft.trim()}>
					Send
				</button>
			</form>
		</div>
	);
}

export default MessageThread;
