import { useState, type FormEvent } from "react";
import { useApplyToEventMutation, useGetEventQuery } from "../eventsApi";
import { Form } from "@components";

interface FormApplyEventProps {
	eventId: string | number;
	onClose: () => void;
}

export function FormApplyToEvent({ eventId, onClose }: FormApplyEventProps) {
	const [coverNote, setCoverNote] = useState("");
	const [applyToEvent, { isLoading, error, isSuccess }] = useApplyToEventMutation();
	const { data: eventData } = useGetEventQuery(eventId);

	const eventTitle = eventData?.event?.title ? `Apply to ${eventData.event.title}` : "Apply to Event";

	async function handleSubmit(e: FormEvent) {
		e.preventDefault();
		try {
			await applyToEvent({
				eventId: Number(eventId),
				coverNote: coverNote.trim() || undefined,
			}).unwrap();
		} catch (err) {
			console.error("Failed to apply:", err);
		}
	}

	return (
		<Form
			title={eventTitle}
			onSubmit={handleSubmit}
			isDrawer={true}>
			{error && <Form.ErrorMessage>Failed to send your application. Please try again.</Form.ErrorMessage>}

			{isSuccess ? (
				<div>
					<p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", marginBottom: "1rem" }}>
						Application sent successfully! You can track it under My Applications.
					</p>
					<Form.Submit
						type="button"
						onClick={onClose}>
						Done
					</Form.Submit>
				</div>
			) : (
				<>
					<Form.Field>
						<Form.Label htmlFor="coverNote">Cover note (optional)</Form.Label>
						<Form.TextArea
							id="coverNote"
							value={coverNote}
							onChange={(e) => setCoverNote(e.target.value)}
							placeholder="Tell the organizer why you would be a good fit…"
							rows={4}
							disabled={isLoading}
							autoFocus
						/>
					</Form.Field>

					<Form.Submit disabled={isLoading}>{isLoading ? "Sending…" : "Send Application"}</Form.Submit>
				</>
			)}
		</Form>
	);
}
