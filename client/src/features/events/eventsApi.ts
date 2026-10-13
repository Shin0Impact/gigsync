import { ApplyToEventResponse, GetEventResponse, ListEventsResponse, ListMyApplicationsResponse } from "@shared/types/index";
import { api } from "../../shared/api";

export interface ListEventsParams {
	status?: string;
	organizerId?: string;
	category?: string;
}

export const eventsApi = api.injectEndpoints({
	endpoints: (builder) => ({
		listEvents: builder.query<ListEventsResponse, ListEventsParams | void>({
			query: (params) => {
				const search = new URLSearchParams();
				if (params?.status) search.set("status", params.status);
				if (params?.organizerId) search.set("organizerId", params.organizerId);
				if (params?.category) search.set("category", params.category);
				const qs = search.toString();
				return `/api/events${qs ? `?${qs}` : ""}`;
			},
			providesTags: [{ type: "Event", id: "LIST" }],
		}),

		getEvent: builder.query<GetEventResponse, number | string>({
			query: (id) => `/api/events/${id}`,
			providesTags: (_result, _error, id) => [{ type: "Event", id }],
		}),

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

		listMyApplications: builder.query<ListMyApplicationsResponse, void>({
			query: () => "/api/events/applications/mine",
			providesTags: [{ type: "Application", id: "LIST" }],
		}),
	}),
});

export const { useListEventsQuery, useGetEventQuery, useApplyToEventMutation, useListMyApplicationsQuery } = eventsApi;
