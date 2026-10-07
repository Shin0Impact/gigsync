import { api } from "../../shared/api";
import { ArtistCategory, UserRole } from "@shared/types/index";

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

// Extracted and centralized database record types matching your backend models
export interface DbUser {
	id: string;
	email: string;
	created_at: Date;
	updated_at: Date;
}

export interface DbRole {
	user_id: string;
	role: UserRole;
	created_at: Date;
}

export interface DbProfile {
	id: number;
	created_at: Date;
	user_name: string;
	user_id: string;
	avatar_url: string | null;
	followers_number: number;
	artists_type: string | null;
}

export interface RegisterResponse {
	user: DbUser;
	role: DbRole;
	profile: DbProfile;
}

export interface LoginResponse {
	user: DbUser;
	role: DbRole;
	[key: string]: any;
}

export interface AuthTokenPayload {
	userId: string;
	role: UserRole;
}

export interface MeResponse {
	user: AuthTokenPayload | null;
}

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
		me: builder.query<MeResponse, void>({
			query: () => "/api/auth/me",
			providesTags: ["Auth"],
		}),
	}),
});

export const { useLoginMutation, useRegisterMutation, useMeQuery } = authApi;
