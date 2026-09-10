import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IArtistProfile } from '../../types';

interface ArtistsState {
  searchResults: IArtistProfile[];
  emergencyArtists: IArtistProfile[];
  selectedCategory: string | null;
  loading: boolean;
}

const initialState: ArtistsState = {
  searchResults: [],
  emergencyArtists: [],
  selectedCategory: null,
  loading: false,
};

// TODO (Dev 2): wire up createAsyncThunk calls into
// /api/artists/search and /api/artists/emergency-available.
const artistsSlice = createSlice({
  name: 'artists',
  initialState,
  reducers: {
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setSearchResults(state, action: PayloadAction<IArtistProfile[]>) {
      state.searchResults = action.payload;
    },
    setEmergencyArtists(state, action: PayloadAction<IArtistProfile[]>) {
      state.emergencyArtists = action.payload;
    },
    setSelectedCategory(state, action: PayloadAction<string | null>) {
      state.selectedCategory = action.payload;
    },
  },
});

export const { setLoading, setSearchResults, setEmergencyArtists, setSelectedCategory } =
  artistsSlice.actions;
export default artistsSlice.reducer;
