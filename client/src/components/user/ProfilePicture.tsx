interface ProfilePictureProps {
	isLoading?: boolean;
	isDefault?: boolean;
	variant: "nav" | "profile";
}

function ProfilePicture({ isLoading = false, isDefault = true, variant }: ProfilePictureProps) {
	if (isLoading || isDefault || variant == "profile") return <div>PFP</div>;
	return <div>PFP</div>;
}

export default ProfilePicture;
