// src/features/pieces/api/worksApi.ts

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
		// POST /api/works - Create a new portfolio piece
		createPiece: builder.mutation<CreateWorkResponse, CreateWorkInput>({
			query: (body) => ({
				url: "/api/works",
				method: "POST",
				body,
			}),
			invalidatesTags: ["Piece"],
		}),

		// GET /api/works/:userId - List pieces for a user
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

		// POST /api/works/:workId/updates - Add an intermezzo to a piece
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

		// GET /api/works/:workId/updates - List intermezzos for a piece
		listIntermezzos: builder.query<ListWorkUpdatesResponse, number | string>({
			query: (pieceId) => `/api/works/${pieceId}/updates`,
			providesTags: (_result, _error, pieceId) => [{ type: "Intermezzo", id: pieceId }],
		}),

		// POST /api/works/updates/:updateId/media - Attach a vignette to an intermezzo
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

		// GET /api/works/updates/:updateId/media - List vignettes for an intermezzo
		listVignettes: builder.query<ListUpdateMediaResponse, number | string>({
			query: (intermezzoId) => `/api/works/updates/${intermezzoId}/media`,
			providesTags: (_result, _error, intermezzoId) => [
				{ type: "Vignette", id: intermezzoId },
			],
		}),

		// DELETE /api/works/updates/:updateId/media/:mediaId - Remove a vignette
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
