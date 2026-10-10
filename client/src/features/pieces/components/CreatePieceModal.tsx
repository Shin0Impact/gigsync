import { useState, type ChangeEvent, type FormEvent } from "react";
import { useCreatePieceMutation, useAddIntermezzoMutation, useAddVignetteMutation } from "../piecesApi";
import { uploadFileToR2 } from "../../../shared/uploadClient";
import styles from "./CreatePieceModal.module.css";

interface CreatePieceModalProps {
	isOpen: boolean;
	onClose: () => void;
}

type MediaType = "image" | "video" | "audio" | "model";

function inferMediaType(file: File): MediaType {
	if (file.type.startsWith("image/")) return "image";
	if (file.type.startsWith("video/")) return "video";
	if (file.type.startsWith("audio/")) return "audio";
	return "image";
}

export function CreatePieceModal({ isOpen, onClose }: CreatePieceModalProps) {
	const [description, setDescription] = useState("");
	const [files, setFiles] = useState<File[]>([]);
	const [uploadStatus, setUploadStatus] = useState<string | null>(null);

	const [createPiece, { isLoading: isCreatingPiece, error: pieceError }] = useCreatePieceMutation();
	const [addIntermezzo, { isLoading: isCreatingIntermezzo }] = useAddIntermezzoMutation();
	const [addVignette, { isLoading: isAddingVignette }] = useAddVignetteMutation();

	const isLoading = isCreatingPiece || isCreatingIntermezzo || isAddingVignette;

	if (!isOpen) return null;

	function handleFilesChange(e: ChangeEvent<HTMLInputElement>) {
		if (e.target.files && e.target.files.length > 0) {
			setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
		}
		e.target.value = "";
	}

	function handleRemoveFile(index: number) {
		setFiles((prev) => prev.filter((_, i) => i !== index));
	}

	function handleClose() {
		if (isLoading) return;
		setDescription("");
		setFiles([]);
		setUploadStatus(null);
		onClose();
	}

	async function handleSubmit(e: FormEvent) {
		e.preventDefault();

		try {
			const pieceResponse = await createPiece({
				description: description.trim() || null,
			}).unwrap();

			const pieceId = pieceResponse.work.id;

			// Media hangs off an intermezzo (work_update), not the piece itself -
			// so attaching files means creating one carrying intermezzo first,
			// then attaching each file to it as its own vignette.
			if (files.length > 0) {
				const updateResponse = await addIntermezzo({
					pieceId,
					body: { description: null },
				}).unwrap();

				const intermezzoId = updateResponse.update.id;

				for (let i = 0; i < files.length; i++) {
					const file = files[i];
					setUploadStatus(`Uploading ${i + 1} of ${files.length}…`);

					const { objectKey } = await uploadFileToR2(file);

					await addVignette({
						intermezzoId,
						body: {
							mediaType: inferMediaType(file),
							objectKey,
							mimeType: file.type || undefined,
							fileSizeBytes: file.size,
							sortOrder: i,
						},
					}).unwrap();
				}
			}

			handleClose();
		} catch (err) {
			console.error("Failed to create piece:", err);
			setUploadStatus(null);
		}
	}

	return (
		<div
			className={styles.backdrop}
			onClick={handleClose}>
			<div
				className={styles.modal}
				onClick={(e) => e.stopPropagation()}>
				<header className={styles.header}>
					<h2 className={styles.title}>New Piece</h2>
					<button
						type="button"
						className={styles.closeButton}
						onClick={handleClose}
						disabled={isLoading}>
						Cancel
					</button>
				</header>

				<form
					onSubmit={handleSubmit}
					className={styles.form}>
					{pieceError && (
						<p
							className={styles.errorMessage}
							role="alert">
							Failed to create piece. Please check your inputs and try again.
						</p>
					)}

					<div className={styles.field}>
						<label
							htmlFor="composer-description"
							className={styles.label}>
							Description
						</label>
						<textarea
							id="composer-description"
							className={styles.textarea}
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="What are you working on?"
							rows={4}
							disabled={isLoading}
							autoFocus
						/>
					</div>

					<div className={styles.field}>
						<input
							id="composer-attach"
							type="file"
							multiple
							className={styles.fileInputHidden}
							onChange={handleFilesChange}
							disabled={isLoading}
						/>
						<label
							htmlFor="composer-attach"
							className={styles.attachButton}>
							<AttachIcon />
							{files.length > 0 ? `${files.length} file${files.length === 1 ? "" : "s"} attached` : "Attach files"}
						</label>

						{files.length > 0 && (
							<ul className={styles.fileList}>
								{files.map((file, index) => (
									<li
										key={`${file.name}-${index}`}
										className={styles.fileItem}>
										<span className={styles.fileName}>{file.name}</span>
										<button
											type="button"
											className={styles.removeFileButton}
											onClick={() => handleRemoveFile(index)}
											disabled={isLoading}
											aria-label={`Remove ${file.name}`}>
											×
										</button>
									</li>
								))}
							</ul>
						)}
					</div>

					<button
						type="submit"
						className={styles.submitButton}
						disabled={isLoading}>
						{uploadStatus ?? (isLoading ? "Publishing…" : "Post")}
					</button>
				</form>
			</div>
		</div>
	);
}

function AttachIcon() {
	return (
		<svg
			width="18"
			height="18"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true">
			<path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
		</svg>
	);
}
