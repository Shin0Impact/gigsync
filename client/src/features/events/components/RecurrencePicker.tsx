import controlStyles from "./EventFormControls.module.css";
import {
	DAY_LETTERS,
	UNIT_LABELS,
	local_date_string,
	type RecurrenceState,
	type RepeatPreset,
	type RepeatUnit,
} from "./recurrence";

interface RecurrencePickerProps {
	value: RecurrenceState;
	onChange: (value: RecurrenceState) => void;
	start: Date;
}

export function RecurrencePicker({ value, onChange, start }: RecurrencePickerProps) {
	const patch = (changes: Partial<RecurrenceState>) => onChange({ ...value, ...changes });

	const weekday = start.toLocaleDateString(undefined, { weekday: "long" });
	const monthDay = start.toLocaleDateString(undefined, { month: "long", day: "numeric" });

	const selectPreset = (preset: RepeatPreset) => {
		if (preset === "custom" && value.days.length === 0) {
			patch({ preset, days: [start.getDay()] });
		} else {
			patch({ preset });
		}
	};

	const toggleDay = (day: number) => {
		const days = value.days.includes(day) ? value.days.filter((d) => d !== day) : [...value.days, day];
		patch({ days });
	};

	return (
		<div className={controlStyles.stack}>
			<select
				className={controlStyles.select}
				value={value.preset}
				aria-label="Repeat"
				onChange={(e) => selectPreset(e.target.value as RepeatPreset)}>
				<option value="none">Does not repeat</option>
				<option value="daily">Daily</option>
				<option value="weekly">Weekly on {weekday}</option>
				<option value="monthly">Monthly on day {start.getDate()}</option>
				<option value="yearly">Annually on {monthDay}</option>
				<option value="weekdays">Every weekday (Monday to Friday)</option>
				<option value="custom">Custom…</option>
			</select>

			{value.preset === "custom" && (
				<div className={controlStyles.customPanel}>
					<div className={controlStyles.inline}>
						<span>Repeat every</span>
						<input
							type="number"
							min={1}
							max={99}
							className={controlStyles.smallInput}
							value={value.interval}
							aria-label="Repeat every"
							onChange={(e) => patch({ interval: Math.floor(Number(e.target.value)) || 1 })}
						/>
						<select
							className={controlStyles.select}
							style={{ width: "auto" }}
							value={value.unit}
							aria-label="Unit"
							onChange={(e) => patch({ unit: e.target.value as RepeatUnit })}>
							{(Object.keys(UNIT_LABELS) as RepeatUnit[]).map((unit) => (
								<option
									key={unit}
									value={unit}>
									{UNIT_LABELS[unit]}
									{value.interval > 1 ? "s" : ""}
								</option>
							))}
						</select>
					</div>

					{value.unit === "WEEKLY" && (
						<div className={controlStyles.inline}>
							<span>Repeat on</span>
							<div
								className={controlStyles.dayButtons}
								role="group"
								aria-label="Repeat on days">
								{DAY_LETTERS.map((letter, day) => (
									<button
										key={day}
										type="button"
										className={controlStyles.dayButton}
										aria-pressed={value.days.includes(day)}
										aria-label={new Date(2026, 0, 4 + day).toLocaleDateString(undefined, { weekday: "long" })}
										onClick={() => toggleDay(day)}>
										{letter}
									</button>
								))}
							</div>
						</div>
					)}

					<div
						className={controlStyles.endsGroup}
						role="radiogroup"
						aria-label="Ends">
						<span>Ends</span>
						<label className={controlStyles.endsOption}>
							<input
								type="radio"
								name="recurrence-ends"
								checked={value.ends === "never"}
								onChange={() => patch({ ends: "never" })}
							/>
							Never
						</label>
						<label className={controlStyles.endsOption}>
							<input
								type="radio"
								name="recurrence-ends"
								checked={value.ends === "on"}
								onChange={() => patch({ ends: "on" })}
							/>
							On
							<input
								type="date"
								className={controlStyles.dateInput}
								value={value.until}
								min={local_date_string(start)}
								disabled={value.ends !== "on"}
								aria-label="End date"
								onChange={(e) => patch({ until: e.target.value })}
							/>
						</label>
						<label className={controlStyles.endsOption}>
							<input
								type="radio"
								name="recurrence-ends"
								checked={value.ends === "after"}
								onChange={() => patch({ ends: "after" })}
							/>
							After
							<input
								type="number"
								min={1}
								max={999}
								className={controlStyles.smallInput}
								value={value.count}
								disabled={value.ends !== "after"}
								aria-label="Occurrences"
								onChange={(e) => patch({ count: Math.floor(Number(e.target.value)) || 1 })}
							/>
							occurrences
						</label>
					</div>
				</div>
			)}
		</div>
	);
}
