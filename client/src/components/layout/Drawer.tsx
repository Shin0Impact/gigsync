import { useEffect } from "react";
import { Voronoi } from "@paper-design/shaders-react";
import { useDrawer } from "../../features/pieces/DrawerProvider";
import { FormIntermezzoCreate } from "../../features/pieces";
import styles from "./Drawer.module.css";

const drawerDecoration = (
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

export function Drawer() {
	const { mode, isOpen, closeDrawer } = useDrawer();

	useEffect(() => {
		if (!isOpen) return;
		function onKeyDown(e: KeyboardEvent) {
			if (e.key === "Escape") closeDrawer();
		}
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [isOpen, closeDrawer]);

	const title = mode?.type === "create-happening" ? "New happening" : "New intermezzo";

	// Rendered directly inside SplitView as a flex column child
	return (
		<>
			{/* Backdrop is hidden via CSS for true column layout, but kept if you want it */}
			<div className={`${styles.backdrop} ${isOpen ? styles.open : ""}`} />

			<aside
				className={`${styles.panel} ${isOpen ? styles.open : ""}`}
				role="dialog"
				aria-label={title}>
				<div className={styles.decoration}>{drawerDecoration}</div>

				<div className={styles.content}>
					<header className={styles.header}>
						<h2>{title}</h2>
						<button
							type="button"
							onClick={closeDrawer}
							className={styles.closeBtn}>
							Cancel
						</button>
					</header>

					<div className={styles.body}>
						{mode?.type === "create-intermezzo" && <FormIntermezzoCreate />}
						{/* {mode?.type === "create-happening" && <FormHappeningCreate />} */}
					</div>
				</div>
			</aside>
		</>
	);
}
