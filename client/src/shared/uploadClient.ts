import axios, { type AxiosProgressEvent } from "axios";

export const uploadClient = axios.create({
	baseURL: import.meta.env.VITE_API_BASE_URL,
	withCredentials: true,
});

interface UploadOptions {
	onProgress?: (percent: number) => void;
	signal?: AbortSignal;
}

export async function uploadFile(
	url: string,
	formData: FormData,
	{ onProgress, signal }: UploadOptions = {},
) {
	const { data } = await uploadClient.post(url, formData, {
		signal,
		onUploadProgress: (e: AxiosProgressEvent) => {
			if (onProgress && e.total) {
				onProgress(Math.round((e.loaded / e.total) * 100));
			}
		},
	});
	return data;
}
