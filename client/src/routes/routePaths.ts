export const ROUTES = {
	HOME: "/",
	LOGIN: "/login",
	SIGNUP: "/signup",
	ONBOARDING: "/onboarding",
	FOLLOWING: "/following",
	FOLLOWING_PIECES: "/following/pieces",
	FOLLOWING_EVENTS: "/following/events",
	EXPLORE: "/explore",
	EXPLORE_PIECES: "/explore/pieces",
	EXPLORE_EVENTS: "/explore/events",

	DASHBOARD: "/dashboard",
	PIECES: "/pieces",
	portfolio: "/portfolio",
	EVENTS: "/events",
	VERIFICATION: "/verification",

	SINGLE_PIECE: (id: string) => `/pieces/${id}`,

	PROFILE: (username: string) => `/${username}`,
	PORTFOLIO: (username: string) => `/${username}/portfolio`,
	USER_PIECES: (username: string) => `/${username}/pieces`,
	USER_EVENTS: (username: string) => `/${username}/events`,
} as const;
