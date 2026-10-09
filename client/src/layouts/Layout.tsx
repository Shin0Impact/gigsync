import { Outlet } from "react-router-dom";
import { SplitView } from "../components/layout/SplitView";
import { Navbar } from "../components/layout/Navbar";
// import styles from "./Layouts.module.css";

interface LayoutProps {
	type: "form" | "page";
	role: "creative" | "supporter" | "organizer" | "guest";
}

export default function Layout({ type, role }: LayoutProps) {
	return (
		<SplitView
			role={role}
			contentDecoration={type === "form"}>
			{role !== "guest" && type === "page" && <Navbar role={role} />}
			<Outlet />
		</SplitView>
	);
}
