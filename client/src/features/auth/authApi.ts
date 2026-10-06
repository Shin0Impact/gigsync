import { api } from "../../shared/api";
import { ArtistCategory, IUserRecord, UserRole } from "@shared/types/index";

export interface RegisterInput {
	email: string;
	password: string;
	role: UserRole;
	user_name: string;
	artists_type?: ArtistCategory | null;
}

export interface LoginInput {
	identifier: string;
	password: string;
}

export const authApi = api.injectEndpoints({
	endpoints: (builder) => ({
		login: builder.mutation<IUserRecord, LoginInput>({
			query: (body) => ({ url: "/api/auth/login", method: "POST", body }),
			invalidatesTags: ["Auth"],
		}),
		register: builder.mutation<IUserRecord, RegisterInput>({
			query: (body) => ({ url: "/api/auth/register", method: "POST", body }),
			invalidatesTags: ["Auth"],
		}),
		me: builder.query<IUserRecord | null, void>({
			query: () => "/api/auth/me",
			providesTags: ["Auth"],
		}),
	}),
});

export const { useLoginMutation, useRegisterMutation, useMeQuery } = authApi;
