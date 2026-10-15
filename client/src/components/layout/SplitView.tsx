import { type ReactNode } from "react";
import { Voronoi } from "@paper-design/shaders-react";
import { Sidebar } from "./Sidebar";
import styles from "./SplitView.module.css";
import { useMeQuery } from "../../features/auth";
import { FormIntermezzoCreate } from "../../features/pieces";
import FloatingActionButton from "./FloatingActionButton";
import { useSearchParams, useLocation } from "react-router-dom";
import { useMediaQuery } from "../../hooks";
import { MobileNav } from "./MobileNav";
import FormEventCreate from "../../features/events/components/FormEventCreate";
import { FormApplyToEvent } from "../../features/events/components/FormApplyToEvent";
import { ROUTES } from "../../routes/routePaths";

interface SplitViewProps {
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

const HIDDEN_FAB_ROUTES = [ROUTES.MESSAGES, ROUTES.MESSAGE_THREAD_PATTERN, ROUTES.SETTINGS];

export function SplitView({ children, contentDecoration = false, className = "" }: SplitViewProps) {
	const [searchParams, setSearchParams] = useSearchParams();
	const location = useLocation();
	const isDrawerOpen = searchParams.get("drawer") === "open";
	const formParam = searchParams.get("form") || "default";
	const eventIdParam = searchParams.get("eventId");
	const isMobile = useMediaQuery("(max-width: 768px)");

	const { data, isLoading } = useMeQuery();
	const role = data?.user?.role ?? "guest";
	const username = data?.user?.userName;

	const shouldHideFab = HIDDEN_FAB_ROUTES.some((route) => {
		if (route.includes(":")) {
			const basePath = route.split(":")[0];
			return location.pathname.startsWith(basePath);
		}
		return location.pathname === route;
	});

	const handleToggleDrawer = () => {
		setSearchParams(
			(prev) => {
				const newParams = new URLSearchParams(prev);
				if (isDrawerOpen) {
					newParams.delete("drawer");
					newParams.delete("form");
					newParams.delete("eventId");
					newParams.delete("pieceId");
				} else {
					newParams.set("drawer", "open");
				}
				return newParams;
			},
			{ replace: true },
		);
	};

	let drawerContent = null;
	if (!isLoading) {
		if (formParam === "apply" && eventIdParam) {
			drawerContent = (
				<FormApplyToEvent
					eventId={eventIdParam}
					onClose={handleToggleDrawer}
				/>
			);
		} else if (role === "artist") {
			drawerContent = <FormIntermezzoCreate />;
		} else if (role === "organizer") {
			drawerContent = <FormEventCreate />;
		}
	}

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
				<div className={styles.drawerInner}>{drawerContent}</div>
			</aside>

			{/* On mobile the MobileNav bar already has its own create button -
			    showing the floating one too would double the "+" on screen */}
			{!isMobile && (role === "artist" || role === "organizer") && !shouldHideFab && (
				<FloatingActionButton
					isOpen={isDrawerOpen}
					setDrawerOpen={handleToggleDrawer}
					createHoverText={createHoverText}
				/>
			)}
		</div>
	);
}
