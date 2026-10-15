import type { ReactNode } from "react";
import styles from "./Page.module.css";
import ProfilePicture from "@components/user/ProfilePicture";

interface PageRootProps {
	type?: "main" | "sub";
	children: ReactNode;
	className?: string;
}

function PageRoot({ type = "main", children, className = "" }: PageRootProps) {
	return (
		<div
			className={`${styles.page} ${className}`.trim()}
			data-type={type}>
			{children}
		</div>
	);
}

interface HeaderProps {
	title: string;
	actions?: ReactNode;
	mode?: "profile" | "button";
	/** When provided, the title renders as a button (e.g. Discovery ⇄ Timeline feed switch) */
	titleOnClick?: () => void;
	titleOnClickLabel?: string;
}

function Header({ title, actions, mode = "profile", titleOnClick, titleOnClickLabel }: HeaderProps) {
	return (
		<header className={styles.header}>
			<h1 className={styles.title}>
				{titleOnClick ? (
					<button
						type="button"
						className={styles.titleButton}
						onClick={titleOnClick}
						aria-label={titleOnClickLabel ?? title}>
						{title}
					</button>
				) : (
					title
				)}
			</h1>
			{mode === "profile" ? <ProfilePicture variant="page" /> : actions}
		</header>
	);
}

function Body({ children, className = "" }: { children: ReactNode; className?: string }) {
	return <div className={`${styles.body} ${className}`.trim()}>{children}</div>;
}

export const Page = Object.assign(PageRoot, { Header, Body });
