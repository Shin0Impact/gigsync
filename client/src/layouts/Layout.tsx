import { Outlet } from "react-router-dom";
import { SplitView } from "../components/layout/SplitView";
// import { Navbar } from "../components/layout/Navbar";

interface LayoutProps {
	type: "form" | "page";
	role: "creative" | "supporter" | "organizer" | "guest";
}

export default function Layout({ type, role }: LayoutProps) {
	const showCreationChrome = (role === "creative" || role === "organizer") && type === "page";

	return (
		<SplitView
			role={role}
			enableCreationChrome={showCreationChrome}>
			{/* {role !== "guest" && type === "page" && <Navbar role={role} />} */}
			<Outlet />
		</SplitView>
	);
}
