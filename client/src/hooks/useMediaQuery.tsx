// hooks/useMediaQuery.ts
import { useState, useEffect } from "react";

export function useMediaQuery(query: string): boolean {
	const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

	useEffect(() => {
		const mediaQuery = window.matchMedia(query);
		const handler = (event: MediaQueryListEvent) => setMatches(event.matches);

		// Modern browsers
		mediaQuery.addEventListener("change", handler);
		setMatches(mediaQuery.matches);

		return () => mediaQuery.removeEventListener("change", handler);
	}, [query]);

	return matches;
}
