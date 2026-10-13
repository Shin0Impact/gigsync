import { type ReactNode } from "react";
import { Voronoi } from "@paper-design/shaders-react";
import { Sidebar } from "./Sidebar";
import styles from "./SplitView.module.css";
import { useMeQuery } from "../../features/auth";
import { FormIntermezzoCreate } from "../../features/pieces";
import FloatingActionButton from "./FloatingActionButton";
import { useSearchParams } from "react-router-dom";
import { useMediaQuery } from "../../hooks";
import { MobileNav } from "./MobileNav";

interface SplitViewProps {
	// role: "creative" | "supporter" | "organizer" | "guest";
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

export function SplitView({ children, contentDecoration = false, className = "" }: SplitViewProps) {
	const [searchParams, setSearchParams] = useSearchParams();
	const isDrawerOpen = searchParams.get("drawer") === "open";
	const isMobile = useMediaQuery("(max-width: 768px)");

	const { data } = useMeQuery();
	const role = data?.user?.role ?? "guest";
	const username = data?.user?.userName;

	const handleToggleDrawer = () => {
		setSearchParams((prev) => {
			const newParams = new URLSearchParams(prev);
			if (isDrawerOpen) {
				newParams.delete("drawer");
			} else {
				newParams.set("drawer", "open");
			}
			return newParams;
		});
	};

	const renderDrawerContent =
		role === "artist" ? <FormIntermezzoCreate /> : role === "organizer" ? <div>Craete Happening</div> : <></>;

	const createHoverText = role === "artist" ? "New Intermezzo" : role === "organizer" ? "New Happening" : "Create";

	return (
		<div
			className={`${styles.view} ${className}`.trim()}
			data-role={role}
			data-drawer-open={isDrawerOpen}>
			{isMobile ? (
				<MobileNav
					role={role}
					username={username}
					onToggleDrawer={handleToggleDrawer}
					isDrawerOpen={isDrawerOpen}
				/>
			) : (
				<Sidebar />
			)}

			<div className={styles.content}>
				{contentDecoration && <div className={styles.contentDecoration}>{defaultDecoration}</div>}
				<div className={styles.children}>{children}</div>
			</div>

			<aside className={styles.drawer}>
				<div className={styles.drawerDecoration}>{defaultDecoration}</div>
				<div className={styles.drawerInner}>{renderDrawerContent}</div>
			</aside>

			{(role === "artist" || role === "organizer") && (
				<FloatingActionButton
					isOpen={isDrawerOpen}
					setDrawerOpen={handleToggleDrawer}
					createHoverText={createHoverText}
				/>
			)}
		</div>
	);
}
