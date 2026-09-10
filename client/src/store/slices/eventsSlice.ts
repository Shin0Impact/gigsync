import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IEvent } from '../../types';

interface EventsState {
  eventList: IEvent[];
  selectedEvent: IEvent | null;
}

const initialState: EventsState = {
  eventList: [],
  selectedEvent: null,
};

// TODO (Dev 1): wire up createAsyncThunk calls into /api/events.
const eventsSlice = createSlice({
  name: 'events',
  initialState,
  reducers: {
    setEventList(state, action: PayloadAction<IEvent[]>) {
      state.eventList = action.payload;
    },
    setSelectedEvent(state, action: PayloadAction<IEvent | null>) {
      state.selectedEvent = action.payload;
    },
  },
});

export const { setEventList, setSelectedEvent } = eventsSlice.actions;
export default eventsSlice.reducer;
