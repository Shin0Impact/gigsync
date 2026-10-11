import React, { useState } from "react";
import { useMeQuery } from "../../auth";
import { useListPiecesQuery } from "../../pieces";
import { useListMyApplicationsQuery } from "../../events";
import { Form } from "@components";
import { useAddToPortfolioMutation } from "../portfolioApi";
import { AddShowcaseItemInput } from "@shared/types/index";

interface FormAddToPortfolioProps {
	onSuccess?: () => void;
}

export function FormAddToPortfolio({ onSuccess }: FormAddToPortfolioProps) {
	const { data: meData } = useMeQuery();
	const userId = meData?.user?.userId;

	const [sourceType, setSourceType] = useState<"work" | "event">("work");
	const [sourceId, setSourceId] = useState<string>("");

	const { data: piecesData, isLoading: isLoadingPieces } = useListPiecesQuery(userId!, {
		skip: !userId,
	});
	const pieces = piecesData?.works ?? [];

	// Only events the artist has actually been accepted into make sense to
	// showcase - applications table has no "my events" concept otherwise.
	const { data: applicationsData, isLoading: isLoadingEvents } = useListMyApplicationsQuery();
	const acceptedEvents = (applicationsData?.applications ?? []).filter(
		(application) => application.status === "accepted",
	);

	const [addToPortfolio, { isLoading: isAdding, error }] = useAddToPortfolioMutation();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!sourceId) return;

		try {
			const payload: AddShowcaseItemInput = { sourceType, sourceId: Number.parseInt(sourceId) };
			await addToPortfolio(payload).unwrap();
			onSuccess?.();
		} catch (err) {
			console.error("Failed to pin item:", err);
		}
	};

	return (
		<Form
			title="Add to Portfolio"
			onSubmit={handleSubmit}>
			<Form.Field>
				<Form.Label>Content Type</Form.Label>
				<Form.OptionGroup
					options={[
						{ label: "Piece", value: "work" },
						{ label: "Event", value: "event" },
					]}
					value={sourceType}
					onChange={(val) => {
						setSourceType(val);
						setSourceId("");
					}}
				/>
			</Form.Field>

			<Form.Field>
				<Form.Label htmlFor="sourceSelect">Select {sourceType === "work" ? "Piece" : "Event"}</Form.Label>
				<Form.Select
					id="sourceSelect"
					value={sourceId}
					onChange={(e) => setSourceId(e.target.value)}
					disabled={isLoadingPieces}
					required>
					<option value="">{isLoadingPieces ? "Loading options..." : `-- Choose a ${sourceType} --`}</option>

					{sourceType === "work" &&
						pieces.map((piece: any) => (
							<option
								key={piece.id}
								value={piece.id}>
								Work #{piece.id} {piece.description ? `- ${piece.description.substring(0, 30)}...` : ""}
							</option>
						))}

					{sourceType === "event" &&
						(isLoadingEvents ? (
							<option
								value=""
								disabled>
								Loading your events...
							</option>
						) : acceptedEvents.length === 0 ? (
							<option
								value=""
								disabled>
								No accepted events yet
							</option>
						) : (
							acceptedEvents.map((application) => (
								<option
									key={application.event_id}
									value={application.event_id}>
									{application.event_title}
								</option>
							))
						))}
				</Form.Select>
			</Form.Field>

			{error && <Form.ErrorMessage>`Failed to add ${sourceType} to portfolio.`</Form.ErrorMessage>}

			<Form.ButtonRow>
				<Form.Submit disabled={isAdding || !sourceId}>{isAdding ? "Pinning..." : "Pin to Portfolio"}</Form.Submit>
			</Form.ButtonRow>
		</Form>
	);
}
