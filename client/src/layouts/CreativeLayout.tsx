import { Outlet } from "react-router-dom";
import { CreativeSidebar } from "../components/layout/CreativeSidebar";

function CreativeLayout() {
	return (
		<div>
			<CreativeSidebar />
			<div>
				<Outlet />
			</div>
		</div>
	);
}

export default CreativeLayout;
