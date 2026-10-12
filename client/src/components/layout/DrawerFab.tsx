import { createPortal } from "react-dom";
import styles from "./DrawerFab.module.css";
import { DRAWER_FORM_ID, useDrawer } from "../../features/pieces";

interface DrawerFabProps {
	role: "creative" | "supporter" | "organizer" | "guest";
}

export function DrawerFab({ role }: DrawerFabProps) {
	const { mode, isOpen, isSubmitting, openDrawer } = useDrawer();

	const isHappening = role === "organizer";

	// Two separately-keyed buttons on purpose: the "open" click can then never
	// double as a submit, because that button is gone by the time the browser
	// runs the click's default action. Same fixed position, new meaning.
	const button = isOpen ? (
		<button
			key="submit"
			type="submit"
			form={DRAWER_FORM_ID}
			className={`${styles.fab} ${styles.submit}`}
			disabled={isSubmitting}>
			{isSubmitting ? "Saving…" : mode?.type === "create-happening" ? "Create happening" : "Add intermezzo"}
		</button>
	) : (
		<button
			key="open"
			type="button"
			className={styles.fab}
			onClick={() => openDrawer(isHappening ? { type: "create-happening" } : { type: "create-intermezzo" })}
			aria-label={isHappening ? "New happening" : "New intermezzo"}>
			+
		</button>
	);

	// Portaled to <body> alongside the drawer so it shares one stacking
	// context with it and can sit above the panel.
	return createPortal(button, document.body);
}
