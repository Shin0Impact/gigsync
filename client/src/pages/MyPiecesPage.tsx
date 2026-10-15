import { Button, Page } from "@components";
import { useMeQuery } from "../features/auth";
import { UserPieces } from "../features/pieces/components/UserPieces";
import { useSearchParams } from "react-router-dom";

export function MyPiecesPage() {
	const [searchParams, setSearchParams] = useSearchParams();
	const tab = (searchParams.get("tab") as "recent" | "dormant") || "recent";

	const { data: meData, isLoading } = useMeQuery();
	const userId = meData?.user?.userId;
	const role = meData?.user?.role;

	const tabs: ("recent" | "dormant")[] = ["recent", "dormant"];

	return (
		<Page type="main">
			<Page.Header
				title="My Pieces"
				mode="button"
				actions={
					<div style={{ display: "flex", gap: "1rem" }}>
						{tabs.map((t) => (
							<Button
								key={t}
								onClick={() => {
									setSearchParams(
										(prev) => {
											const newParams = new URLSearchParams(prev);
											newParams.set("tab", t);
											return newParams;
										},
										{ replace: true },
									);
								}}
								variant={tab === t ? "solid" : "ghost"}>
								{t.charAt(0).toUpperCase() + t.slice(1)}
							</Button>
						))}
					</div>
				}
			/>
			<Page.Body>
				{isLoading || !userId || !role ? (
					<p>Loading…</p>
				) : (
					<UserPieces
						userId={userId}
						mine={true}
						tab={tab}
					/>
				)}
			</Page.Body>
		</Page>
	);
}

export default MyPiecesPage;
