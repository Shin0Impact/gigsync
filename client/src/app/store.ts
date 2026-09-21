import { configureStore } from "@reduxjs/toolkit";
import { api } from "../shared/api";
import chatReducer from "../features/chat/chatSlice";
import presenceReducer from "../features/artists/presenceSlice";

export const store = configureStore({
	reducer: {
		[api.reducerPath]: api.reducer,
		chat: chatReducer,
		presence: presenceReducer,
	},
	middleware: (getDefault) => getDefault().concat(api.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
