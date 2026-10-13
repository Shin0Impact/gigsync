export const ROUTES = {
	HOME: "/",
	LOGIN: "/login",
	SIGNUP: "/signup",
	ONBOARDING: "/onboarding",

	// ======== FEED =========

	TIMELINE: "/timeline",
	TIMELINE_PIECES: "/timeline/pieces",
	TIMELINE_HAPPENINGS: "/timeline/happenings",
	DISCOVERY: "/discovery",
	DISCOVERY_PIECES: "/discovery/pieces",
	DISCOVERY_HAPPENINGS: "/discovery/happenings",

	SEARCH: "/search",
	VERIFICATION: "/verification",
	NOTIFICATIONS: "/notifications",

	// ======== SELF =========

	MY_PIECES: "/pieces",
	MY_HAPPENINGS: "/happenings",
	MY_APPLICATIONS: "/happenings/applications",

	// ======== ON AIR =========

	ON_AIR: "/on-air",

	SINGLE_PIECE_PATTERN: "/pieces/:id",
	SINGLE_PIECE: (id: string | number) => `/pieces/${id}`,

	SINGLE_INTERMEZZO_PATTERN: "/pieces/:id/:version",
	SINGLE_INTERMEZZO: (id: string | number, version: string | number) => `/pieces/${id}/${version}`,

	CREATE_PIECE: "/pieces/new",
	CREATE_INTERMEZZO: "/intermezzi/new",
	CREATE_PORTFOLIO_SECTION: "/portfolio/new",
	CREATE_HAPPENING: "happenings/new",
} as const;
