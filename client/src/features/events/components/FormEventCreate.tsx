import { useState, useEffect, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCreateEventMutation, useAddEventMediaMutation } from "../eventsApi";
import { uploadFileToR2 } from "../../../shared/uploadClient";
import { Form } from "@components";
import { ROUTES } from "../../../routes/routePaths";
import { CreateEventInput } from "@shared/types/index";
import { DayPicker, type DateRange } from "react-day-picker";
import "react-day-picker/style.css";
import { Switch } from "./EventFormControls";
import { RecurrencePicker } from "./RecurrencePicker";
import { build_recurrence_rule, DEFAULT_RECURRENCE, type RecurrenceState } from "./recurrence";
import controlStyles from "./EventFormControls.module.css";

const DEFAULT_CENTER = { lat: 40.7128, lng: -74.006 };

const URGENT_DURATIONS = [1, 2, 3, 4, 6];

function start_of_day(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// How many whole hours are left today (an urgent event has to start today).
function hours_left_today(now: Date = new Date()): number {
	const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
	return Math.floor((midnight.getTime() - now.getTime()) / 3_600_000);
}

function with_time(day: Date, time: string): Date | null {
	const match = /^(\d{2}):(\d{2})$/.exec(time);
	if (!match) return null;
	const date = new Date(day.getFullYear(), day.getMonth(), day.getDate(), Number(match[1]), Number(match[2]));
	return Number.isNaN(date.getTime()) ? null : date;
}

function format_when(start: Date, end: Date): string {
	const day = start.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
	const time = (d: Date) => d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
	const sameDay = start_of_day(start).getTime() === start_of_day(end).getTime();
	return sameDay
		? `${day}, ${time(start)} – ${time(end)}`
		: `${day}, ${time(start)} → ${end.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}, ${time(end)}`;
}

export function FormEventCreate() {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const isDrawerOpen = searchParams.get("drawer") === "open";

	const [step, setStep] = useState<number>(1);
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [isUrgent, setIsUrgent] = useState(false);
	const [urgentHours, setUrgentHours] = useState(2);
	const [urgentDuration, setUrgentDuration] = useState(2);
	const [range, setRange] = useState<DateRange | undefined>(undefined);
	const [startTime, setStartTime] = useState("18:00");
	const [endTime, setEndTime] = useState("22:00");
	const [venueName, setVenueName] = useState("");
	const [location, setLocation] = useState(DEFAULT_CENTER);
	const [hasPickedLocation, setHasPickedLocation] = useState(false);

	const [recurrence, setRecurrence] = useState<RecurrenceState>(DEFAULT_RECURRENCE);
	const [localError, setLocalError] = useState<string | null>(null);

	const [createEvent, { isLoading, error }] = useCreateEventMutation();
	const [addEventMedia] = useAddEventMediaMutation();
	const [coverFile, setCoverFile] = useState<File | null>(null);
	const [coverPreview, setCoverPreview] = useState<string | null>(null);
	const [isUploadingCover, setIsUploadingCover] = useState(false);

	useEffect(() => {
		if (!coverFile) {
			setCoverPreview(null);
			return;
		}
		const url = URL.createObjectURL(coverFile);
		setCoverPreview(url);
		return () => URL.revokeObjectURL(url);
	}, [coverFile]);

	function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		e.target.value = "";
		if (!file) return;
		if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
			return setLocalError("Cover image must be a JPG, PNG, WebP or GIF.");
		}
		if (file.size > 10 * 1024 * 1024) return setLocalError("Cover image must be under 10 MB.");
		setLocalError(null);
		setCoverFile(file);
	}
	const headers = ["Create new Event.", "When is it?", "Where will it be?", "Does it repeat?"];

	useEffect(() => {
		if (!isDrawerOpen) {
			setStep(1);
			setTitle("");
			setDescription("");
			setCoverFile(null);
			setIsUrgent(false);
			setUrgentHours(2);
			setUrgentDuration(2);
			setRange(undefined);
			setStartTime("18:00");
			setEndTime("22:00");
			setVenueName("");
			setLocation(DEFAULT_CENTER);
			setHasPickedLocation(false);
			setRecurrence(DEFAULT_RECURRENCE);
			setLocalError(null);
		}
	}, [isDrawerOpen]);

	// Turns whatever the "When" step collected into real Dates, or an error message.
	function build_times(): { start: Date; end: Date } | { error: string } {
		const now = new Date();

		if (isUrgent) {
			const maxHours = hours_left_today(now);
			if (maxHours < 1) {
				return { error: "It's too late for a same-day urgent event - turn off Urgent and pick a date." };
			}
			if (!Number.isInteger(urgentHours) || urgentHours < 1 || urgentHours > maxHours) {
				return { error: `Urgent events must start within 1-${maxHours} hours (today).` };
			}
			const start = new Date(now.getTime() + urgentHours * 3_600_000);
			return { start, end: new Date(start.getTime() + urgentDuration * 3_600_000) };
		}

		if (!range?.from) return { error: "Please pick the day (or days) of your event." };
		const start = with_time(range.from, startTime);
		const end = with_time(range.to ?? range.from, endTime);
		if (!start || !end) return { error: "Please set a start and end hour." };
		if (start.getTime() <= now.getTime()) return { error: "The event has to start in the future." };
		if (end.getTime() <= start.getTime()) return { error: "The end time must be after the start time." };
		return { start, end };
	}

	async function handleSubmit(e: FormEvent) {
		e.preventDefault();
		setLocalError(null);

		if (!hasPickedLocation) {
			return setLocalError("Please select a location for your event.");
		}

		const times = build_times();
		if ("error" in times) return setLocalError(times.error);

		const rule = isUrgent ? null : build_recurrence_rule(recurrence, times.start);
		if (rule !== null && typeof rule === "object") return setLocalError(rule.error);

		try {
			const payload: CreateEventInput = {
				title: title.trim(),
				description: description.trim(),
				startAt: times.start.toISOString(),
				endAt: times.end.toISOString(),
				venueName: venueName.trim(),
				location,
				isRecurring: rule !== null,
				recurringRule: rule,
				isUrgent,
			};

			const response = await createEvent(payload).unwrap();

			// The cover is optional and uploaded after the event exists; if it fails the
			// event is still created and the organizer can retry from the event page.
			if (coverFile) {
				try {
					setIsUploadingCover(true);
					const { objectKey } = await uploadFileToR2(coverFile);
					await addEventMedia({
						eventId: response.event.id,
						mediaType: "image",
						objectKey,
						altText: title.trim(),
						sortOrder: 0,
					}).unwrap();
				} catch (uploadErr) {
					console.error("Event created, but the cover image failed to upload:", uploadErr);
				} finally {
					setIsUploadingCover(false);
				}
			}

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
			const times = build_times();
			if ("error" in times) return setLocalError(times.error);
		}
		if (step === 3) {
			if (!venueName.trim()) return setLocalError("Please enter a venue name.");
			if (!hasPickedLocation) return setLocalError("Please pick a location on the map or search.");
		}

		setStep((prev) => prev + 1);
	}

	// The picker labels itself from the event's first day ("Weekly on Friday").
	const timesPreview = step === 4 ? build_times() : null;
	const recurrenceStart = timesPreview && !("error" in timesPreview) ? timesPreview.start : new Date();

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

					<Form.Field>
						<Form.Label htmlFor="event-cover">Cover image (optional)</Form.Label>
						{coverPreview && (
							<div className={controlStyles.coverPreviewWrap}>
								<img
									className={controlStyles.coverPreview}
									src={coverPreview}
									alt="Cover preview"
								/>
								<button
									type="button"
									className={controlStyles.coverRemove}
									onClick={() => setCoverFile(null)}>
									Remove
								</button>
							</div>
						)}
						<Form.FileInput
							id="event-cover"
							file={coverFile}
							buttonText="Choose Cover Image"
							accept="image/jpeg,image/png,image/webp,image/gif"
							onChange={handleCoverChange}
						/>
					</Form.Field>
				</>
			)}

			{step === 2 && (
				<div className={controlStyles.stack}>
					<Switch
						checked={isUrgent}
						onChange={setIsUrgent}
						title="Urgent"
						hint="I need an artist today"
					/>

					{isUrgent ? (
						<UrgentWhen
							hours={urgentHours}
							onHours={setUrgentHours}
							duration={urgentDuration}
							onDuration={setUrgentDuration}
						/>
					) : (
						<>
							<DayPicker
								mode="range"
								selected={range}
								onSelect={setRange}
								disabled={{ before: start_of_day(new Date()) }}
								className={controlStyles.calendar}
							/>
							<p className={controlStyles.note}>
								Tap one day, or tap a second day to cover several.
							</p>
							<div className={controlStyles.row}>
								<Form.Field>
									<Form.Label htmlFor="event-start-time">Starts at</Form.Label>
									<Form.Input
										id="event-start-time"
										type="time"
										value={startTime}
										onChange={(e) => setStartTime(e.target.value)}
										required
									/>
								</Form.Field>
								<Form.Field>
									<Form.Label htmlFor="event-end-time">Ends at</Form.Label>
									<Form.Input
										id="event-end-time"
										type="time"
										value={endTime}
										onChange={(e) => setEndTime(e.target.value)}
										required
								/>
								</Form.Field>
							</div>
						</>
					)}
				</div>
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
				<div className={controlStyles.stack}>
					{isUrgent ? (
						<p className={controlStyles.note}>
							Urgent events happen once, so there's nothing to repeat. You're ready to publish.
						</p>
					) : (
						<RecurrencePicker
							value={recurrence}
							onChange={setRecurrence}
							start={recurrenceStart}
						/>
					)}
				</div>
			)}

			{(localError || error) && (
				<Form.ErrorMessage>
					{localError ?? "Failed to create event. Please verify your data and try again."}
				</Form.ErrorMessage>
			)}

			<Form.Submit disabled={isLoading || isUploadingCover}>
				{isLoading ? "Creating Event..." : isUploadingCover ? "Uploading cover..." : step === 4 ? "Publish Event" : "Continue →"}
			</Form.Submit>
		</Form>
	);
}

