import { Outlet } from "react-router-dom";
import { SplitView } from "../components/layout/SplitView";
import { Navbar } from "../components/layout/Navbar";
import { PostQuickViewProvider } from "../features/pieces/PostQuickViewProvider";
import { ComposerProvider, useComposer } from "../features/pieces/ComposerProvider";
import styles from "./Layouts.module.css";

interface LayoutProps {
	type: "form" | "page";
	role: "creative" | "supporter" | "organizer" | "guest";
}

function ComposerFab() {
	const { openComposer } = useComposer();
	return (
		<button
			type="button"
			className={styles.fab}
			onClick={openComposer}
			aria-label="Create new piece">
			+
		</button>
	);
}

// The composer FAB + its modal (ComposerProvider), and the PostQuickView
// popup-to-page context (PostQuickViewProvider), live here rather than on
// individual pages (the composer used to be MyPieces-only) so "+" is
// available on every creative page, and any PieceCard anywhere can open
// the same quick-view popup.
export default function Layout({ type, role }: LayoutProps) {
	const showCreativeChrome = role === "creative" && type === "page";

	return (
		<SplitView
			role={role}
			contentDecoration={type === "form"}>
			{role !== "guest" && type === "page" && <Navbar role={role} />}

			{showCreativeChrome ? (
				<PostQuickViewProvider>
					<ComposerProvider>
						<Outlet />
						<ComposerFab />
					</ComposerProvider>
				</PostQuickViewProvider>
			) : (
				<Outlet />
			)}
		</SplitView>
	);
}
