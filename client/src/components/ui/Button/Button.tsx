import styles from "./Button.module.css";

export type ButtonVariant = "solid" | "ghost" | "logo" | "expandable" | "nav";
export type ButtonColor = "default" | "white" | "black" | "cream" | "yellow" | "moss" | "blue";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: ButtonVariant;
	color?: ButtonColor;
	active?: boolean;
	hoverText?: string;
}

export function Button({
	variant = "solid",
	color = "default",
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
			data-color={color}
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
