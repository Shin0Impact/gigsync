import { useParams } from "react-router-dom";
import { useGetProfileQuery, useFollowProfileMutation, useUnfollowProfileMutation } from "../features/profiles";
import { useListPiecesQuery } from "../features/pieces";
import { PieceCard } from "../features/pieces/components";
import ProfilePicture from "../components/user/ProfilePicture";
import styles from "./ProfilePage.module.css";

// Viewing your own profile or someone else's - isOwnProfile/isFollowedByMe
// come back pre-resolved from the server (see get_profile_by_username in
// profiles.service.ts) so this page never has to compare ids itself.
export function ProfilePage() {
	const { username } = useParams<{ username: string }>();

	const { data, isLoading, error } = useGetProfileQuery(username ?? "", { skip: !username });
	const profile = data?.profile;

	const { data: piecesData, isLoading: isLoadingPieces } = useListPiecesQuery(profile?.userId ?? "", {
		skip: !profile,
	});
	const pieces = piecesData?.works ?? [];

	const [followProfile, { isLoading: isSendingFollow }] = useFollowProfileMutation();
	const [unfollowProfile, { isLoading: isSendingUnfollow }] = useUnfollowProfileMutation();

	if (isLoading) return <div className={styles.loading}>Loading profile…</div>;
	if (error || !profile) return <div className={styles.error}>This profile could not be found.</div>;

	const handleToggleFollow = () => {
		if (!username) return;
		if (profile.isFollowedByMe) {
			unfollowProfile(username);
		} else {
			followProfile(username);
		}
	};

	return (
		<main className={styles.container}>
			<header className={styles.profileHeader}>
				<ProfilePicture
					avatarUrl={profile.avatarUrl}
					userName={profile.userName}
					variant="profile"
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
						<button
							type="button"
							className={styles.followButton}
							data-following={profile.isFollowedByMe}
							disabled={isSendingFollow || isSendingUnfollow}
							onClick={handleToggleFollow}>
							{profile.isFollowedByMe ? "Following" : "Follow"}
						</button>
					)}
				</div>
			</header>

			<section className={styles.piecesSection}>
				<h2 className={styles.sectionTitle}>Pieces</h2>

				{isLoadingPieces && <div className={styles.loading}>Loading pieces…</div>}

				{!isLoadingPieces && pieces.length === 0 && (
					<p className={styles.emptyText}>
						{profile.isOwnProfile ? "You haven't shared any pieces yet." : `${profile.userName} hasn't shared any pieces yet.`}
					</p>
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
			</section>
		</main>
	);
}

export default ProfilePage;
