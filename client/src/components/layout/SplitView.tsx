import type { ReactNode } from "react";
import { Voronoi } from "@paper-design/shaders-react";
import { Sidebar } from "./Sidebar";
import styles from "./SplitView.module.css";

interface SplitViewProps {
	role: "creative" | "supporter" | "organizer" | "guest";
	children: ReactNode;
	contentDecoration?: boolean;
	className?: string;
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

export function SplitView({ role, children, contentDecoration = false, className = "" }: SplitViewProps) {
	return (
		<div
			className={`${styles.view} ${className}`.trim()}
			data-role={role}>
			<Sidebar role={role} />
			<div className={styles.content}>
				{contentDecoration && <div className={styles.contentDecoration}>{defaultDecoration}</div>}
				<div className={styles.children}>{children}</div>
			</div>
		</div>
	);
}