interface UrgentWhenProps {
	hours: number;
	onHours: (hours: number) => void;
	duration: number;
	onDuration: (hours: number) => void;
}

function UrgentWhen({ hours, onHours, duration, onDuration }: UrgentWhenProps) {
	const maxHours = hours_left_today();

	if (maxHours < 1) {
		return (
			<p className={controlStyles.note}>
				It's too late for a same-day urgent event. Turn Urgent off to pick a date instead.
			</p>
		);
	}

	const clamped = Math.min(Math.max(hours, 1), maxHours);
	const start = new Date(Date.now() + clamped * 3_600_000);
	const end = new Date(start.getTime() + duration * 3_600_000);
	const quick = [1, 2, 3, 6, 12].filter((h) => h <= maxHours);

	return (
		<>
			<Form.Field>
				<Form.Label htmlFor="event-urgent-hours">Starts within (hours, max {maxHours} - it has to be today)</Form.Label>
				<Form.Input
					id="event-urgent-hours"
					type="number"
					min={1}
					max={maxHours}
					step={1}
					value={hours}
					onChange={(e) => onHours(Math.min(Math.max(Math.floor(Number(e.target.value)) || 1, 1), maxHours))}
					required
				/>
			</Form.Field>
			<div className={controlStyles.chipRow}>
				{quick.map((h) => (
					<button
						key={h}
						type="button"
						className={controlStyles.chipButton}
						aria-pressed={hours === h}
						onClick={() => onHours(h)}>
						{h}h
					</button>
				))}
			</div>

			<Form.Field>
				<Form.Label>Lasts</Form.Label>
				<div className={controlStyles.chipRow}>
					{URGENT_DURATIONS.map((h) => (
						<button
							key={h}
							type="button"
							className={controlStyles.chipButton}
							aria-pressed={duration === h}
							onClick={() => onDuration(h)}>
							{h}h
						</button>
					))}
				</div>
			</Form.Field>

			<p className={controlStyles.summary}>{format_when(start, end)}</p>
		</>
	);
}

export default FormEventCreate;
