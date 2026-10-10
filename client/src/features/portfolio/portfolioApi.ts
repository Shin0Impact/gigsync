import { AddShowcaseItemInput, AddShowcaseItemResponse, ListShowcaseItemsResponse } from "@shared/types/index";
import { api } from "../../shared/api";

export const portfolioApi = api.injectEndpoints({
	endpoints: (builder) => ({
		getPortfolio: builder.query<ListShowcaseItemsResponse, string>({
			query: (userId) => `/api/media/showcases/${userId}`,
			providesTags: (result, _error, userId) =>
				result
					? [
							...(result.items?.map(({ id }) => ({ type: "Portfolio" as const, id })) ?? []),
							{ type: "Portfolio", id: `USER_${userId}` },
							{ type: "Portfolio", id: "LIST" },
						]
					: [
							{ type: "Portfolio", id: `USER_${userId}` },
							{ type: "Portfolio", id: "LIST" },
						],
		}),

		addToPortfolio: builder.mutation<AddShowcaseItemResponse, AddShowcaseItemInput>({
			query: (body) => ({
				url: "/api/media/showcases",
				method: "POST",
				body,
			}),
			invalidatesTags: [{ type: "Portfolio", id: "LIST" }],
		}),

		removeFromPortfolio: builder.mutation<void, string | number>({
			query: (id) => ({
				url: `/api/media/showcases/${id}`,
				method: "DELETE",
			}),
			invalidatesTags: (_result, _error, id) => [
				{ type: "Portfolio", id },
				{ type: "Portfolio", id: "LIST" },
			],
		}),
	}),
});

export const { useGetPortfolioQuery, useAddToPortfolioMutation, useRemoveFromPortfolioMutation } = portfolioApi;
