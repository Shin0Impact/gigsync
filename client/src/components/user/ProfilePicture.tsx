import styles from "./ProfilePicture.module.css";

interface ProfilePictureProps {
	name?: string;
	variant?: "page" | "profile";
}

function ProfilePicture({ name = "User", variant = "page" }: ProfilePictureProps) {
	const initial = name.charAt(0);

	return (
		<div className={styles.profilePic}>
			<div className={styles.iniital}></div>
		</div>
	);
}

export default ProfilePicture;
