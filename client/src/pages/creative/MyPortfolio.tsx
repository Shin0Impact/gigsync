import styles from "./MyPortfolio.module.css";
import { useMeQuery } from "../../features/auth";
import { useGetPortfolioQuery, useRemoveFromPortfolioMutation } from "../../features/portfolio";
import { ButtonLink } from "@components";
import { ROUTES } from "../../routes/routePaths";

export function MyPortfolio() {
	const { data: meData } = useMeQuery();
	const userId = meData?.user?.userId;

	const { data, isLoading, isError } = useGetPortfolioQuery(userId!, {
		skip: !userId,
	});

	const [deleteShowcase, { isLoading: isDeleting }] = useRemoveFromPortfolioMutation();

	const items = data?.items ?? [];

	const handleDelete = async (showcaseId: string | number) => {
		try {
			await deleteShowcase(showcaseId).unwrap();
		} catch (err) {
			console.error("Failed to remove showcase item:", err);
		}
	};

	if (isLoading) return <div className={styles.loading}>Loading portfolio...</div>;
	if (!userId) return <div className={styles.error}>Please log in to view your portfolio.</div>;
	if (isError) return <div className={styles.error}>Failed to load portfolio.</div>;

	return (
		<div className={styles.container}>
			<header className={styles.header}>
				<div>
					<h1>My Portfolio</h1>
					<p>Pinned works and events</p>
				</div>
				<ButtonLink to={ROUTES.CREATE_PORTFOLIO_SECTION}>Add a Piece or Event</ButtonLink>
			</header>

			{items.length === 0 ? (
				<div className={styles.empty}>No items pinned to your portfolio yet.</div>
			) : (
				<div className={styles.grid}>
					{items.map((item) => {
						const isEvent = item.sourceType === "event";
						const eventPost = isEvent ? (item.post as any) : null;
						const workPost = !isEvent ? (item.post as any) : null;

						return (
							<div
								key={item.id}
								className={styles.card}>
								<div className={styles.cardHeader}>
									<span className={styles.badge}>{item.sourceType}</span>
									<button
										onClick={() => handleDelete(item.id)}
										disabled={isDeleting}
										className={styles.deleteButton}
										aria-label="Unpin item">
										&times;
									</button>
								</div>

								<div className={styles.cardBody}>
									{isEvent && eventPost && (
										<>
											<h3>{eventPost.title}</h3>
											<p>{eventPost.description}</p>
											<span className={styles.meta}>
												{eventPost.media?.length || 0} media files attached
											</span>
										</>
									)}

									{!isEvent && workPost && (
										<>
											<h3>Work #{workPost.id}</h3>
											<p>{workPost.description || "No description provided."}</p>
											<span className={styles.meta}>
												{workPost.updates?.length || 0} updates recorded
											</span>
										</>
									)}
								</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
