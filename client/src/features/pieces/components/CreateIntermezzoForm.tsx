import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMeQuery } from "../../auth/authApi";
import { useListPiecesQuery, useAddIntermezzoMutation, useAddVignetteMutation } from "../piecesApi";
import { uploadFileToR2 } from "../../../shared/uploadClient";
import styles from "./CreateIntermezzoForm.module.css";

export function CreateIntermezzoForm() {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();

	const { data: meData, isLoading: isLoadingMe } = useMeQuery();
	const userId = meData?.user?.userId;

	const initialPieceId = searchParams.get("pieceId")
		? Number(searchParams.get("pieceId"))
		: undefined;

	const [selectedPieceId, setSelectedPieceId] = useState<number | undefined>(initialPieceId);
	// const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [mediaType, setMediaType] = useState<"image" | "video" | "audio" | "model">("image");
	const [isUploadingFile, setIsUploadingFile] = useState(false);

	const { data: userPiecesData, isLoading: isLoadingPieces } = useListPiecesQuery(userId!, {
		skip: !userId,
	});

	const [addIntermezzo, { isLoading: isAddingIntermezzo, error: intermezzoError }] =
		useAddIntermezzoMutation();
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

		if (!selectedPieceId) return;

		try {
			const intermezzoResponse = await addIntermezzo({
				pieceId: selectedPieceId,
				body: {
					// title: title.trim() || undefined,
					description: description.trim() || undefined,
				},
			}).unwrap();

			const createdIntermezzoId = intermezzoResponse.update.id;

			if (selectedFile && createdIntermezzoId) {
				try {
					setIsUploadingFile(true);

					const { objectKey } = await uploadFileToR2(selectedFile);

					await addVignette({
						intermezzoId: createdIntermezzoId,
						body: {
							mediaType,
							objectKey,
							mimeType: selectedFile.type || undefined,
							fileSizeBytes: selectedFile.size,
							sortOrder: 0,
						},
					}).unwrap();
				} catch (uploadError) {
					console.error("Intermezzo created, but media upload failed:", uploadError);
				} finally {
					setIsUploadingFile(false);
				}
			}

			navigate(-1);
		} catch (err) {
			console.error("Failed to create intermezzo:", err);
		}
	};

	const isLoading =
		isLoadingMe || isLoadingPieces || isAddingIntermezzo || isAddingVignette || isUploadingFile;

	return (
		<div className={styles.formWrapper}>
			{/* Header */}
			<header className={styles.formHeader}>
				<button
					type="button"
					onClick={handleClose}
					className={styles.closeButton}
					disabled={isLoading}>
					Cancel
				</button>
			</header>

			<div className={styles.formBody}>
				<h1 className={styles.title}>New Intermezzo</h1>

				<form
					onSubmit={handleSubmit}
					className={styles.form}>
					{intermezzoError && (
						<div className={styles.errorMessage}>
							Failed to create intermezzo. Please check your inputs and try again.
						</div>
					)}

					<div className={styles.fieldGroup}>
						<label
							htmlFor="pieceId"
							className={styles.label}>
							Select Piece *
						</label>
						<select
							id="pieceId"
							value={selectedPieceId ?? ""}
							onChange={(e) => setSelectedPieceId(Number(e.target.value))}
							className={styles.select}
							required
							disabled={isLoading || Boolean(initialPieceId)}>
							<option
								value=""
								disabled>
								{isLoadingPieces
									? "Loading your Pieces..."
									: "-- Choose a Piece --"}
							</option>
							{userPiecesData?.works?.map((piece) => (
								<option
									key={piece.id}
									value={piece.id}>
									{piece.description
										? piece.description.slice(0, 40)
										: `Piece #${piece.id}`}
								</option>
							))}
						</select>
					</div>

					{/* <div className={styles.fieldGroup}>
						<label
							htmlFor="title"
							className={styles.label}>
							Intermezzo Title 
						</label>
						<input
							id="title"
							type="text"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder=""
							className={styles.input}
							disabled={isLoading}
						/>
					</div> */}

					<div className={styles.fieldGroup}>
						<label
							htmlFor="description"
							className={styles.label}>
							Log / Update Notes
						</label>
						<textarea
							id="description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="What changes or progress did you make in this step?"
							rows={4}
							className={styles.textarea}
							disabled={isLoading}
						/>
					</div>

					<hr className={styles.divider} />

					<div className={styles.section}>
						<h3 className={styles.sectionTitle}>Attach Vignette (Media)</h3>

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
									setMediaType(e.target.value as "image" | "video" | "audio")
								}
								className={styles.select}
								disabled={isLoading}>
								<option value="image">Image</option>
								<option value="video">Video</option>
								<option value="audio">Audio</option>
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
							disabled={isLoading || !selectedPieceId}>
							{isLoading ? "Publishing..." : "Post Intermezzo"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
