import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCreatePieceMutation, useAddVignetteMutation } from "../piecesApi";
import { uploadFileToR2 } from "../../../shared/uploadClient";
import { Form } from "../../../components";

const mediaTypeOptions = [
	{ label: "Image", value: "image" },
	{ label: "Video", value: "video" },
	{ label: "Audio", value: "audio" },
	{ label: "3D Model", value: "model" },
] as const;

export function FormPieceCreate() {
	const navigate = useNavigate();

	const [description, setDescription] = useState("");
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [mediaType, setMediaType] = useState<"image" | "video" | "audio" | "model">("image");
	const [isUploadingFile, setIsUploadingFile] = useState(false);

	const [createPiece, { isLoading: isCreatingPiece, error: pieceError }] = useCreatePieceMutation();
	const [addVignette, { isLoading: isAddingVignette }] = useAddVignetteMutation();

	const handleClose = () => {
		navigate(-1);
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			const file = e.target.files[0];
			setSelectedFile(file);

			if (file.type.startsWith("image/")) setMediaType("image");
			else if (file.type.startsWith("video/")) setMediaType("video");
			else if (file.type.startsWith("audio/")) setMediaType("audio");
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		try {
			const pieceResponse = await createPiece({
				description: description.trim() || null,
			}).unwrap();

			const createdPiece = pieceResponse.work;

			if (selectedFile && createdPiece.createdAt) {
				try {
					setIsUploadingFile(true);

					const { objectKey } = await uploadFileToR2(selectedFile);

					await addVignette({
						intermezzoId: createdPiece.createdAt,
						body: {
							mediaType,
							objectKey,
							mimeType: selectedFile.type || undefined,
							fileSizeBytes: selectedFile.size,
							sortOrder: 0,
						},
					}).unwrap();
				} catch (uploadError) {
					console.error("Piece created, but media upload failed:", uploadError);
				} finally {
					setIsUploadingFile(false);
				}
			}

			navigate(-1);
		} catch (err) {
			console.error("Failed to create piece:", err);
		}
	};

	const isLoading = isCreatingPiece || isAddingVignette || isUploadingFile;

	return (
		<Form
			title="Create New Piece"
			onSubmit={handleSubmit}
			header={
				<Form.Header
					right={
						<Form.ToggleButton
							onClick={handleClose}
							disabled={isLoading}>
							Cancel
						</Form.ToggleButton>
					}
				/>
			}>
			{pieceError && (
				<Form.ErrorMessage>Failed to create piece. Please check your inputs and try again.</Form.ErrorMessage>
			)}

			<Form.Field>
				<Form.Label htmlFor="description">Description / Overview</Form.Label>
				<Form.TextArea
					id="description"
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					placeholder="Describe the main concept or story behind this piece..."
					rows={4}
					disabled={isLoading}
				/>
			</Form.Field>

			<Form.Field>
				<Form.Label htmlFor="file">Initial Media (Optional)</Form.Label>
				<Form.FileInput
					id="file"
					file={selectedFile}
					buttonText="Choose Media File"
					onChange={handleFileChange}
					disabled={isLoading}
				/>
			</Form.Field>

			<Form.Field>
				<Form.Label>Media Type</Form.Label>
				<Form.OptionGroup
					options={mediaTypeOptions}
					value={mediaType}
					onChange={(val) => setMediaType(val)}
				/>
			</Form.Field>

			<Form.Submit disabled={isLoading}>{isLoading ? "Publishing..." : "Publish Piece"}</Form.Submit>
		</Form>
	);
}
