import {
	CreateWorkInput,
	CreateWorkUpdateInput,
	AddUpdateMediaInput,
	CreateWorkResponse,
	ListWorksResponse,
	AddWorkUpdateResponse,
	ListWorkUpdatesResponse,
	AddUpdateMediaResponse,
	ListUpdateMediaResponse,
} from "@shared/types/social";
import { api } from "../../shared/api";

export const worksApi = api.injectEndpoints({
	endpoints: (builder) => ({
		createPiece: builder.mutation<CreateWorkResponse, CreateWorkInput>({
			query: (body) => ({
				url: "/api/works",
				method: "POST",
				body,
			}),
			invalidatesTags: ["Piece"],
		}),

		listPieces: builder.query<ListWorksResponse, string>({
			query: (userId) => `/api/works/${userId}`,
			providesTags: (result, _error, userId) =>
				result
					? [
							...result.works.map(({ id }) => ({ type: "Piece" as const, id })),
							{ type: "Piece", id: `USER_${userId}` },
						]
					: [{ type: "Piece", id: `USER_${userId}` }],
		}),

		addIntermezzo: builder.mutation<
			AddWorkUpdateResponse,
			{ pieceId: number | string; body: CreateWorkUpdateInput }
		>({
			query: ({ pieceId, body }) => ({
				url: `/api/works/${pieceId}/updates`,
				method: "POST",
				body,
			}),
			invalidatesTags: (_result, _error, { pieceId }) => [
				{ type: "Intermezzo", id: pieceId },
			],
		}),

		listIntermezzos: builder.query<ListWorkUpdatesResponse, number | string>({
			query: (pieceId) => `/api/works/${pieceId}/updates`,
			providesTags: (_result, _error, pieceId) => [{ type: "Intermezzo", id: pieceId }],
		}),

		addVignette: builder.mutation<
			AddUpdateMediaResponse,
			{ intermezzoId: number | string; body: AddUpdateMediaInput }
		>({
			query: ({ intermezzoId, body }) => ({
				url: `/api/works/updates/${intermezzoId}/media`,
				method: "POST",
				body,
			}),
			invalidatesTags: (_result, _error, { intermezzoId }) => [
				{ type: "Vignette", id: intermezzoId },
			],
		}),

		listVignettes: builder.query<ListUpdateMediaResponse, number | string>({
			query: (intermezzoId) => `/api/works/updates/${intermezzoId}/media`,
			providesTags: (_result, _error, intermezzoId) => [
				{ type: "Vignette", id: intermezzoId },
			],
		}),

		deleteVignette: builder.mutation<
			void,
			{ intermezzoId: number | string; vignetteId: number | string }
		>({
			query: ({ intermezzoId, vignetteId }) => ({
				url: `/api/works/updates/${intermezzoId}/media/${vignetteId}`,
				method: "DELETE",
			}),
			invalidatesTags: (_result, _error, { intermezzoId }) => [
				{ type: "Vignette", id: intermezzoId },
			],
		}),
	}),
});

export const {
	useCreatePieceMutation,
	useListPiecesQuery,
	useAddIntermezzoMutation,
	useListIntermezzosQuery,
	useAddVignetteMutation,
	useListVignettesQuery,
	useDeleteVignetteMutation,
} = worksApi;
