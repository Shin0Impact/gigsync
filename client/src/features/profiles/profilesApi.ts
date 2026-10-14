import { GetProfileResponse, FollowResponse, ListMyActivityResponse } from "@shared/types/index";
import { api } from "../../shared/api";

export const profilesApi = api.injectEndpoints({
	endpoints: (builder) => ({
		getProfile: builder.query<GetProfileResponse, string>({
			query: (username) => `/api/profiles/${username.toLowerCase()}`,
			providesTags: (_result, _error, username) => [{ type: "Profile", id: username }],
		}),

		getProfileById: builder.query<GetProfileResponse, string>({
			query: (userId) => `/api/profiles/id/${userId}`,
			providesTags: (_result, _error, userId) => [{ type: "Profile", id: userId }],
		}),

		followProfile: builder.mutation<FollowResponse, string>({
			query: (username) => ({
				url: `/api/profiles/${username}/follow`,
				method: "POST",
			}),
			invalidatesTags: (_result, _error, username) => [{ type: "Profile", id: username }],
		}),

		unfollowProfile: builder.mutation<FollowResponse, string>({
			query: (username) => ({
				url: `/api/profiles/${username}/follow`,
				method: "DELETE",
			}),
			invalidatesTags: (_result, _error, username) => [{ type: "Profile", id: username }],
		}),

		getMyActivity: builder.query<ListMyActivityResponse, void>({
			query: () => "/api/profiles/me/activity",
			providesTags: ["Activity"],
		}),
	}),
});

export const {
	useGetProfileQuery,
	useGetProfileByIdQuery,
	useFollowProfileMutation,
	useUnfollowProfileMutation,
	useGetMyActivityQuery,
} = profilesApi;
