import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation, matchPath } from "react-router-dom";
import { useMeQuery } from "../../auth/authApi";
import { useListPiecesQuery, useCreatePieceMutation, useAddIntermezzoMutation, useAddVignetteMutation } from "../piecesApi";
import { uploadFileToR2 } from "../../../shared/uploadClient";
import { Form } from "@components";
import { IWork } from "@shared/types/social";
import { ROUTES } from "../../../routes/routePaths";

export function FormIntermezzoCreate() {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const location = useLocation();

	const isDrawerOpen = searchParams.get("drawer") === "open";
	const queryPieceId = searchParams.get("pieceId") ? Number(searchParams.get("pieceId")) : undefined;

	// Match path against /pieces/:id to read ID from URL params if present
	const match = matchPath({ path: "/pieces/:id", end: true }, location.pathname);
	const paramPieceId = match?.params.id ? Number(match.params.id) : undefined;

	// Priority: URL query param -> route param -> undefined
	const initialPieceId = queryPieceId ?? paramPieceId;

	const { data: meData, isLoading: isLoadingMe } = useMeQuery();
	const userId = meData?.user?.userId;

	const { data: userPiecesData, isLoading: isLoadingPieces } = useListPiecesQuery(userId!, {
		skip: !userId,
	});

	const hasPieces = Boolean(userPiecesData?.works && userPiecesData.works.length > 0);

	const [selectedPieceId, setSelectedPieceId] = useState<number | undefined>(initialPieceId);
	const [isCreatingNewPiece, setIsCreatingNewPiece] = useState(false);
	const [newPieceTitle, setNewPieceTitle] = useState("");
	const [description, setDescription] = useState("");
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [mediaType, setMediaType] = useState<"image" | "video" | "audio">("image");
	const [isUploadingFile, setIsUploadingFile] = useState(false);

	// Reset form data completely when the drawer parameter transitions from open to closed
	useEffect(() => {
		if (!isDrawerOpen) {
			setSelectedPieceId(initialPieceId);
			setIsCreatingNewPiece(false);
			setNewPieceTitle("");
			setDescription("");
			setSelectedFile(null);
			setMediaType("image");
		}
	}, [isDrawerOpen, initialPieceId]);

	const [createPiece, { isLoading: isCreatingPiece }] = useCreatePieceMutation();
	const [addIntermezzo, { isLoading: isAddingIntermezzo, error: intermezzoError }] = useAddIntermezzoMutation();
	const [addVignette, { isLoading: isAddingVignette }] = useAddVignetteMutation();

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			const file = e.target.files[0];
			setSelectedFile(file);

			if (file.type.startsWith("image/")) setMediaType("image");
			else if (file.type.startsWith("video/")) setMediaType("video");
			else if (file.type.startsWith("audio/")) setMediaType("audio");
		}
	};

	const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const val = e.target.value;
		if (val === "NEW") {
			setIsCreatingNewPiece(true);
			setSelectedPieceId(undefined);
		} else {
			setIsCreatingNewPiece(false);
			setSelectedPieceId(val ? Number(val) : undefined);
		}
	};

	const handleSwitchToExisting = () => {
		setIsCreatingNewPiece(false);
		setNewPieceTitle("");
		setSelectedPieceId(initialPieceId);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!isCreatingNewPiece && !selectedPieceId) return;
		if (isCreatingNewPiece && !newPieceTitle.trim()) return;

		try {
			let targetPieceId = selectedPieceId;

			if (isCreatingNewPiece) {
				const pieceResponse = await createPiece({
					title: newPieceTitle.trim(),
					description: null,
				}).unwrap();
				targetPieceId = pieceResponse.work.id;
			}

			if (!targetPieceId) return;

			const intermezzoResponse = await addIntermezzo({
				pieceId: targetPieceId,
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

			// navigate(-1);
			navigate(ROUTES.SINGLE_PIECE(intermezzoResponse.update.workId));
		} catch (err) {
			console.error("Failed to create intermezzo or piece:", err);
		}
	};

	const isLoading =
		isLoadingMe || isLoadingPieces || isCreatingPiece || isAddingIntermezzo || isAddingVignette || isUploadingFile;

	return (
		<Form
			title="New Intermezzo"
			onSubmit={handleSubmit}
			isDrawer={true}>
			{intermezzoError && (
				<Form.ErrorMessage>Failed to create intermezzo. Please check your inputs and try again.</Form.ErrorMessage>
			)}

			<Form.Field>
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						marginBottom: "0.25rem",
					}}>
					<Form.Label htmlFor="piece">Piece</Form.Label>
					{isCreatingNewPiece && hasPieces && (
						<button
							type="button"
							onClick={handleSwitchToExisting}
							style={{
								background: "none",
								border: "none",
								cursor: "pointer",
								color: "var(--color-accent)",
								fontSize: "0.8rem",
								textDecoration: "underline",
								padding: 0,
							}}>
							← Choose existing piece
						</button>
					)}
				</div>

				{isCreatingNewPiece ? (
					<Form.Input
						id="newPieceTitle"
						type="text"
						value={newPieceTitle}
						onChange={(e) => setNewPieceTitle(e.target.value)}
						placeholder="Type new piece name..."
						disabled={isLoading}
						autoFocus
						required
					/>
				) : (
					<Form.Select
						id="pieceId"
						value={selectedPieceId ?? ""}
						onChange={handleSelectChange}
						required
						disabled={isLoading}>
						<option value="">{isLoadingPieces ? "Loading your Pieces..." : "-- Select a Piece --"}</option>
						<option value="NEW">+ Create New Piece</option>
						{userPiecesData?.works?.map((piece: IWork) => (
							<option
								key={piece.id}
								value={piece.id}>
								{piece.title}
							</option>
						))}
					</Form.Select>
				)}
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

			<Form.Submit
				disabled={
					isLoading || (!isCreatingNewPiece && !selectedPieceId) || (isCreatingNewPiece && !newPieceTitle.trim())
				}>
				{isLoading ? "Publishing..." : "Post Intermezzo"}
			</Form.Submit>
		</Form>
	);
}

export default FormIntermezzoCreate;
