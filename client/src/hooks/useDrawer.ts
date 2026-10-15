import { useSearchParams } from "react-router-dom";

export function useDrawer() {
	const [searchParams, setSearchParams] = useSearchParams();
	const isDrawerOpen = searchParams.get("drawer") === "open";

	const toggleDrawer = (options?: { openParams?: Record<string, string>; keysToDeleteOnClose?: string[] }) => {
		const keysToDelete = options?.keysToDeleteOnClose ?? [];
		const openParams = options?.openParams;

		setSearchParams(
			(prev) => {
				const newParams = new URLSearchParams(prev);
				if (isDrawerOpen) {
					newParams.delete("drawer");
					newParams.delete("form");
					keysToDelete.forEach((key) => newParams.delete(key));
				} else {
					newParams.set("drawer", "open");
					if (openParams) {
						Object.entries(openParams).forEach(([key, value]) => {
							newParams.set(key, value);
						});
					}
				}
				return newParams;
			},
			{ replace: true },
		);
	};

	return { isDrawerOpen, toggleDrawer };
}
