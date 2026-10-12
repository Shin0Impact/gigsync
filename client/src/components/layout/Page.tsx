import { ReactNode } from "react";
import styles from "./Page.module.css";

interface PageProps {
	children: ReactNode;
}

export const Page = ({ children }: PageProps) => {
	return <div className={styles.page}>{children}</div>;
};

interface PageHeaderProps {
	title: string;
	actions?: ReactNode;
}

Page.Header = ({ title, actions }: PageHeaderProps) => (
	<header className={styles.header}>
		<h1 className={styles.title}>{title}</h1>
		{actions && <div className={styles.actions}>{actions}</div>}
	</header>
);

Page.Body = ({ children }: { children: ReactNode }) => <div className={styles.body}>{children}</div>;
