import styles from "./Button.module.css";

export type ButtonVariant = "solid" | "ghost" | "logo" | "expandable";
export type ButtonColor = "default" | "white" | "black" | "cream" | "yellow" | "moss" | "blue";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: ButtonVariant;
	active?: boolean;
	hoverText?: string;
}

export function Button({
	variant = "solid",
	active = false,
	hoverText,
	className = "",
	children,
	...rest
}: ButtonProps) {
	return (
		<button
			className={`${styles.button} ${className}`.trim()}
			data-variant={variant}
			data-active={active}
			{...rest}>
			{variant === "expandable" && hoverText ? (
				<>
					<span className={styles.defaultText}>{children}</span>
					<span className={styles.hoverText}>{hoverText}</span>
				</>
			) : (
				children
			)}
		</button>
	);
}
