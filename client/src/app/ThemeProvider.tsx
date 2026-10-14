import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "gigsync:theme";

interface ThemeContextValue {
	theme: Theme;
	toggleTheme: () => void;
	setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

// Light is the default regardless of the OS/browser's own
// prefers-color-scheme - previously the whole site just mirrored
// whatever the system was set to via CSS light-dark(), with no toggle
// and no way to override it, so a user on a dark-mode system landed in
// dark mode with zero control over it. index.html's inline script reads
// this same key before React mounts, so there's no flash of the wrong
// theme on first paint.
function readStoredTheme(): Theme {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored === "light" || stored === "dark") return stored;
	} catch {
		// localStorage can throw in locked-down/private browsing contexts -
		// fall through to the default below instead of crashing the app.
	}
	return "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
	const [theme, setThemeState] = useState<Theme>(readStoredTheme);

	useEffect(() => {
		document.documentElement.setAttribute("data-theme", theme);
		try {
			localStorage.setItem(STORAGE_KEY, theme);
		} catch {
			// Theme still applies for this page load either way - it just
			// won't be remembered on the next one.
		}
	}, [theme]);

	return (
		<ThemeContext.Provider
			value={{
				theme,
				setTheme: setThemeState,
				toggleTheme: () => setThemeState((current) => (current === "light" ? "dark" : "light")),
			}}>
			{children}
		</ThemeContext.Provider>
	);
}

export function useTheme() {
	const ctx = useContext(ThemeContext);
	if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
	return ctx;
}
