import { Outlet } from "react-router-dom";
import { SplitView } from "../components/layout/SplitView";

interface LayoutProps {
	type: "form" | "page";
}

export default function Layout({ type }: LayoutProps) {
	return (
		<SplitView contentDecoration={type === "form"}>
			<Outlet />
		</SplitView>
	);
}
