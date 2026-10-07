import {
	LoginInput,
	LoginResponse,
	RegisterResponse,
	RegisterInput,
	MeResponse,
	RefreshResponse,
} from "@shared/types/index";
import { api } from "../../shared/api";

export const authApi = api.injectEndpoints({
	endpoints: (builder) => ({
		login: builder.mutation<LoginResponse, LoginInput>({
			query: (body) => ({ url: "/api/auth/login", method: "POST", body }),
			invalidatesTags: ["Auth"],
		}),
		register: builder.mutation<RegisterResponse, RegisterInput>({
			query: (body) => ({ url: "/api/auth/register", method: "POST", body }),
			invalidatesTags: ["Auth"],
		}),
		logout: builder.mutation<void, void>({
			query: () => ({ url: "/api/auth/logout", method: "POST" }),
			invalidatesTags: ["Auth"],
		}),
		refresh: builder.mutation<RefreshResponse, void>({
			query: () => ({ url: "/api/auth/refresh", method: "POST" }),
		}),
		me: builder.query<MeResponse, void>({
			query: () => "/api/auth/me",
			providesTags: ["Auth"],
		}),
	}),
});

export const {
	useLoginMutation,
	useRegisterMutation,
	useLogoutMutation,
	useRefreshMutation,
	useMeQuery,
} = authApi;
