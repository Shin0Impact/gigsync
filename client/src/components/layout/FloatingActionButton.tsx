import { useState, useRef } from "react";
import { PlusIcon } from "../../assets/icons";
import styles from "./FloatingActionButton.module.css";

interface FloatingActionButtonProps {
	isOpen: boolean;
	setDrawerOpen: () => void;
	createHoverText?: string;
	closeHoverText?: string;
}

const LINGER_DURATION = 200;

function FloatingActionButton({
	isOpen,
	setDrawerOpen,
	createHoverText = "Create",
	closeHoverText = "Close",
}: FloatingActionButtonProps) {
	const [isLingeringHover, setIsLingeringHover] = useState(false);

	// Use `number | null` for browser-native setTimeout IDs
	const timeoutRef = useRef<number | null>(null);

	const currentHoverText = isOpen ? closeHoverText : createHoverText;

	const handleMouseEnter = () => {
		if (timeoutRef.current !== null) {
			clearTimeout(timeoutRef.current);
			timeoutRef.current = null;
		}
		setIsLingeringHover(true);
	};

	const handleMouseLeave = () => {
		timeoutRef.current = window.setTimeout(() => {
			setIsLingeringHover(false);
		}, LINGER_DURATION);
	};

	return (
		<button
			type="button"
			className={`${styles.fab} ${isOpen ? styles.isOpen : ""}`}
			onClick={setDrawerOpen}
			aria-label={currentHoverText}
			data-hover-text={currentHoverText}
			data-lingering-hover={isLingeringHover}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}>
			<PlusIcon className={`${styles.icon} ${isOpen ? styles.isOpen : ""}`} />
			<span className={styles.label}>{isOpen ? closeHoverText : createHoverText}</span>
		</button>
	);
}

export default FloatingActionButton;
