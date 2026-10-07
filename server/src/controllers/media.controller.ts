import { Request, Response } from "express";
import { request_upload_url } from "../services/media.service";
import { RequestUploadUrlInput, UploadUrlResult, ErrorResponse } from "../types";

export async function get_upload_url(
	req: Request<{}, unknown, RequestUploadUrlInput>,
	res: Response<UploadUrlResult | ErrorResponse>,
) {
	try {
		const { fileName, contentType, fileSizeBytes, folder } = req.body;

		const result = await request_upload_url({ fileName, contentType, fileSizeBytes, folder });

		return res.status(200).json(result);
	} catch (error) {
		if (
			error instanceof Error &&
			(error.message === "fileName, contentType, and fileSizeBytes are required" ||
				error.message === "fileSizeBytes must be a positive number" ||
				error.message.startsWith("Unsupported contentType") ||
				error.message.endsWith("byte limit"))
		) {
			return res.status(400).json({ error: error.message });
		}

		console.error("Failed to generate upload URL:", error);
		return res.status(500).json({ error: "Failed to generate upload URL" });
	}
}
