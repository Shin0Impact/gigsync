import { Outlet } from "react-router-dom";
import { useSocketConnection } from "../hooks/useSocketConnection";
import { useRememberCurrentAccount } from "../hooks/useRememberCurrentAccount";
import { SplitView } from "../components/layout/SplitView";
// import { Navbar } from "../components/layout/Navbar";
// import styles from "./Layouts.module.css";

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
