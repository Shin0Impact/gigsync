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
}

function Header({ title }: HeaderProps) {
	return (
		<header className={styles.header}>
			<h1 className={styles.title}>{title}</h1>
			<ProfilePicture variant="page" />
		</header>
	);
}

function Body({ children, className = "" }: { children: ReactNode; className?: string }) {
	return <div className={`${styles.body} ${className}`.trim()}>{children}</div>;
}

export const Page = Object.assign(PageRoot, { Header, Body });
