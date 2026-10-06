import { api } from "../../shared/api";
import { IUserRecord } from "@shared/types/index";
import { LoginInput, RegisterInput } from "@shared/services/auth.service";

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
