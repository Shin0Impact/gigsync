import { ArtistSearchResult, ListArtistsSearchResponse, ArtistCategory } from "@shared/types/index";
import { api } from "../../shared/api";

export interface SearchArtistsParams {
	lat: number;
	lng: number;
	radiusKm: number;
	artistsType?: ArtistCategory | null;
}

export const artistsApi = api.injectEndpoints({
	endpoints: (builder) => ({
		// GET /api/artists/search - card #24. Centered on whatever location
		// the picker (LocationPicker.tsx) is set to; artistsType is optional.
		// No tag plumbing here yet - nothing in this app currently mutates an
		// artist's own location/category, so there's nothing to invalidate
		// this on. If that changes, or once the emergency-status socket
		// event (see presenceSlice.ts) should patch these results live
		// instead of/alongside that slice, this is the query to target with
		// api.util.updateQueryData("searchArtists", arg, (draft) => {...}).
		searchArtists: builder.query<ListArtistsSearchResponse, SearchArtistsParams>({
			query: ({ lat, lng, radiusKm, artistsType }) => {
				const search = new URLSearchParams({
					lat: String(lat),
					lng: String(lng),
					radius_km: String(radiusKm),
				});
				if (artistsType) search.set("artists_type", artistsType);
				return `/api/artists/search?${search.toString()}`;
			},
		}),
	}),
});

export const { useSearchArtistsQuery } = artistsApi;
export type { ArtistSearchResult };
