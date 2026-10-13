import { PlusIcon } from "../../assets/icons";
import styles from "./FloatingActionButton.module.css";

interface FloatingActionButtonProps {
	isOpen: boolean;
	setDrawerOpen: () => void;
	createHoverText?: string;
	closeHoverText?: string;
}

function FloatingActionButton({
	isOpen,
	setDrawerOpen,
	createHoverText = "Create",
	closeHoverText = "Close",
}: FloatingActionButtonProps) {
	const currentHoverText = isOpen ? closeHoverText : createHoverText;

	return (
		<button
			type="button"
			className={`${styles.fab} ${isOpen ? styles.isOpen : ""}`}
			onClick={setDrawerOpen}
			aria-label={currentHoverText}
			data-hover-text={currentHoverText}>
			<PlusIcon className={`${styles.icon} ${isOpen ? styles.isOpen : ""}`} />
			<span className={styles.label}>{isOpen ? "Close" : "Create"}</span>
		</button>
	);
}

export default FloatingActionButton;
