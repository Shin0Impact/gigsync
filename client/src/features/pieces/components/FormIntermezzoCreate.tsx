import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMeQuery } from "../../auth/authApi";
import { useListPiecesQuery, useAddIntermezzoMutation, useAddVignetteMutation } from "../piecesApi";
import { uploadFileToR2 } from "../../../shared/uploadClient";
import { Form } from "../../../components";

// const mediaTypeOptions = [
// 	{ label: "Image", value: "image" },
// 	{ label: "Video", value: "video" },
// 	{ label: "Audio", value: "audio" },
// ] as const;

export function FormIntermezzoCreate() {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();

	const { data: meData, isLoading: isLoadingMe } = useMeQuery();
	const userId = meData?.user?.userId;

	const initialPieceId = searchParams.get("pieceId") ? Number(searchParams.get("pieceId")) : undefined;

	const [selectedPieceId, setSelectedPieceId] = useState<number | undefined>(initialPieceId);
	const [description, setDescription] = useState("");
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [mediaType, setMediaType] = useState<"image" | "video" | "audio">("image");
	const [isUploadingFile, setIsUploadingFile] = useState(false);

	const { data: userPiecesData, isLoading: isLoadingPieces } = useListPiecesQuery(userId!, {
		skip: !userId,
	});

	// Auto-select the first (most recently updated) piece if none is specified in query params
	useEffect(() => {
		if (!initialPieceId && !selectedPieceId && userPiecesData?.works?.length) {
			setSelectedPieceId(userPiecesData.works[0].id);
		}
	}, [initialPieceId, selectedPieceId, userPiecesData]);

	const [addIntermezzo, { isLoading: isAddingIntermezzo, error: intermezzoError }] = useAddIntermezzoMutation();
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

	const isLoading = isLoadingMe || isLoadingPieces || isAddingIntermezzo || isAddingVignette || isUploadingFile;

	return (
		<Form
			title="New Intermezzo"
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
			{intermezzoError && (
				<Form.ErrorMessage>Failed to create intermezzo. Please check your inputs and try again.</Form.ErrorMessage>
			)}

			<Form.Field>
				<Form.Label htmlFor="pieceId">Select Piece</Form.Label>
				<Form.Select
					id="pieceId"
					value={selectedPieceId ?? ""}
					onChange={(e) => setSelectedPieceId(Number(e.target.value))}
					required
					disabled={isLoading || Boolean(initialPieceId)}>
					{isLoadingPieces && <option value="">Loading your Pieces...</option>}
					{userPiecesData?.works?.map((piece) => (
						<option
							key={piece.id}
							value={piece.id}>
							{piece.description ? piece.description.slice(0, 40) : `Piece #${piece.id}`}
						</option>
					))}
				</Form.Select>
			</Form.Field>

			<Form.Field>
				<Form.Label htmlFor="description">Log / Update Notes</Form.Label>
				<Form.TextArea
					id="description"
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					placeholder="What changes or progress did you make in this step?"
					rows={4}
					disabled={isLoading}
				/>
			</Form.Field>

			<Form.Field>
				<Form.Label htmlFor="file">Attach Vignette (Media)</Form.Label>
				<Form.FileInput
					id="file"
					file={selectedFile}
					buttonText="Choose Media File"
					onChange={handleFileChange}
					disabled={isLoading}
				/>
			</Form.Field>

			{/* <Form.Field>
				<Form.Label>Media Type</Form.Label>
				<Form.OptionGroup
					options={mediaTypeOptions}
					value={mediaType}
					onChange={(val) => setMediaType(val)}
				/>
			</Form.Field> */}

			<Form.Submit disabled={isLoading || !selectedPieceId}>
				{isLoading ? "Publishing..." : "Post Intermezzo"}
			</Form.Submit>
		</Form>
	);
}
