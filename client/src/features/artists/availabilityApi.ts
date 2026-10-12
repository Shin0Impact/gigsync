import { AddAvailabilityResponse, ListAvailabilityResponse } from "@shared/types/index";
import { api } from "../../shared/api";

// Card #26 - the availability calendar tab on an artist's profile.
//
// addAvailabilityDate/removeAvailabilityDate are deliberately one call
// per day rather than a "save the whole month" bulk mutation -
// AvailabilityCalendar.tsx already knows exactly which single day was
// tapped (react-day-picker's onSelect hands back the triggering date),
// so there's no reason to round-trip the rest of the month just to
// toggle one cell. Both invalidate the same "Availability" tag as the
// list query, keyed by userId, so the calendar (owner's edits) and
// anyone else viewing that profile's tab both stay in sync with a
// refetch rather than hand-patching the cache.
export const availabilityApi = api.injectEndpoints({
	endpoints: (builder) => ({
		getAvailability: builder.query<ListAvailabilityResponse, string>({
			query: (userId) => `/api/artists/${userId}/availability`,
			providesTags: (_result, _error, userId) => [{ type: "Availability", id: userId }],
		}),

		addAvailabilityDate: builder.mutation<AddAvailabilityResponse, { userId: string; date: string }>({
			query: ({ date }) => ({
				url: "/api/artists/me/availability",
				method: "POST",
				body: { date },
			}),
			invalidatesTags: (_result, _error, { userId }) => [{ type: "Availability", id: userId }],
		}),

		removeAvailabilityDate: builder.mutation<{ success: true }, { userId: string; date: string }>({
			query: ({ date }) => ({
				url: `/api/artists/me/availability/${date}`,
				method: "DELETE",
			}),
			invalidatesTags: (_result, _error, { userId }) => [{ type: "Availability", id: userId }],
		}),
	}),
});

export const { useGetAvailabilityQuery, useAddAvailabilityDateMutation, useRemoveAvailabilityDateMutation } =
	availabilityApi;
