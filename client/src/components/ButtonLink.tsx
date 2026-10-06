import { Link, type LinkProps } from "react-router-dom";
import styles from "./Button.module.css";
import type { ButtonVariant } from "./Button";

interface CommonProps {
	variant?: ButtonVariant;
	active?: boolean;
	className?: string;
	children: React.ReactNode;
	hoverText?: string;
}

type ButtonLinkAsRoute = CommonProps &
	Omit<LinkProps, "className"> & { to: string; href?: undefined };

type ButtonLinkAsAnchor = CommonProps &
	Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "className"> & {
		href: string;
		to?: undefined;
	};

export type ButtonLinkProps = ButtonLinkAsRoute | ButtonLinkAsAnchor;

export function ButtonLink({
	variant = "solid",
	active = false,
	hoverText,
	className = "",
	children,
	...rest
}: ButtonLinkProps) {
	const classes = `${styles.button} ${className}`.trim();
	const dataProps = {
		"data-variant": variant,
		"data-active": active,
	};

	const content =
		variant === "expandable" && hoverText ? (
			<>
				<span className={styles.defaultText}>{children}</span>
				<span className={styles.hoverText}>&nbsp;{hoverText}</span>
			</>
		) : (
			children
		);

	if ("to" in rest && rest.to) {
		const { to, ...linkRest } = rest as ButtonLinkAsRoute;
		return (
			<Link
				to={to}
				className={classes}
				{...dataProps}
				{...linkRest}>
				{content}
			</Link>
		);
	}

	const { href, ...anchorRest } = rest as ButtonLinkAsAnchor;
	return (
		<a
			href={href}
			className={classes}
			{...dataProps}
			{...anchorRest}>
			{content}
		</a>
	);
}
