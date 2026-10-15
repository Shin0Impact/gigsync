export const ROUTES = {
	HOME: "/",
	LOGIN: "/login",
	SIGNUP: "/signup",
	ONBOARDING: "/onboarding",

	// ======== FEED =========

	TIMELINE: "/timeline",
	TIMELINE_PIECES: "/timeline/pieces",
	TIMELINE_EVENTS: "/timeline/events",
	DISCOVERY: "/discovery",
	DISCOVERY_PIECES: "/discovery/pieces",
	DISCOVERY_EVENTS: "/discovery/events",

	SEARCH: "/search",
	SEARCH_EVENTS: "/search/events",
	SEARCH_PEOPLE: "/search/people",
	SETTINGS: "/settings",
	VERIFICATION: "/verification",

	INBOX: "/inbox",
	NOTIFICATIONS: "/inbox/notifications",
	MESSAGES: "/inbox/messages",

	MESSAGE_THREAD_PATTERN: "/inbox/messages/:conversationId",
	MESSAGE_THREAD: (conversationId: string) => `/inbox/messages/${conversationId}`,

	// ======== SELF =========

	MY_PIECES: "/pieces",
	MY_EVENTS: "/events",

	// ======== ON AIR =========

	// opens the Availability tab on the artist's own profile
	AVAILABILITY: (username: string) => `/${username}?tab=availability`,

	// ======== PROFILE ========

	PROFILE: (username: string) => `/${username}`,
	PROFILE_PATTERN: "/:username",

	USER_PIECES: (username: string) => `/${username}/pieces`,
	USER_PIECES_PATTERN: "/:username/pieces",
	USER_PORTFOLIO: (username: string) => `/${username}/portfolio`,
	USER_PORTFOLIO_PATTERN: "/:username/portfolio",
	USER_EVENTS: (username: string) => `/${username}/events`,
	USER_EVENTS_PATTERN: "/:username/events",

	SINGLE_PIECE_PATTERN: "/pieces/:id",
	SINGLE_PIECE: (id: string | number) => `/pieces/${id}`,

	SINGLE_INTERMEZZO_PATTERN: "/pieces/:id/:version",
	SINGLE_INTERMEZZO: (id: string | number, version: string | number) => `/pieces/${id}/${version}`,

	SINGLE_EVENT_PATTERN: "/events/:id",
	SINGLE_EVENT: (id: string | number) => `/events/${id}`,

	EVENT_APPLICATIONS_PATTERN: "/events/:id/applications",
	EVENT_APPLICATIONS: (id: string | number) => `/events/:id/${id}`,

	CREATE_PIECE: "/pieces/new",
	CREATE_INTERMEZZO: "/intermezzi/new",
	CREATE_PORTFOLIO_SECTION: "/portfolio/new",
	CREATE_EVENT: "events/new",
} as const;
