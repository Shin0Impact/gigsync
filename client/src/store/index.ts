import { configureStore } from '@reduxjs/toolkit';
import artistsReducer from './slices/artistsSlice';
import authReducer from './slices/authSlice';
import chatReducer from './slices/chatSlice';
import eventsReducer from './slices/eventsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    artists: artistsReducer,
    events: eventsReducer,
    chat: chatReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
