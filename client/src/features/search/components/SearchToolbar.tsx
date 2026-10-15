import { useState, type ReactNode } from "react";
import styles from "./SearchToolbar.module.css";

interface SearchToolbarProps {
	value: string;
	onChange: (value: string) => void;
	placeholder: string;
	ariaLabel: string;
	// Optional "Go"-style submit (e.g. geocoding a place). Omit for live search.
	onSubmit?: () => void;
	submitLabel?: string;
	submitDisabled?: boolean;
	// Filters collapse behind one button so the page is a single search box by default.
	filters?: ReactNode;
	activeFilterCount?: number;
	// Short chips shown under the bar (active location, urgent-only, ...).
	chips?: ReactNode;
	// Inline errors.
	message?: string | null;
}

export function SearchToolbar({
	value,
	onChange,
	placeholder,
	ariaLabel,
	onSubmit,
	submitLabel = "Go",
	submitDisabled,
	filters,
	activeFilterCount = 0,
	chips,
	message,
}: SearchToolbarProps) {
	const [open, setOpen] = useState(false);

	return (
		<div className={styles.toolbar}>
			<form
				className={styles.bar}
				onSubmit={(e) => {
					e.preventDefault();
					onSubmit?.();
				}}>
				<input
					type="search"
					value={value}
					onChange={(e) => onChange(e.target.value)}
					placeholder={placeholder}
					aria-label={ariaLabel}
					className={styles.input}
				/>
				{onSubmit && (
					<button
						type="submit"
						className={styles.primary}
						disabled={submitDisabled}>
						{submitLabel}
					</button>
				)}
				{filters && (
					<button
						type="button"
						className={styles.secondary}
						aria-expanded={open}
						onClick={() => setOpen((v) => !v)}>
						Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
					</button>
				)}
			</form>

			{open && filters && <div className={styles.panel}>{filters}</div>}

			{chips && <div className={styles.chips}>{chips}</div>}
			{message && <p className={styles.message}>{message}</p>}
		</div>
	);
}

export function FilterField({ label, children }: { label: string; children: ReactNode }) {
	return (
		<label className={styles.field}>
			<span className={styles.fieldLabel}>{label}</span>
			{children}
		</label>
	);
}

export function Chip({ children, onClear }: { children: ReactNode; onClear?: () => void }) {
	return (
		<span className={styles.chip}>
			{children}
			{onClear && (
				<button
					type="button"
					className={styles.chipClear}
					onClick={onClear}
					aria-label="Remove filter">
					×
				</button>
			)}
		</span>
	);
}
