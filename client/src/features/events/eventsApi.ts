import {
	ApplyToEventResponse,
	GetEventResponse,
	ListEventsResponse,
	ListMyApplicationsResponse,
	ListApplicationsResponse,
	UpdateApplicationResponse,
	CreateEventResponse,
	UpdateEventResponse,
	CreateEventInput,
	UpdateEventInput,
	ApplicationStatus,
} from "@shared/types/index";
import { api } from "../../shared/api";

export interface ListEventsParams {
	status?: string;
	organizerId?: string;
	category?: string;
	q?: string;
	urgent?: boolean;
	sort?: "date" | "newest" | "title" | "distance";
	lat?: number;
	lng?: number;
	radiusKm?: number;
}

export const eventsApi = api.injectEndpoints({
	endpoints: (builder) => ({
		// 1. List events (with optional filtering params)
		listEvents: builder.query<ListEventsResponse, ListEventsParams | void>({
			query: (params) => {
				const search = new URLSearchParams();
				if (params?.status) search.set("status", params.status);
				if (params?.organizerId) search.set("organizerId", params.organizerId);
				if (params?.category) search.set("category", params.category);
				if (params?.q) search.set("q", params.q);
				if (params?.urgent) search.set("urgent", "true");
				if (params?.sort) search.set("sort", params.sort);
				if (params?.lat !== undefined && params?.lng !== undefined) {
					search.set("lat", String(params.lat));
					search.set("lng", String(params.lng));
					if (params.radiusKm !== undefined) search.set("radiusKm", String(params.radiusKm));
				}
				const qs = search.toString();
				return `/api/events${qs ? `?${qs}` : ""}`;
			},
			providesTags: [{ type: "Event", id: "LIST" }],
		}),

		// 2. Get single event by ID[cite: 6]
		getEvent: builder.query<GetEventResponse, number | string>({
			query: (id) => `/api/events/${id}`,
			providesTags: (_result, _error, id) => [{ type: "Event", id }],
		}),

		// 3. Create event (Organizer only)[cite: 6]
		createEvent: builder.mutation<CreateEventResponse, CreateEventInput>({
			query: (body) => ({
				url: "/api/events",
				method: "POST",
				body,
			}),
			invalidatesTags: [{ type: "Event", id: "LIST" }],
		}),

		// 4. Update event by ID (Organizer only)[cite: 6]
		updateEvent: builder.mutation<UpdateEventResponse, { id: number | string; data: UpdateEventInput }>({
			query: ({ id, data }) => ({
				url: `/api/events/${id}`,
				method: "PATCH",
				body: data,
			}),
			invalidatesTags: (_result, _error, { id }) => [
				{ type: "Event", id },
				{ type: "Event", id: "LIST" },
			],
		}),

		// 5. Delete event by ID (Organizer only)[cite: 6]
		deleteEvent: builder.mutation<void, number | string>({
			query: (id) => ({
				url: `/api/events/${id}`,
				method: "DELETE",
			}),
			invalidatesTags: [{ type: "Event", id: "LIST" }],
		}),

		// 6. Apply to event (Artist only)[cite: 6]
		applyToEvent: builder.mutation<ApplyToEventResponse, { eventId: number | string; coverNote?: string }>({
			query: ({ eventId, coverNote }) => ({
				url: `/api/events/${eventId}/apply`,
				method: "POST",
				body: coverNote ? { coverNote } : {},
			}),
			invalidatesTags: (_result, _error, { eventId }) => [
				{ type: "Event", id: eventId },
				{ type: "Application", id: "LIST" },
			],
		}),

		// 7. List applications for a specific event (Organizer only)[cite: 6]
		listEventApplications: builder.query<ListApplicationsResponse, number | string>({
			query: (eventId) => `/api/events/${eventId}/applications`,
			providesTags: (_result, _error, eventId) => [{ type: "Application", id: `EVENT_${eventId}` }],
		}),

		// 8. Update application status (Organizer only)[cite: 6]
		updateApplicationStatus: builder.mutation<
			UpdateApplicationResponse,
			{ eventId: number | string; appId: string; status: ApplicationStatus }
		>({
			query: ({ eventId, appId, status }) => ({
				url: `/api/events/${eventId}/applications/${appId}`,
				method: "PATCH",
				body: { status },
			}),
			invalidatesTags: (_result, _error, { eventId }) => [
				{ type: "Application", id: `EVENT_${eventId}` },
				{ type: "Application", id: "LIST" },
			],
		}),

		// 9. List artist's own submitted applications[cite: 6]
		listMyApplications: builder.query<ListMyApplicationsResponse, void>({
			query: () => "/api/events/applications/mine",
			providesTags: [{ type: "Application", id: "LIST" }],
		}),

		// Attach an already-uploaded R2 object to an event (organizer only)
		addEventMedia: builder.mutation<
			unknown,
			{ eventId: number | string; mediaType: "image" | "video"; objectKey: string; altText?: string | null; sortOrder?: number }
		>({
			query: ({ eventId, ...body }) => ({ url: `/api/events/${eventId}/media`, method: "POST", body }),
			invalidatesTags: (_result, _error, { eventId }) => [
				{ type: "Event", id: eventId },
				{ type: "Event", id: "LIST" },
			],
		}),

		// 10. Photos / videos attached to an event (public)
		listEventMedia: builder.query<
			{ media: { id: string; media_type: string; object_key: string; alt_text: string | null }[] },
			number | string
		>({
			query: (eventId) => `/api/events/${eventId}/media`,
			providesTags: (_result, _error, eventId) => [{ type: "Event", id: eventId }],
		}),
	}),
});

export const {
	useListEventsQuery,
	useGetEventQuery,
	useCreateEventMutation,
	useUpdateEventMutation,
	useDeleteEventMutation,
	useApplyToEventMutation,
	useListEventApplicationsQuery,
	useUpdateApplicationStatusMutation,
	useListMyApplicationsQuery,
	useListEventMediaQuery,
	useAddEventMediaMutation,
} = eventsApi;
