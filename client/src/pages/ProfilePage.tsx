import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useGetProfileQuery, useFollowProfileMutation, useUnfollowProfileMutation } from "../features/profiles";
import { useListPiecesQuery } from "../features/pieces";
import { PieceCard } from "../features/pieces/components";
import { useGetPortfolioQuery, useRemoveFromPortfolioMutation } from "../features/portfolio";
import { AvailabilityCalendar } from "../features/artists";
import { useStartConversationMutation } from "../features/chat";
import { Button, ButtonLink, Page } from "@components";
import { UserApplications } from "../features/events/components/UserApplications";
import { ROUTES } from "../routes/routePaths";
import styles from "./ProfilePage.module.css";

type ProfileTab = "posts" | "portfolio" | "availability" | "applications";
type ApplicationStatus = "pending" | "accepted" | "rejected";

export function ProfilePage() {
	const { username } = useParams<{ username: string }>();
	const [searchParams, setSearchParams] = useSearchParams();

	const tabParam = searchParams.get("tab");
	const urlTab: ProfileTab =
		tabParam === "availability" || tabParam === "portfolio" || tabParam === "applications" ? tabParam : "posts";

	const [applicationStatus, setApplicationStatus] = useState<ApplicationStatus>("pending");
	const [activeTab, setActiveTab] = useState<ProfileTab>(urlTab);

	useEffect(() => {
		setActiveTab(urlTab);
	}, [urlTab, username]);

	const { data, isLoading, error } = useGetProfileQuery(username?.toLowerCase() ?? "", { skip: !username });
	const profile = data?.profile;

	const { data: piecesData, isLoading: isLoadingPieces } = useListPiecesQuery(profile?.userId ?? "", {
		skip: !profile,
	});
	const pieces = piecesData?.works ?? [];

	const { data: portfolioData, isLoading: isLoadingPortfolio } = useGetPortfolioQuery(profile?.userId ?? "", {
		skip: !profile || activeTab !== "portfolio",
	});
	const portfolioItems = portfolioData?.items ?? [];

	const [removeFromPortfolio, { isLoading: isRemovingFromPortfolio }] = useRemoveFromPortfolioMutation();
	const [followProfile, { isLoading: isSendingFollow }] = useFollowProfileMutation();
	const [unfollowProfile, { isLoading: isSendingUnfollow }] = useUnfollowProfileMutation();

	const navigate = useNavigate();
	const [startConversation, { isLoading: isStartingConversation }] = useStartConversationMutation();

	if (isLoading) return <div className={styles.loading}>Loading profile…</div>;
	if (error || !profile) return <div className={styles.error}>This profile could not be found.</div>;

	const handleMessage = async () => {
		try {
			const { conversation } = await startConversation({ otherUserId: profile.userId }).unwrap();
			navigate(ROUTES.MESSAGE_THREAD(conversation.id));
		} catch (err) {
			console.error("Failed to start conversation:", err);
		}
	};

	const handleToggleFollow = () => {
		if (!username) return;
		if (profile.isFollowedByMe) {
			unfollowProfile(username);
		} else {
			followProfile(username);
		}
	};

	const handleRemovePortfolioItem = async (showcaseId: string | number) => {
		try {
			await removeFromPortfolio(showcaseId).unwrap();
		} catch (err) {
			console.error("Failed to remove showcase item:", err);
		}
	};

	const setTabParam = (t: ProfileTab) => {
		setSearchParams(
			(prev) => {
				const newParams = new URLSearchParams(prev);
				newParams.set("tab", t);
				return newParams;
			},
			{ replace: true },
		);
	};

	// Determine available tabs based on user role and ownership
	const availableTabs: { id: ProfileTab; label: string }[] = [
		{ id: "posts", label: "Posts" },
		{ id: "portfolio", label: "Portfolio" },
	];
	if (profile.role === "artist") {
		availableTabs.push({ id: "availability", label: "Availability" });
	}
	if (profile.role === "artist" && profile.isOwnProfile) {
		availableTabs.push({ id: "applications", label: "Applications" });
	}

	return (
		<Page type="main">
			<Page.Header
				mode="profile"
				avatarUrl={profile.avatarUrl}
				name={profile.name || "User"}
				userName={profile.userName}
				followerCount={profile.followersCount}
				profileActions={
					!profile.isOwnProfile ? (
						<div className={styles.actionButtons}>
							<Button
								variant={profile.isFollowedByMe ? "ghost" : "solid"}
								disabled={isSendingFollow || isSendingUnfollow}
								onClick={handleToggleFollow}>
								{profile.isFollowedByMe ? "Following" : "Follow"}
							</Button>
							<Button
								variant="ghost"
								disabled={isStartingConversation}
								onClick={handleMessage}>
								Message
							</Button>
						</div>
					) : undefined
				}
				actions={
					<>
						{availableTabs.map((t) => (
							<Button
								key={t.id}
								role="tab"
								aria-selected={activeTab === t.id}
								onClick={() => setTabParam(t.id)}
								variant={activeTab === t.id ? "solid" : "ghost"}>
								{t.label}
							</Button>
						))}
					</>
				}
			/>

			<Page.Body>
				<div className={styles.tabsSection}>
					{activeTab === "posts" && (
						<div className={styles.tabPanel}>
							{isLoadingPieces && <div className={styles.loading}>Loading posts…</div>}

							{!isLoadingPieces && pieces.length === 0 && (
								<div className={styles.emptyState}>
									<p className={styles.emptyText}>
										{profile.isOwnProfile
											? "You haven't shared any posts yet."
											: `${profile.userName} hasn't shared any posts yet.`}
									</p>
									{profile.isOwnProfile && (
										<Button
											variant="solid"
											onClick={() => 1}>
											Create Your First Post
										</Button>
									)}
								</div>
							)}

							{!isLoadingPieces && pieces.length > 0 && (
								<div className={styles.feed}>
									{pieces.map((piece) => (
										<PieceCard
											key={piece.id}
											piece={piece}
											readOnly={!profile.isOwnProfile}
										/>
									))}
								</div>
							)}
						</div>
					)}

					{activeTab === "portfolio" && (
						<div className={styles.tabPanel}>
							{profile.isOwnProfile && (
								<div
									className={styles.portfolioActions}
									style={{ marginBottom: "1rem" }}>
									<ButtonLink to={ROUTES.CREATE_PORTFOLIO_SECTION}>Add a Piece or Event</ButtonLink>
								</div>
							)}

							{isLoadingPortfolio && <div className={styles.loading}>Loading portfolio…</div>}

							{!isLoadingPortfolio && portfolioItems.length === 0 && (
								<p className={styles.emptyText}>
									{profile.isOwnProfile
										? "You haven't pinned anything to your portfolio yet."
										: `${profile.userName} hasn't pinned anything to their portfolio yet.`}
								</p>
							)}

							{!isLoadingPortfolio && portfolioItems.length > 0 && (
								<div className={styles.portfolioGrid}>
									{portfolioItems.map((item) => {
										const isEvent = item.sourceType === "event";
										// eslint-disable-next-line @typescript-eslint/no-explicit-any
										const eventPost = isEvent ? (item.post as any) : null;
										// eslint-disable-next-line @typescript-eslint/no-explicit-any
										const workPost = !isEvent ? (item.post as any) : null;

										return (
											<div
												key={item.id}
												className={styles.portfolioCard}>
												<div className={styles.portfolioCardHeader}>
													<span className={styles.portfolioBadge}>{item.sourceType}</span>
													{profile.isOwnProfile && (
														<button
															type="button"
															className={styles.unpinButton}
															onClick={() => handleRemovePortfolioItem(item.id)}
															disabled={isRemovingFromPortfolio}
															aria-label="Unpin item">
															×
														</button>
													)}
												</div>

												<div className={styles.portfolioCardBody}>
													{isEvent && eventPost && (
														<>
															<h3 className={styles.portfolioCardTitle}>{eventPost.title}</h3>
															<p className={styles.portfolioCardText}>{eventPost.description}</p>
															<span className={styles.portfolioCardMeta}>
																{eventPost.media?.length || 0} media files attached
															</span>
														</>
													)}

													{!isEvent && workPost && (
														<>
															<h3 className={styles.portfolioCardTitle}>Work #{workPost.id}</h3>
															<p className={styles.portfolioCardText}>
																{workPost.description || "No description provided."}
															</p>
															<span className={styles.portfolioCardMeta}>
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
					)}

					{activeTab === "availability" && profile.role === "artist" && (
						<div className={styles.tabPanel}>
							<AvailabilityCalendar
								userId={profile.userId}
								isOwnProfile={profile.isOwnProfile}
							/>
						</div>
					)}

					{activeTab === "applications" && profile.role === "artist" && profile.isOwnProfile && (
						<div className={styles.tabPanel}>
							<div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
								{(["pending", "accepted", "rejected"] as const).map((status) => (
									<Button
										key={status}
										variant={applicationStatus === status ? "solid" : "ghost"}
										onClick={() => setApplicationStatus(status)}>
										{status.charAt(0).toUpperCase() + status.slice(1)}
									</Button>
								))}
							</div>
							<UserApplications statusFilter={applicationStatus} />
						</div>
					)}
				</div>
			</Page.Body>
		</Page>
	);
}

export default ProfilePage;
