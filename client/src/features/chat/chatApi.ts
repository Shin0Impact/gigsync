import {
	ListConversationsResponse,
	ListMessagesResponse,
	StartConversationResponse,
} from "@shared/types/index";
import { api } from "../../shared/api";

// Card #34 - direct messaging. REST here covers discovering conversations
// and loading history; the live tail of a thread you already have open
// arrives over the socket gateway instead (see sockets/client.ts +
// sockets/listeners.ts, which push into chatSlice) - there is no
// "getMessages" polling, a thread merges this query's result with
// chatSlice's live messages for that conversation id (see MessageThread).
export const chatApi = api.injectEndpoints({
	endpoints: (builder) => ({
		getConversations: builder.query<ListConversationsResponse, void>({
			query: () => "/api/conversations",
			providesTags: ["Chat"],
		}),

		// Idempotent server-side (see start_conversation in
		// conversations.service.ts) - calling this again for a person you
		// already have a thread with returns that same conversation id
		// rather than creating a new one, so this is safe to call every
		// time the "Message" button on a profile is clicked.
		startConversation: builder.mutation<StartConversationResponse, { otherUserId: string }>({
			query: (body) => ({ url: "/api/conversations", method: "POST", body }),
			invalidatesTags: ["Chat"],
		}),

		getMessages: builder.query<ListMessagesResponse, string>({
			query: (conversationId) => `/api/conversations/${conversationId}/messages`,
			providesTags: (_result, _error, conversationId) => [{ type: "Chat", id: conversationId }],
		}),
	}),
});

export const { useGetConversationsQuery, useStartConversationMutation, useGetMessagesQuery } = chatApi;
