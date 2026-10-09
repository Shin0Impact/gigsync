import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCreatePieceMutation, useAddVignetteMutation } from "../piecesApi";
import { uploadFileToR2 } from "../../../shared/uploadClient";
import styles from "./CreatePieceForm.module.css";

export function CreatePieceForm() {
	const navigate = useNavigate();

	const [description, setDescription] = useState("");
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [mediaType, setMediaType] = useState<"image" | "video" | "audio" | "model">("image");
	const [isUploadingFile, setIsUploadingFile] = useState(false);

	const [createPiece, { isLoading: isCreatingPiece, error: pieceError }] =
		useCreatePieceMutation();
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
		<div className={styles.overlay}>
			{/* Top Header */}
			<header className={styles.header}>
				<div>
					<h2 className={styles.title}>Create New Piece</h2>
				</div>
				<button
					type="button"
					onClick={handleClose}
					className={styles.closeButton}
					disabled={isLoading}>
					Cancel
				</button>
			</header>

			<div className={styles.content}>
				<form
					onSubmit={handleSubmit}
					className={styles.form}>
					{pieceError && (
						<div className={styles.errorMessage}>
							Failed to create piece. Please check your inputs and try again.
						</div>
					)}

					<div className={styles.fieldGroup}>
						<label
							htmlFor="description"
							className={styles.label}>
							Description / Overview
						</label>
						<textarea
							id="description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Describe the main concept or story behind this piece..."
							rows={4}
							className={styles.textarea}
							disabled={isLoading}
						/>
					</div>

					<hr className={styles.divider} />

					<div className={styles.section}>
						<h3 className={styles.sectionTitle}>Initial Vignette (Media)</h3>
						<p className={styles.sectionDescription}>
							Attach initial media to launch your piece's first Intermezzo.
						</p>

						<div className={styles.fieldGroup}>
							<label
								htmlFor="file"
								className={styles.label}>
								Select File
							</label>
							<input
								id="file"
								type="file"
								onChange={handleFileChange}
								className={styles.input}
								disabled={isLoading}
							/>
						</div>

						<div className={styles.fieldGroup}>
							<label
								htmlFor="mediaType"
								className={styles.label}>
								Media Type
							</label>
							<select
								id="mediaType"
								value={mediaType}
								onChange={(e) =>
									setMediaType(
										e.target.value as "image" | "video" | "audio" | "model",
									)
								}
								className={styles.select}
								disabled={isLoading}>
								<option value="image">Image</option>
								<option value="video">Video</option>
								<option value="audio">Audio</option>
								<option value="model">3D Model</option>
							</select>
						</div>
					</div>

					<div className={styles.actions}>
						<button
							type="button"
							onClick={handleClose}
							className={styles.cancelButton}
							disabled={isLoading}>
							Cancel
						</button>
						<button
							type="submit"
							className={styles.submitButton}
							disabled={isLoading}>
							{isLoading ? "Publishing..." : "Publish Piece"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
