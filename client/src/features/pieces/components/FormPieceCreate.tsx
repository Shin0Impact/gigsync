import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCreatePieceMutation } from "../piecesApi";
import { Form } from "@components";

export function FormPieceCreate() {
	const navigate = useNavigate();

	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");

	const [createPiece, { isLoading, error }] = useCreatePieceMutation();

	const handleClose = () => {
		navigate(-1);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		try {
			// 1. Create the parent Piece
			const pieceResponse = await createPiece({
				title: title.trim() || null,
				description: description.trim() || null,
			}).unwrap();

			const createdPieceId = pieceResponse.work.id;

			// 2. Navigate directly to the newly created piece with the drawer open
			navigate(`/pieces/${createdPieceId}?drawer=open`, { replace: true });
		} catch (err) {
			console.error("Failed to create piece:", err);
		}
	};

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
			{error && <Form.ErrorMessage>Failed to create piece. Please check your inputs and try again.</Form.ErrorMessage>}

			<Form.Field>
				<Form.Label htmlFor="title">Piece Title</Form.Label>
				<Form.Input
					id="title"
					type="text"
					value={title}
					onChange={(e) => setTitle(e.target.value)}
					placeholder="Enter piece title..."
					disabled={isLoading}
					autoFocus
					required
				/>
			</Form.Field>

			<Form.Field>
				<Form.Label htmlFor="description">Description</Form.Label>
				<Form.TextArea
					id="description"
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					placeholder="Describe the main concept or story behind this piece..."
					rows={4}
					disabled={isLoading}
				/>
			</Form.Field>

			<Form.Submit disabled={isLoading}>{isLoading ? "Creating Piece..." : "Continue to Piece →"}</Form.Submit>
		</Form>
	);
}

export default FormPieceCreate;
