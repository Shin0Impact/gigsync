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
						<ProfilePicture
							avatarUrl={avatarUrl}
							userName={userName}
							variant="profile"
						/>
						<div className={styles.profileInfo}>
							<h1 className={styles.profileName}>{name}</h1>
							<p className={styles.profileMeta}>
								{userName && <span className={styles.handle}>@{userName}</span>}
								<span className={styles.followers}>
									<strong>{followerCount ?? 0}</strong> {followerCount === 1 ? "Follower" : "Followers"}
								</span>
							</p>
							{profileActions && <div className={styles.profileActions}>{profileActions}</div>}
						</div>
					</div>
					{actions && <div className={styles.profileTabs}>{actions}</div>}
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
