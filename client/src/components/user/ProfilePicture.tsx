import styles from "./ProfilePicture.module.css";
import { getMediaUrl } from "../../shared/mediaUrl";

interface ProfilePictureProps {
	avatarUrl?: string | null;
	userName?: string | null;
	isLoading?: boolean;
	variant: "nav" | "profile";
	className?: string;
}

function initials(userName?: string | null): string {
	if (!userName) return "?";
	return userName.trim().slice(0, 2).toUpperCase();
}

function ProfilePicture({
	avatarUrl,
	userName,
	isLoading = false,
	variant,
	className = "",
}: ProfilePictureProps) {
	const combined = `${styles.picture} ${className}`.trim();

	if (isLoading) {
		return (
			<div
				className={combined}
				data-variant={variant}
				data-state="loading"
				aria-hidden="true"
			/>
		);
	}

	if (avatarUrl) {
		return (
			<img
				src={getMediaUrl(avatarUrl)}
				alt={userName ? `${userName}'s avatar` : "Profile picture"}
				className={combined}
				data-variant={variant}
			/>
		);
	}

	return (
		<div
			className={combined}
			data-variant={variant}
			data-state="placeholder"
			aria-hidden={!userName}>
			{initials(userName)}
		</div>
	);
}

export default ProfilePicture;
