import { Outlet } from "react-router-dom";
import { SplitView } from "../components/layout/SplitView";
import { useSocketConnection } from "../hooks/useSocketConnection";
import { useRememberCurrentAccount } from "../hooks/useRememberCurrentAccount";

interface LayoutProps {
	type: "form" | "page";
}

export default function Layout({ type }: LayoutProps) {
	// App-wide: live chat/status socket + the "known accounts on this device" list.
	// (Both were dropped in the big merge, so nothing was connecting the socket.)
	useSocketConnection();
	useRememberCurrentAccount();

	return (
		<SplitView contentDecoration={type === "form"}>
			<Outlet />
		</SplitView>
	);
}
