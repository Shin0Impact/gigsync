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

		nodPiece: builder.mutation<ToggleWorkLikeResponse, number | string>({
			query: (pieceId) => ({
				url: `/api/works/${pieceId}/like`,
				method: "POST",
			}),
			invalidatesTags: (_result, _error, pieceId) => [
				{ type: "Nod", id: pieceId },
				{ type: "PieceFeed", id: "LIST" },
			],
		}),

		unnodPiece: builder.mutation<ToggleWorkLikeResponse, number | string>({
			query: (pieceId) => ({
				url: `/api/works/${pieceId}/like`,
				method: "DELETE",
			}),
			invalidatesTags: (_result, _error, pieceId) => [
				{ type: "Nod", id: pieceId },
				{ type: "PieceFeed", id: "LIST" },
			],
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
