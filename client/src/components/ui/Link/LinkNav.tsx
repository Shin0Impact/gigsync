import { Link, LinkProps } from "react-router-dom";
import styles from "./Link.module.css";

export interface LinkNavProps extends LinkProps {
	active?: boolean;
	// hoverText?: string;
}

export function LinkNav({ to, active = false, color = "default", className = "", children, ...rest }: LinkNavProps) {
	const combinedClassName = `${styles.navLink} ${className}`.trim();

	return (
		<Link
			to={to}
			className={combinedClassName}
			data-active={active}
			data-color={color}
			{...rest}>
			{children}
		</Link>
	);
}
