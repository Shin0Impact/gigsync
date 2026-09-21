import { configureStore } from "@reduxjs/toolkit";
import { api } from "../shared/api";

export const store = configureStore({
	reducer: {
		[api.reducerPath]: api.reducer,
	},
	middleware: (getDefault) => getDefault().concat(api.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
