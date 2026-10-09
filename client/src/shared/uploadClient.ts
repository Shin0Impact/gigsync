interface PresignedUrlResponse {
	uploadUrl: string;
	objectKey: string;
}

export async function uploadFileToR2(file: File): Promise<{ objectKey: string }> {
	const res = await fetch("/api/media/upload-url", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			fileName: file.name,
			contentType: file.type,
			fileSizeBytes: file.size,
		}),
	});

	if (!res.ok) throw new Error("Failed to get presigned upload URL");
	const { uploadUrl, objectKey }: PresignedUrlResponse = await res.json();

	const uploadRes = await fetch(uploadUrl, {
		method: "PUT",
		headers: { "Content-Type": file.type },
		body: file,
	});

	if (!uploadRes.ok) throw new Error("Failed to upload binary file to storage");

	return { objectKey };
}
