import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { store } from "./app/store";
import { ThemeProvider } from "./app/ThemeProvider";
import "./styles/index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
	<React.StrictMode>
		<Provider store={store}>
			{/* Opts into the two v7 behaviors React Router was warning about in
			   the console on every page (v7_startTransition, v7_relativeSplatPath)
			   - both are forward-compatible preview flags, not breaking changes, so
			   this silences the warnings now instead of waiting for a v7 upgrade. */}
			<BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
				<ThemeProvider>
					<App />
				</ThemeProvider>
			</BrowserRouter>
		</Provider>
	</React.StrictMode>,
);
