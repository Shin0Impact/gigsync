import { useListPiecesQuery } from "../piecesApi";
import styles from "./UserPieces.module.css";
import { PieceCard } from "./PieceCard";
import { IWork } from "@shared/types/social";
import { EmptyState } from "@components/ui/EmptyState/EmptyState";
import { useSearchParams } from "react-router-dom";

interface UserPiecesProps {
	userId: string;
	mine?: boolean;
}

export function UserPieces({ userId, mine = false }: UserPiecesProps) {
	const [searchParams, setSearchParams] = useSearchParams();
	const isDrawerOpen = searchParams.get("drawer") === "open";
	const {
		data: piecesData,
		isLoading,
		error,
	} = useListPiecesQuery(userId ?? "", {
		skip: !userId,
	});

	const pieces = piecesData?.works ?? [];

	const handleToggleDrawer = () => {
		setSearchParams((prev) => {
			const newParams = new URLSearchParams(prev);
			if (isDrawerOpen) {
				newParams.delete("drawer");
				newParams.delete("form");
				newParams.delete("pieceId");
			} else {
				newParams.set("drawer", "open");
			}
			return newParams;
		});
	};

	return (
		<main className={styles.container}>
			{isLoading && <div className={styles.loading}>{mine ? "Loading your Pieces..." : "Loading Pieces..."}</div>}

			{error && <div className={styles.error}>We had a problem loading Pieces. Please try refreshing.</div>}

			{!isLoading && !error && pieces.length === 0 && (
				<div className={styles.emptyState}>
					<EmptyState
						title="No Pieces yet."
						subtitle={
							mine
								? "Share your creative journey by starting your first Piece."
								: "Check back soon to see their Pieces."
						}
						actionLabel="Start your First Piece"
						onAction={handleToggleDrawer}
					/>
				</div>
			)}

			{!isLoading && pieces.length > 0 && (
				<section className={styles.userPieces}>
					{pieces.map((piece: IWork) => (
						<PieceCard
							key={piece.id}
							piece={piece}
						/>
					))}
				</section>
			)}
		</main>
	);
}
