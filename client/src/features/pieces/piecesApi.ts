import {
	CreateWorkInput,
	CreateWorkUpdateInput,
	AddUpdateMediaInput,
	AddWorkCommentInput,
	CreateWorkResponse,
	ListWorksResponse,
	AddWorkUpdateResponse,
	ListWorkUpdatesResponse,
	AddUpdateMediaResponse,
	ListUpdateMediaResponse,
	ListWorksFeedResponse,
	AddWorkCommentResponse,
	ListWorkCommentsResponse,
	ToggleWorkLikeResponse,
} from "@shared/types/social";
import { api } from "../../shared/api";

export const piecesApi = api.injectEndpoints({
	endpoints: (builder) => ({
		createPiece: builder.mutation<CreateWorkResponse, CreateWorkInput>({
			query: (body) => ({
				url: "/api/works",
				method: "POST",
				body,
			}),
			invalidatesTags: ["Piece"],
		}),

		listUserPieces: builder.query<ListWorksResponse, string>({
			query: (userId) => `/api/works/${userId}`,
			providesTags: (result, _error, userId) =>
				result
					? [
							...result.works.map(({ id }) => ({ type: "Piece" as const, id })),
							{ type: "Piece", id: `USER_${userId}` },
						]
					: [{ type: "Piece", id: `USER_${userId}` }],
		}),

		deletePiece: builder.mutation<void, { pieceId: number | string; ownerId?: string }>({
			query: ({ pieceId }) => ({
				url: `/api/works/${pieceId}`,
				method: "DELETE",
			}),
			invalidatesTags: (_result, _error, { pieceId, ownerId }) => [
				{ type: "Piece", id: pieceId },
				...(ownerId ? [{ type: "Piece" as const, id: `USER_${ownerId}` }] : []),
				{ type: "PieceFeed", id: "LIST" },
			],
		}),

		addIntermezzo: builder.mutation<AddWorkUpdateResponse, { pieceId: number | string; body: CreateWorkUpdateInput }>({
			query: ({ pieceId, body }) => ({
				url: `/api/works/${pieceId}/updates`,
				method: "POST",
				body,
			}),
			invalidatesTags: (_result, _error, { pieceId }) => [{ type: "Intermezzo", id: pieceId }],
		}),

		listIntermezzos: builder.query<ListWorkUpdatesResponse, number | string>({
			query: (pieceId) => `/api/works/${pieceId}/updates`,
			providesTags: (_result, _error, pieceId) => [{ type: "Intermezzo", id: pieceId }],
		}),

		addVignette: builder.mutation<AddUpdateMediaResponse, { intermezzoId: number | string; body: AddUpdateMediaInput }>({
			query: ({ intermezzoId, body }) => ({
				url: `/api/works/updates/${intermezzoId}/media`,
				method: "POST",
				body,
			}),
			invalidatesTags: (_result, _error, { intermezzoId }) => [{ type: "Vignette", id: intermezzoId }],
		}),

		listVignettes: builder.query<ListUpdateMediaResponse, number | string>({
			query: (intermezzoId) => `/api/works/updates/${intermezzoId}/media`,
			providesTags: (_result, _error, intermezzoId) => [{ type: "Vignette", id: intermezzoId }],
		}),

		deleteVignette: builder.mutation<void, { intermezzoId: number | string; vignetteId: number | string }>({
			query: ({ intermezzoId, vignetteId }) => ({
				url: `/api/works/updates/${intermezzoId}/media/${vignetteId}`,
				method: "DELETE",
			}),
			invalidatesTags: (_result, _error, { intermezzoId }) => [{ type: "Vignette", id: intermezzoId }],
		}),

		listPiecesFeed: builder.query<
			ListWorksFeedResponse,
			{ scope?: "explore" | "following"; limit?: number; offset?: number } | void
		>({
			query: (params) => {
				const search = new URLSearchParams();
				if (params?.scope) search.set("scope", params.scope);
				if (params?.limit) search.set("limit", String(params.limit));
				if (params?.offset) search.set("offset", String(params.offset));
				const qs = search.toString();
				return `/api/works${qs ? `?${qs}` : ""}`;
			},
			providesTags: [{ type: "PieceFeed", id: "LIST" }],
		}),

		getNodStatus: builder.query<ToggleWorkLikeResponse, number | string>({
			query: (pieceId) => `/api/works/${pieceId}/like`,
			providesTags: (_result, _error, pieceId) => [{ type: "Nod", id: pieceId }],
		}),

		// Previously these invalidated the whole feed ({ type: "Feed", id: "LIST" })
		// on every like/unlike, which refetched listWorksFeed in full - every like
		// tap re-ran the entire feed query, which could reorder/refresh posts out
		// from under the user and made the button feel unreliable, especially on
		// a second tap fired before that refetch had resolved (handleToggleLike
		// in FeedPostCard/PostQuickView decides like vs. unlike from the LAST
		// fetched state, so a tap during that window could fire the same
		// direction twice or the wrong direction). An optimistic update here
		// instead patches every cached feed page and the single-work like-status
		// query directly and immediately, with the { type: "Like", id: workId }
		// tag kept as a narrow (one work, not the whole feed) consistency
		// safety net in case the optimistic patch and the server ever disagree.
		likeWork: builder.mutation<ToggleWorkLikeResponse, number | string>({
			query: (workId) => ({
				url: `/api/works/${workId}/like`,
				method: "POST",
			}),
			async onQueryStarted(workId, { dispatch, queryFulfilled, getState }) {
				const patches: { undo: () => void }[] = [];
				const state = getState();
				const feedArgs = worksApi.util.selectCachedArgsForQuery(state, "listWorksFeed");

				for (const arg of feedArgs) {
					patches.push(
						dispatch(
							worksApi.util.updateQueryData("listWorksFeed", arg, (draft) => {
								const work = draft.works.find((w) => String(w.id) === String(workId));
								if (!work || work.likedByMe === true) return;
								work.likedByMe = true;
								work.likeCount += 1;
							}),
						),
					);
				}

				if (worksApi.util.selectCachedArgsForQuery(state, "getLikeStatus").includes(workId)) {
					patches.push(
						dispatch(
							worksApi.util.updateQueryData("getLikeStatus", workId, (draft) => {
								if (draft.liked === true) return;
								draft.liked = true;
								draft.likeCount += 1;
							}),
						),
					);
				}

				try {
					await queryFulfilled;
				} catch {
					patches.forEach((patch) => patch.undo());
				}
			},
			invalidatesTags: (_result, _error, workId) => [{ type: "Like", id: workId }],
		}),

		unnodPiece: builder.mutation<ToggleWorkLikeResponse, number | string>({
			query: (pieceId) => ({
				url: `/api/works/${pieceId}/like`,
				method: "DELETE",
			}),
			async onQueryStarted(workId, { dispatch, queryFulfilled, getState }) {
				const patches: { undo: () => void }[] = [];
				const state = getState();
				const feedArgs = worksApi.util.selectCachedArgsForQuery(state, "listWorksFeed");

				for (const arg of feedArgs) {
					patches.push(
						dispatch(
							worksApi.util.updateQueryData("listWorksFeed", arg, (draft) => {
								const work = draft.works.find((w) => String(w.id) === String(workId));
								if (!work || work.likedByMe === false) return;
								work.likedByMe = false;
								work.likeCount += -1;
							}),
						),
					);
				}

				if (worksApi.util.selectCachedArgsForQuery(state, "getLikeStatus").includes(workId)) {
					patches.push(
						dispatch(
							worksApi.util.updateQueryData("getLikeStatus", workId, (draft) => {
								if (draft.liked === false) return;
								draft.liked = false;
								draft.likeCount += -1;
							}),
						),
					);
				}

				try {
					await queryFulfilled;
				} catch {
					patches.forEach((patch) => patch.undo());
				}
			},
			invalidatesTags: (_result, _error, workId) => [{ type: "Like", id: workId }],
		}),

		listEchoes: builder.query<ListWorkCommentsResponse, number | string>({
			query: (pieceId) => `/api/works/${pieceId}/comments`,
			providesTags: (_result, _error, pieceId) => [{ type: "Echo", id: pieceId }],
		}),

		addEcho: builder.mutation<AddWorkCommentResponse, { pieceId: number | string; body: AddWorkCommentInput }>({
			query: ({ pieceId, body }) => ({
				url: `/api/works/${pieceId}/comments`,
				method: "POST",
				body,
			}),
			invalidatesTags: (_result, _error, { pieceId }) => [{ type: "Echo", id: pieceId }],
		}),

		deleteEcho: builder.mutation<void, { pieceId: number | string; commentId: number | string }>({
			query: ({ commentId }) => ({
				url: `/api/works/comments/${commentId}`,
				method: "DELETE",
			}),
			invalidatesTags: (_result, _error, { pieceId }) => [{ type: "Echo", id: pieceId }],
		}),
	}),
});

export const {
	useCreatePieceMutation,
	useListUserPiecesQuery,
	useDeletePieceMutation,
	useAddIntermezzoMutation,
	useListIntermezzosQuery,
	useAddVignetteMutation,
	useListVignettesQuery,
	useDeleteVignetteMutation,
	useListPiecesFeedQuery,
	useGetNodStatusQuery,
	useNodPieceMutation,
	useUnnodPieceMutation,
	useListEchoesQuery,
	useAddEchoMutation,
	useDeleteEchoMutation,
} = piecesApi;
