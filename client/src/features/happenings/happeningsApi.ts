import {
	CreateEventInput,
	UpdateEventInput,
	CreateEventResponse,
	ListEventsResponse,
	GetEventResponse,
	UpdateEventResponse,
	ApplyToEventResponse,
	ListApplicationsResponse,
	UpdateApplicationResponse,
	ApplicationStatus,
	AddEventMediaInput,
	AddEventMediaResponse,
	ListEventMediaResponse,
} from "@shared/types/index";
import { api } from "../../shared/api";

export interface ListHappeningsQueryParams {
	status?: string;
	organizerId?: string;
	category?: string;
}

export interface UpdateApplicationParams {
	happeningId: number | string;
	appId: string;
	status: ApplicationStatus;
}

export interface AddHappeningMediaParams {
	happeningId: number | string;
	body: AddEventMediaInput;
}

export interface DeleteHappeningMediaParams {
	happeningId: number | string;
	mediaId: number | string;
}

export const happeningsApi = api.injectEndpoints({
	endpoints: (builder) => ({
		createHappening: builder.mutation<CreateEventResponse, CreateEventInput>({
			query: (body) => ({
				url: "/api/events",
				method: "POST",
				body,
			}),
			invalidatesTags: [{ type: "Happening", id: "LIST" }],
		}),

		listHappenings: builder.query<ListEventsResponse, ListHappeningsQueryParams | void>({
			query: (params) => ({
				url: "/api/events",
				params: params ?? undefined,
			}),
			providesTags: (result) =>
				result
					? [
							...result.events.map(({ id }) => ({ type: "Happening" as const, id })),
							{ type: "Happening", id: "LIST" },
						]
					: [{ type: "Happening", id: "LIST" }],
		}),

		getHappeningById: builder.query<GetEventResponse, number | string>({
			query: (id) => `/api/events/${id}`,
			providesTags: (_result, _error, id) => [{ type: "Happening", id }],
		}),

		updateHappening: builder.mutation<UpdateEventResponse, { id: number | string; body: UpdateEventInput }>({
			query: ({ id, body }) => ({
				url: `/api/events/${id}`,
				method: "PATCH",
				body,
			}),
			invalidatesTags: (_result, _error, { id }) => [
				{ type: "Happening", id },
				{ type: "Happening", id: "LIST" },
			],
		}),

		deleteHappening: builder.mutation<void, number | string>({
			query: (id) => ({
				url: `/api/events/${id}`,
				method: "DELETE",
			}),
			invalidatesTags: (_result, _error, id) => [
				{ type: "Happening", id },
				{ type: "Happening", id: "LIST" },
			],
		}),

		// --- APPLICATIONS ---

		applyToHappening: builder.mutation<ApplyToEventResponse, { happeningId: number | string; coverNote?: string }>({
			query: ({ happeningId, coverNote }) => ({
				url: `/api/events/${happeningId}/apply`,
				method: "POST",
				body: { coverNote },
			}),
			invalidatesTags: (_result, _error, { happeningId }) => [
				{ type: "Happening", id: happeningId },
				{ type: "HappeningApplication", id: `LIST_${happeningId}` },
			],
		}),

		listHappeningApplications: builder.query<ListApplicationsResponse, number | string>({
			query: (happeningId) => `/api/events/${happeningId}/applications`,
			providesTags: (_result, _error, happeningId) => [{ type: "HappeningApplication", id: `LIST_${happeningId}` }],
		}),

		updateHappeningApplication: builder.mutation<UpdateApplicationResponse, UpdateApplicationParams>({
			query: ({ happeningId, appId, status }) => ({
				url: `/api/events/${happeningId}/applications/${appId}`,
				method: "PATCH",
				body: { status },
			}),
			invalidatesTags: (_result, _error, { happeningId }) => [
				{ type: "HappeningApplication", id: `LIST_${happeningId}` },
			],
		}),

		// --- HAPPENING MEDIA ---

		addHappeningMedia: builder.mutation<AddEventMediaResponse, AddHappeningMediaParams>({
			query: ({ happeningId, body }) => ({
				url: `/api/events/${happeningId}/media`,
				method: "POST",
				body,
			}),
			invalidatesTags: (_result, _error, { happeningId }) => [{ type: "HappeningMedia", id: happeningId }],
		}),

		listHappeningMedia: builder.query<ListEventMediaResponse, number | string>({
			query: (happeningId) => `/api/events/${happeningId}/media`,
			providesTags: (_result, _error, happeningId) => [{ type: "HappeningMedia", id: happeningId }],
		}),

		deleteHappeningMedia: builder.mutation<void, DeleteHappeningMediaParams>({
			query: ({ happeningId, mediaId }) => ({
				url: `/api/events/${happeningId}/media/${mediaId}`,
				method: "DELETE",
			}),
			invalidatesTags: (_result, _error, { happeningId }) => [{ type: "HappeningMedia", id: happeningId }],
		}),
	}),
});

export const {
	useCreateHappeningMutation,
	useListHappeningsQuery,
	useGetHappeningByIdQuery,
	useUpdateHappeningMutation,
	useDeleteHappeningMutation,
	useApplyToHappeningMutation,
	useListHappeningApplicationsQuery,
	useUpdateHappeningApplicationMutation,
	useAddHappeningMediaMutation,
	useListHappeningMediaQuery,
	useDeleteHappeningMediaMutation,
} = happeningsApi;
