import type { ReactNode } from "react";
import styles from "./EventFormControls.module.css";

interface SwitchProps {
	checked: boolean;
	onChange: (checked: boolean) => void;
	title: string;
	hint?: string;
}

// A left/right toggle (not a checkbox): knob slides right when on.
export function Switch({ checked, onChange, title, hint }: SwitchProps) {
	return (
		<button
			type="button"
			role="switch"
			aria-checked={checked}
			className={styles.switchRow}
			onClick={() => onChange(!checked)}>
			<span className={styles.switchText}>
				<span className={styles.switchTitle}>{title}</span>
				{hint && <span className={styles.switchHint}>{hint}</span>}
			</span>
			<span
				className={styles.track}
				aria-hidden="true">
				<span className={styles.knob} />
			</span>
		</button>
	);
}

interface OptionCardProps {
	checked: boolean;
	onSelect: () => void;
	title: string;
	hint: ReactNode;
}

export function OptionCard({ checked, onSelect, title, hint }: OptionCardProps) {
	return (
		<button
			type="button"
			role="radio"
			aria-checked={checked}
			className={styles.card}
			onClick={onSelect}>
			<span className={styles.cardTitle}>{title}</span>
			<span className={styles.cardHint}>{hint}</span>
		</button>
	);
}

