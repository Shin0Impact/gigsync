import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateEventMutation } from "../eventsApi";
// import { StepIndicator } from "../../../components/StepIndicator";
import { Form } from "@components";
import { ROUTES } from "../../../routes/routePaths";
import { CreateEventInput } from "@shared/types/index";

export function FormEventCreate() {
	const navigate = useNavigate();

	const [step, setStep] = useState<number>(1);
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [startAt, setStartAt] = useState("");
	const [endAt, setEndAt] = useState("");
	const [venueName, setVenueName] = useState("");
	const [lat, setLat] = useState<string>("0");
	const [lng, setLng] = useState<string>("0");
	const [isRecurring, setIsRecurring] = useState(false);
	const [recurringRule, setRecurringRule] = useState("");

	const [localError, setLocalError] = useState<string | null>(null);

	const [createEvent, { isLoading, error }] = useCreateEventMutation();
	const headers = ["Let's host an event.", "When is it happening?", "Where is the venue?", "Final details & rules."];

	async function handleSubmit(e: FormEvent) {
		e.preventDefault();
		setLocalError(null);

		try {
			const payload: CreateEventInput = {
				title: title.trim(),
				description: description.trim(),
				startAt: new Date(startAt).toISOString(),
				endAt: new Date(endAt).toISOString(),
				venueName: venueName.trim(),
				location: {
					lat: parseFloat(lat) || 0,
					lng: parseFloat(lng) || 0,
				},
				isRecurring,
				recurringRule: isRecurring ? recurringRule.trim() || null : null,
			};

			const response = await createEvent(payload).unwrap();
			const eventId = response.event.id;

			// Navigate to the newly created event page or happenings list
			navigate(ROUTES.SINGLE_EVENT(eventId), { replace: true });
		} catch (err) {
			console.error("Failed to create event:", err);
			setLocalError("Failed to create event. Please check your inputs and try again.");
		}
	}

	function handleNext(e: FormEvent) {
		e.preventDefault();
		setLocalError(null);

		if (step === 1) {
			if (!title.trim()) return setLocalError("Please enter an event title.");
			if (!description.trim()) return setLocalError("Please enter a description.");
		}
		if (step === 2) {
			if (!startAt || !endAt) return setValidDateError();
			if (new Date(startAt) >= new Date(endAt)) {
				return setLocalError("End time must be after start time.");
			}
		}
		if (step === 3) {
			if (!venueName.trim()) return setLocalError("Please enter a venue name.");
		}

		setStep((prev) => prev + 1);
	}

	function setValidDateError() {
		setLocalError("Please select valid start and end times.");
	}

	// const headerLeft = (
	// <Form.ToggleButton
	// onClick={() => {
	// setLocalError(null);
	// setStep((prev) => Math.max(prev - 1, 1));
	// }}
	// style={{ opacity: step === 1 ? 0.3 : 0.7 }}
	// disabled={step === 1}>
	// ← Back
	// </Form.ToggleButton>
	// );

	// const headerCenter = (
	// <StepIndicator
	// currentStep={step}
	// totalSteps={4}
	// />
	// );

	// const headerRight = <Form.ToggleButton onClick={() => navigate(-1)}>Cancel</Form.ToggleButton>;

	return (
		<Form
			title={headers[step - 1]}
			onSubmit={step === 4 ? handleSubmit : handleNext}
			// header={
			// 	<Form.Header
			// 		left={headerLeft}
			// 		center={headerCenter}
			// 		right={headerRight}
			// 	/>
			// }
		>
			{step === 1 && (
				<>
					<Form.Field>
						<Form.Label htmlFor="event-title">Event Title</Form.Label>
						<Form.Input
							id="event-title"
							type="text"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder="Give your happening a title..."
							required
							autoFocus
						/>
					</Form.Field>

					<Form.Field>
						<Form.Label htmlFor="event-desc">Description</Form.Label>
						<Form.TextArea
							id="event-desc"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="What can attendees expect?"
							rows={4}
							required
						/>
					</Form.Field>
				</>
			)}

			{step === 2 && (
				<>
					<Form.Field>
						<Form.Label htmlFor="event-start">Start Date & Time</Form.Label>
						<Form.Input
							id="event-start"
							type="datetime-local"
							value={startAt}
							onChange={(e) => setStartAt(e.target.value)}
							required
							autoFocus
						/>
					</Form.Field>

					<Form.Field>
						<Form.Label htmlFor="event-end">End Date & Time</Form.Label>
						<Form.Input
							id="event-end"
							type="datetime-local"
							value={endAt}
							onChange={(e) => setEndAt(e.target.value)}
							required
						/>
					</Form.Field>
				</>
			)}

			{step === 3 && (
				<>
					<Form.Field>
						<Form.Label htmlFor="event-venue">Venue Name</Form.Label>
						<Form.Input
							id="event-venue"
							type="text"
							value={venueName}
							onChange={(e) => setVenueName(e.target.value)}
							placeholder="e.g. The Gallery Space"
							required
							autoFocus
						/>
					</Form.Field>

					<Form.Field>
						<Form.Label htmlFor="event-lat">Latitude</Form.Label>
						<Form.Input
							id="event-lat"
							type="number"
							step="any"
							value={lat}
							onChange={(e) => setLat(e.target.value)}
							placeholder="40.7128"
						/>
					</Form.Field>

					<Form.Field>
						<Form.Label htmlFor="event-lng">Longitude</Form.Label>
						<Form.Input
							id="event-lng"
							type="number"
							step="any"
							value={lng}
							onChange={(e) => setLng(e.target.value)}
							placeholder="-74.0060"
						/>
					</Form.Field>
				</>
			)}

			{step === 4 && (
				<>
					<Form.Field>
						<Form.Checkbox
							id="event-recurring"
							label="Is this a recurring event?"
							checked={isRecurring}
							onChange={setIsRecurring}
						/>
					</Form.Field>

					{isRecurring && (
						<Form.Field>
							<Form.Label htmlFor="event-rule">Recurrence Rule</Form.Label>
							<Form.Input
								id="event-rule"
								type="text"
								value={recurringRule}
								onChange={(e) => setRecurringRule(e.target.value)}
								placeholder="e.g. Weekly on Fridays"
								autoFocus
							/>
						</Form.Field>
					)}
				</>
			)}

			{(localError || error) && (
				<Form.ErrorMessage>
					{localError ?? "Failed to create event. Please verify your data and try again."}
				</Form.ErrorMessage>
			)}

			<Form.Submit disabled={isLoading}>
				{isLoading ? "Creating Event..." : step === 4 ? "Publish Event" : "Continue →"}
			</Form.Submit>
		</Form>
	);
}

export default FormEventCreate;
