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
	title?: string;
	actions?: ReactNode;
	mode?: "profile" | "button";
	// Profile-specific props
	avatarUrl?: string | null;
	userName?: string;
	name?: string;
	followerCount?: number;
	profileActions?: ReactNode;
}

function Header({ title, actions, mode = "button", avatarUrl, userName, name, followerCount, profileActions }: HeaderProps) {
	return (
		<header className={styles.header}>
			{mode === "profile" ? (
				<>
					<div className={styles.profileGroup}>
						<div>
							<ProfilePicture
								avatarUrl={avatarUrl}
								userName={userName}
								variant="profile"
							/>
							<h1 className={styles.title}>{name}</h1>
						</div>
						<div className={styles.social}>
							<div>
								{userName && <p className={styles.handle}>@{userName}</p>}
								<p className={styles.followers}>
									<strong>{followerCount}</strong> {followerCount === 1 ? "Follower" : "Followers"}
								</p>
							</div>
						</div>
						{profileActions && <div>{profileActions}</div>}
					</div>
					{actions}
				</>
			) : (
				<>
					<h1 className={styles.title}>{title}</h1>
					{actions}
				</>
			)}
		</header>
	);
}

function Body({ children, className = "" }: { children: ReactNode; className?: string }) {
	return <div className={`${styles.body} ${className}`.trim()}>{children}</div>;
}

export const Page = Object.assign(PageRoot, { Header, Body });
