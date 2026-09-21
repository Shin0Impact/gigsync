import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Real-time-only slice: tracks live 'emergency_status_changed' pushes by
// artistId, decoupled from search results (those are REST-fetchable and
// belong behind an RTK Query artistsApi.ts once /api/artists/search and
// /api/artists/emergency-available exist - see board #24/#25). Once that
// endpoint exists, prefer patching its cache directly via
// api.util.updateQueryData('searchArtists', arg, (draft) => {...}) from
// this same socket handler instead of this slice, so live updates and
// fetched data share one source of truth. Until then, components combine
// a search query's results with this slice's overrides to reflect live
// status without a refetch.
interface PresenceState {
  emergencyByArtistId: Record<string, boolean>;
}

const initialState: PresenceState = {
  emergencyByArtistId: {},
};

const presenceSlice = createSlice({
  name: 'presence',
  initialState,
  reducers: {
    emergencyStatusChanged(
      state,
      action: PayloadAction<{ artistId: string; isEmergencyAvailable: boolean }>
    ) {
      state.emergencyByArtistId[action.payload.artistId] = action.payload.isEmergencyAvailable;
    },
  },
});

export const { emergencyStatusChanged } = presenceSlice.actions;
export default presenceSlice.reducer;
