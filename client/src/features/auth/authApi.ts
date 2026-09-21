import { api } from "../../shared/api";
import { IUser, RegisterPayload } from "../../shared/types";

export const authApi = api.injectEndpoints({
	endpoints: (builder) => ({
		login: builder.mutation<IUser, { email: string; password: string }>({
			query: (body) => ({ url: "/auth/login", method: "POST", body }),
			invalidatesTags: ["Auth"],
		}),
		register: builder.mutation<IUser, RegisterPayload>({
			query: (body) => ({ url: "/auth/register", method: "POST", body }),
			invalidatesTags: ["Auth"],
		}),
		me: builder.query<IUser | null, void>({
			query: () => "/auth/me",
			providesTags: ["Auth"],
		}),
	}),
});

export const { useLoginMutation, useRegisterMutation, useMeQuery } = authApi;
