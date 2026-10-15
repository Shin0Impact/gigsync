import type { ListUsersSearchResponse } from "@shared/types/index";
import { api } from "../../shared/api";

export const searchApi = api.injectEndpoints({
	endpoints: (builder) => ({
		// GET /api/users/search?q= - directory search by @handle or display name.
		searchUsers: builder.query<ListUsersSearchResponse, string>({
			query: (q) => `/api/users/search?q=${encodeURIComponent(q)}`,
		}),
	}),
});

export const { useSearchUsersQuery } = searchApi;
