import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export type DrawerMode = { type: "create-intermezzo" } | { type: "create-happening" };

export const DRAWER_FORM_ID = "drawer-form";

interface DrawerContextValue {
	mode: DrawerMode | null;
	isOpen: boolean;
	isSubmitting: boolean;
	openDrawer: (mode: DrawerMode) => void;
	closeDrawer: () => void;
	// The open form reports its busy state here so the floating button can
	// disable itself while a request is in flight.
	setSubmitting: (value: boolean) => void;
}

const DrawerContext = createContext<DrawerContextValue | null>(null);

export function DrawerProvider({ children }: { children: ReactNode }) {
	const [mode, setMode] = useState<DrawerMode | null>(null);
	const [isSubmitting, setSubmitting] = useState(false);

	const openDrawer = useCallback((next: DrawerMode) => setMode(next), []);
	const closeDrawer = useCallback(() => {
		setMode(null);
		setSubmitting(false);
	}, []);

	const value = useMemo(
		() => ({ mode, isOpen: mode !== null, isSubmitting, openDrawer, closeDrawer, setSubmitting }),
		[mode, isSubmitting, openDrawer, closeDrawer],
	);

	return <DrawerContext.Provider value={value}>{children}</DrawerContext.Provider>;
}

export function useDrawer() {
	const ctx = useContext(DrawerContext);
	if (!ctx) throw new Error("useDrawer must be used inside <DrawerProvider>");
	return ctx;
}
