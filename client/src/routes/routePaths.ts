export const ROUTES = {
	HOME: "/",
	LOGIN: "/login",
	SIGNUP: "/signup",
	ONBOARDING: "/onboarding",
	FEED: "/feed",
	PROJECT: (id: string) => `/project/${id}`,
	PORTFOLIO: (username: string) => `/portfolio/${username}`,
} as const;
