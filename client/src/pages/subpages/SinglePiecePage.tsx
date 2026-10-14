import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Page, Button } from "@components";
import { useGetCompositionQuery, useListIntermezzosQuery } from "../../features/pieces";
import { IntermezzoCard } from "../../features/pieces/components/IntermezzoCard";
import { Composition } from "../../features/pieces/components/Composition/Composition";
import styles from "./SinglePiecePage.module.css";

export function SinglePiecePage() {
	const { id: pieceId } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();
	const isDrawerOpen = searchParams.get("drawer") === "open";

	const numericPieceId = pieceId ? Number(pieceId) : undefined;

	const {
		data: intermezzosData,
		isLoading,
		error,
	} = useListIntermezzosQuery(numericPieceId!, {
		skip: !numericPieceId,
	});

	const intermezzos = intermezzosData?.updates ?? [];
	const { data, isLoading: isLoadingComposition } = useGetCompositionQuery(`${pieceId}`);

	const handleToggleDrawer = () => {
		setSearchParams((prev) => {
			const newParams = new URLSearchParams(prev);
			if (isDrawerOpen) {
				newParams.delete("drawer");
			} else {
				newParams.set("drawer", "open");
			}
			return newParams;
		});
	};

	if (!numericPieceId) {
		return (
			<Page type="sub">
				<Page.Body>
					<div className={styles.error}>Invalid Piece ID.</div>
				</Page.Body>
			</Page>
		);
	}

	return (
		<Page type="sub">
			<Page.Header
				title={`Piece #${pieceId}`}
				// subtitle="Explore intermezzi and the composition timeline"
				mode="button"
				actions={
					<Button
						variant="solid"
						onClick={handleToggleDrawer}
						className={styles.addIntermezzoBtn}>
						{isDrawerOpen ? "Close Drawer" : "+ Post Intermezzo"}
					</Button>
				}
			/>
			<Page.Body>
				<div className={styles.container}>
					{isLoadingComposition ? (
						<div className={styles.loading}>Loading Composition...</div>
					) : (
						<Composition items={data?.composition ?? []} />
					)}

					<section className={styles.timelineSection}>
						<h2 className={styles.sectionTitle}>Intermezzi ({intermezzos.length})</h2>

						{isLoading && <div className={styles.loading}>Loading Intermezzi...</div>}

						{error && <div className={styles.error}>Failed to load Intermezzos for this piece.</div>}

						{!isLoading && !error && intermezzos.length === 0 && (
							<div className={styles.emptyState}>
								<p className={styles.emptyText}>No Intermezzi posted yet for this piece.</p>
								<Button
									variant="solid"
									onClick={handleToggleDrawer}
									className={styles.addIntermezzoBtn}>
									Post First Intermezzo
								</Button>
							</div>
						)}

						{!isLoading && intermezzos.length > 0 && (
							<div className={styles.timelineFeed}>
								{intermezzos.map((intermezzo) => (
									<IntermezzoCard
										key={intermezzo.id}
										intermezzo={intermezzo}
									/>
								))}
							</div>
						)}
					</section>
				</div>
			</Page.Body>
		</Page>
	);
}

export default SinglePiecePage;
