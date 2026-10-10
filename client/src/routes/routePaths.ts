export const ROUTES = {
	HOME: "/",
	LOGIN: "/login",
	SIGNUP: "/signup",
	ONBOARDING: "/onboarding",
	TIMELINE: "/timeline",
	TIMELINE_PIECES: "/timeline/pieces",
	TIMELINE_EVENTS: "/timeline/events",
	DISCOVERY: "/discovery",
	DISCOVERY_PIECES: "/discovery/pieces",
	DISCOVERY_EVENTS: "/discovery/events",

	STUDIO: "/studio",
	DASHBOARD: "/dashboard",
	PIECES: "/pieces",
	PORTFOLIO: "/portfolio",
	EVENTS: "/events",
	VERIFICATION: "/verification",

	SINGLE_PIECE_PATTERN: "/pieces/:id",
	SINGLE_PIECE: (id: string | number) => `/pieces/${id}`,

	PROFILE: (username: string) => `/${username}`,

	USER_PORTFOLIO_PATTERN: "/:userId/portfolio",
	USER_PORTFOLIO: (userId: string) => `/${userId}/portfolio`,

	USER_PIECES: (username: string) => `/${username}/pieces`,
	USER_EVENTS: (username: string) => `/${username}/events`,

	CREATE_PIECE: "/pieces/new",
	CREATE_INTERMEZZO: "/intermezzi/new",
	CREATE_PORTFOLIO_SECTION: "/portfolio/new",
} as const;
