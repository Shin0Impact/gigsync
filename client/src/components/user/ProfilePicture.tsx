interface ProfilePictureProps {
	isLoading?: boolean;
	isDefault?: boolean;
	variant: "nav" | "profile";
}

function ProfilePicture({ isLoading = false, isDefault = true, variant }: ProfilePictureProps) {
	if (isLoading || isDefault || variant == "profile") return <div>ProfilePicture</div>;
	return <div>ProfilePicture</div>;
}

export default ProfilePicture;
