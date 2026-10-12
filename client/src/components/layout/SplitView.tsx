import type { ReactNode } from "react";
import { Voronoi } from "@paper-design/shaders-react";
import { Sidebar } from "./Sidebar";
import { Drawer } from "./Drawer";
import { DrawerFab } from "@components/layout/DrawerFab";
import { DrawerProvider } from "../../features/pieces/DrawerProvider";
import { PostQuickViewProvider } from "../../features/pieces/PostQuickViewProvider";
import styles from "./SplitView.module.css";

interface SplitViewProps {
	role: "creative" | "supporter" | "organizer" | "guest";
	children: ReactNode;
	contentDecoration?: boolean;
	className?: string;
	enableCreationChrome?: boolean; // Controls whether the FAB & Drawer are active
}

const defaultDecoration = (
	<Voronoi
		width={"auto"}
		height={"100vh"}
		colors={["#fafafa"]}
		colorGap="#272727"
		stepsPerColor={1}
		distortion={0.33}
		gap={0.02}
		glow={0}
		speed={0}
		scale={0.27}
	/>
);

export function SplitView({
	role,
	children,
	contentDecoration = false,
	className = "",
	enableCreationChrome = false,
}: SplitViewProps) {
	const viewContent = (
		<div
			className={`${styles.view} ${className}`.trim()}
			data-role={role}>
			<Sidebar />
			<div className={styles.content}>
				{contentDecoration && <div className={styles.contentDecoration}>{defaultDecoration}</div>}
				<div className={styles.children}>{children}</div>
			</div>
			{enableCreationChrome && (
				<>
					<Drawer />
					<DrawerFab role={role} />
				</>
			)}
		</div>
	);

	if (!enableCreationChrome) {
		return viewContent;
	}

	return (
		<PostQuickViewProvider>
			<DrawerProvider>{viewContent}</DrawerProvider>
		</PostQuickViewProvider>
	);
}
