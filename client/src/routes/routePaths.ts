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

	EVENTS: "/events",
	SEARCH: "/search",
	VERIFICATION: "/verification",
	NOTIFICATIONS: "/notifications",

	SINGLE_PIECE_PATTERN: "/pieces/:id",
	SINGLE_PIECE: (id: string | number) => `/pieces/${id}`,

	// Profile is the single hub for a user's own (or anyone else's) pieces
	// and portfolio - see ProfilePage.tsx. Studio (/dashboard), /pieces,
	// /portfolio and /:userId/portfolio used to be separate pages/routes
	// for slices of this same data; they're gone now.
	PROFILE: (username: string) => `/${username}`,
	PROFILE_PATTERN: "/:username",

	USER_PIECES: (username: string) => `/${username}/pieces`,
	USER_EVENTS: (username: string) => `/${username}/events`,

	CREATE_PIECE: "/pieces/new",
	CREATE_INTERMEZZO: "/intermezzi/new",
	CREATE_PORTFOLIO_SECTION: "/portfolio/new",
} as const;
