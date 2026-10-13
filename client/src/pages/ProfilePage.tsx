import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGetProfileQuery, useFollowProfileMutation, useUnfollowProfileMutation } from "../features/profiles";
import { useListPiecesQuery, useComposer } from "../features/pieces";
import { PieceCard } from "../features/pieces/components";
import { useGetPortfolioQuery, useRemoveFromPortfolioMutation } from "../features/portfolio";
import { AvailabilityCalendar } from "../features/artists";
import { useStartConversationMutation } from "../features/chat";
import { ButtonLink } from "@components";
import { ROUTES } from "../routes/routePaths";
import ProfilePicture from "../components/user/ProfilePicture";
import styles from "./ProfilePage.module.css";

type ProfileTab = "posts" | "portfolio" | "availability";

// Previously Studio (My Pieces) and Profile were two separate pages
// showing almost the same "your own pieces" grid - one with a profile
// header and one without. They're merged here: Profile is now the single
// hub for a user's own (or anyone else's) pieces and portfolio, split
// into tabs rather than separate routes. See routePaths.ts/Routes.tsx -
// /dashboard, /pieces, /portfolio and /:userId/portfolio are gone;
// RootRedirect/RoleGuard send artists here (their own profile) instead.
export function ProfilePage() {
	const { username } = useParams<{ username: string }>();
	const [activeTab, setActiveTab] = useState<ProfileTab>("posts");

	const { data, isLoading, error } = useGetProfileQuery(username ?? "", { skip: !username });
	const profile = data?.profile;

	const { data: piecesData, isLoading: isLoadingPieces } = useListPiecesQuery(profile?.userId ?? "", {
		skip: !profile,
	});
	const pieces = piecesData?.works ?? [];

	// Only fetched once the Portfolio tab is actually opened - no point
	// paying for it on every profile view when Posts is the default tab.
	const { data: portfolioData, isLoading: isLoadingPortfolio } = useGetPortfolioQuery(profile?.userId ?? "", {
		skip: !profile || activeTab !== "portfolio",
	});
	const portfolioItems = portfolioData?.items ?? [];

	const [removeFromPortfolio, { isLoading: isRemovingFromPortfolio }] = useRemoveFromPortfolioMutation();
	const { openComposer } = useComposer();

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

	return (
		<main className={styles.container}>
			<header className={styles.profileHeader}>
				<ProfilePicture
					avatarUrl={profile.avatarUrl}
					userName={profile.userName}
					variant="profile"
					className={styles.avatar}
				/>

				<div className={styles.profileInfo}>
					<div className={styles.nameRow}>
						<h1 className={styles.name}>{profile.name || profile.userName}</h1>
						{profile.isVerified && (
							<span
								className={styles.verifiedBadge}
								title="Verified artist">
								✓ Verified
							</span>
						)}
					</div>

					<p className={styles.userName}>@{profile.userName}</p>

					<div className={styles.metaRow}>
						{profile.artistsType && <span className={styles.artistType}>{profile.artistsType}</span>}
						<span className={styles.followersCount}>
							<strong>{profile.followersCount}</strong> {profile.followersCount === 1 ? "Follower" : "Followers"}
						</span>
					</div>

					{profile.socialLinks.length > 0 && (
						<div className={styles.socialLinks}>
							{profile.socialLinks.map((link) => (
								<a
									key={link.id}
									href={link.url}
									target="_blank"
									rel="noreferrer"
									className={styles.socialLink}>
									{link.platform}
								</a>
							))}
						</div>
					)}

					{!profile.isOwnProfile && (
						<div className={styles.actionButtons}>
							<button
								type="button"
								className={styles.followButton}
								data-following={profile.isFollowedByMe}
								disabled={isSendingFollow || isSendingUnfollow}
								onClick={handleToggleFollow}>
								{profile.isFollowedByMe ? "Following" : "Follow"}
							</button>
							<button
								type="button"
								className={styles.messageButton}
								disabled={isStartingConversation}
								onClick={handleMessage}>
								Message
							</button>
						</div>
					)}
				</div>
			</header>

			<section className={styles.tabsSection}>
				<div
					className={styles.tabs}
					role="tablist">
					<button
						type="button"
						role="tab"
						aria-selected={activeTab === "posts"}
						className={styles.tabButton}
						data-active={activeTab === "posts"}
						onClick={() => setActiveTab("posts")}>
						Posts
					</button>
					<button
						type="button"
						role="tab"
						aria-selected={activeTab === "portfolio"}
						className={styles.tabButton}
						data-active={activeTab === "portfolio"}
						onClick={() => setActiveTab("portfolio")}>
						Portfolio
					</button>
					{profile.role === "artist" && (
						<button
							type="button"
							role="tab"
							aria-selected={activeTab === "availability"}
							className={styles.tabButton}
							data-active={activeTab === "availability"}
							onClick={() => setActiveTab("availability")}>
							Availability
						</button>
					)}
				</div>

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
									<button
										type="button"
										className={styles.createButton}
										onClick={openComposer}>
										Create Your First Post
									</button>
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
							<div className={styles.portfolioActions}>
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
			</section>
		</main>
	);
}

export default ProfilePage;
