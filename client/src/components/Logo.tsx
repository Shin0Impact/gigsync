import styles from "./Logo.module.css";

const GLYPH_PATH =
	"M386.04,0v110.3h-110.29v-27.57c0-7.62-3.08-14.51-8.07-19.5-4.99-4.99-11.89-8.07-19.5-8.07-15.22,0-27.57,12.34-27.57,27.57v27.57h-55.15v-27.57c0-7.62-3.08-14.51-8.07-19.5-4.99-4.99-11.89-8.07-19.5-8.07-15.22,0-27.57,12.34-27.57,27.57v27.57H0V0h165.45v27.57c0,15.22,12.35,27.57,27.57,27.57s27.57-12.35,27.57-27.57V0h165.44Z";

interface LogoProps {
	variant?: "mark" | "full";
	purpose?: "static" | "button";
	active?: boolean;
	size?: "xs" | "s" | "m" | "l" | "xl" | "fill";
	orientation?: "horizontal" | "vertical";
	className?: string;
}

export function Logo({
	variant = "mark",
	purpose = "button",
	active = false,
	size = "m",
	orientation = "horizontal",
	className = "",
}: LogoProps) {
	return (
		<div
			className={`${styles.logo} ${className}`.trim()}
			data-variant={variant}
			data-purpose={purpose}
			data-active={active}
			data-size={size}
			data-orientation={orientation}>
			{orientation === "vertical" ? (
				<svg
					className={styles.glyph}
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 110.3 386.04"
					aria-hidden="true">
					<g transform="translate(0,386.04) rotate(-90)">
						<path
							fill="currentColor"
							d={GLYPH_PATH}
						/>
					</g>
				</svg>
			) : (
				<svg
					className={styles.glyph}
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 386.04 110.3"
					aria-hidden="true">
					<path
						fill="currentColor"
						d={GLYPH_PATH}
					/>
				</svg>
			)}
			{variant === "full" && <span className={styles.wordmark}>Mezzo</span>}
		</div>
	);
}
