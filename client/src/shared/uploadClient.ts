interface PresignedUrlResponse {
	uploadUrl: string;
	objectKey: string;
}

// Same base URL the RTK Query client uses. In dev it falls back to "" so the
// relative path still goes through Vite's /api proxy; in production it must be
// the Render API origin, otherwise the request hits the static frontend (405).
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/+$/, "");

export async function uploadFileToR2(file: File): Promise<{ objectKey: string }> {
	const res = await fetch(`${API_BASE_URL}/api/media/upload-url`, {
		method: "POST",
		credentials: "include",
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
