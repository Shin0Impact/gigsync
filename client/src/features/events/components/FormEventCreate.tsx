import { useState, useEffect, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCreateEventMutation } from "../eventsApi";
import { Form } from "@components";
import { ROUTES } from "../../../routes/routePaths";
import { CreateEventInput } from "@shared/types/index";

const DEFAULT_CENTER = { lat: 40.7128, lng: -74.006 };

export function FormEventCreate() {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const isDrawerOpen = searchParams.get("drawer") === "open";

	const [step, setStep] = useState<number>(1);
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [startAt, setStartAt] = useState("");
	const [endAt, setEndAt] = useState("");
	const [venueName, setVenueName] = useState("");
	const [location, setLocation] = useState(DEFAULT_CENTER);
	const [hasPickedLocation, setHasPickedLocation] = useState(false);

	const [isRecurring, setIsRecurring] = useState(false);
	const [recurringRule, setRecurringRule] = useState("");
	const [localError, setLocalError] = useState<string | null>(null);

	const [createEvent, { isLoading, error }] = useCreateEventMutation();
	const headers = ["Create new Event.", "When is it?", "Where will it be?", "Final details."];

	useEffect(() => {
		if (!isDrawerOpen) {
			setStep(1);
			setTitle("");
			setDescription("");
			setStartAt("");
			setEndAt("");
			setVenueName("");
			setLocation(DEFAULT_CENTER);
			setHasPickedLocation(false);
			setIsRecurring(false);
			setRecurringRule("");
			setLocalError(null);
		}
	}, [isDrawerOpen]);

	async function handleSubmit(e: FormEvent) {
		e.preventDefault();
		setLocalError(null);

		if (!hasPickedLocation) {
			return setLocalError("Please select a location for your event.");
		}

		try {
			const payload: CreateEventInput = {
				title: title.trim(),
				description: description.trim(),
				startAt: new Date(startAt).toISOString(),
				endAt: new Date(endAt).toISOString(),
				venueName: venueName.trim(),
				location,
				isRecurring,
				recurringRule: isRecurring ? recurringRule.trim() || null : null,
			};

			const response = await createEvent(payload).unwrap();
			navigate(ROUTES.SINGLE_EVENT(response.event.id), { replace: true });
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
			if (!startAt || !endAt) return setLocalError("Please select valid start and end times.");
			if (new Date(startAt) >= new Date(endAt)) {
				return setLocalError("End time must be after start time.");
			}
		}
		if (step === 3) {
			if (!venueName.trim()) return setLocalError("Please enter a venue name.");
			if (!hasPickedLocation) return setLocalError("Please pick a location on the map or search.");
		}

		setStep((prev) => prev + 1);
	}

	return (
		<Form
			title={headers[step - 1]}
			onSubmit={step === 4 ? handleSubmit : handleNext}
			isDrawer={true}>
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
						<Form.Label>Location & Map Coordinates</Form.Label>
						<Form.LocationPicker
							value={location}
							onChange={(coords) => {
								setLocation(coords);
								setHasPickedLocation(true);
							}}
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
