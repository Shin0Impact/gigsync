import React, { useState } from "react";
import { useMeQuery } from "../../auth";
import { useListPiecesQuery } from "../../pieces";
import { useListMyApplicationsQuery } from "../../events/eventsApi";
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

	// Events an artist can pin are the ones they were accepted to perform at.
	const { data: applicationsData, isLoading: isLoadingApplications } = useListMyApplicationsQuery(undefined, {
		skip: !userId,
	});
	const acceptedEvents = (applicationsData?.applications ?? []).filter((app) => app.status === "accepted");
	const isLoadingOptions = sourceType === "work" ? isLoadingPieces : isLoadingApplications;

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
					disabled={isLoadingOptions}
					required>
					<option value="">{isLoadingOptions ? "Loading options..." : `-- Choose a ${sourceType === "work" ? "piece" : "event"} --`}</option>

					{sourceType === "work" &&
						pieces.map((piece: any) => (
							<option
								key={piece.id}
								value={piece.id}>
								Work #{piece.id} {piece.description ? `- ${piece.description.substring(0, 30)}...` : ""}
							</option>
						))}

					{sourceType === "event" &&
						acceptedEvents.map((app) => (
							<option
								key={app.id}
								value={app.event_id}>
								{app.event_title} - {new Date(app.event_start_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
							</option>
						))}

					{sourceType === "event" && !isLoadingApplications && acceptedEvents.length === 0 && (
						<option
							value=""
							disabled>
							No accepted events yet
						</option>
					)}
				</Form.Select>
			</Form.Field>

			{error && <Form.ErrorMessage>{`Failed to add ${sourceType === "work" ? "piece" : sourceType} to portfolio.`}</Form.ErrorMessage>}

			<Form.ButtonRow>
				<Form.Submit disabled={isAdding || !sourceId}>{isAdding ? "Pinning..." : "Pin to Portfolio"}</Form.Submit>
			</Form.ButtonRow>
		</Form>
	);
}
