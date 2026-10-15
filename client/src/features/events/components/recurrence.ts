export type RepeatPreset = "none" | "daily" | "weekly" | "monthly" | "yearly" | "weekdays" | "custom";
export type RepeatUnit = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

export interface RecurrenceState {
	preset: RepeatPreset;
	// Custom only
	interval: number;
	unit: RepeatUnit;
	days: number[]; // local weekdays, 0 = Sunday
	ends: "never" | "on" | "after";
	until: string; // YYYY-MM-DD (local)
	count: number;
}

export const DEFAULT_RECURRENCE: RecurrenceState = {
	preset: "none",
	interval: 1,
	unit: "WEEKLY",
	days: [],
	ends: "never",
	until: "",
	count: 10,
};

const DAY_CODES = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
export const DAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];
export const UNIT_LABELS: Record<RepeatUnit, string> = {
	DAILY: "day",
	WEEKLY: "week",
	MONTHLY: "month",
	YEARLY: "year",
};

export function local_date_string(date: Date): string {
	const mm = String(date.getMonth() + 1).padStart(2, "0");
	const dd = String(date.getDate()).padStart(2, "0");
	return `${date.getFullYear()}-${mm}-${dd}`;
}

// The server evaluates weekdays in UTC; the organizer picks them in their
// own timezone. Shift by however far the start instant's UTC weekday is from
// its local weekday so e.g. a 1am Friday event still repeats on Fridays.
function to_utc_day_codes(localDays: number[], start: Date): string[] {
	const shift = start.getUTCDay() - start.getDay();
	return Array.from(new Set(localDays.map((d) => (d + shift + 14) % 7)))
		.sort()
		.map((d) => DAY_CODES[d]);
}

// Returns the rule string to send, null for "does not repeat", or an error.
export function build_recurrence_rule(state: RecurrenceState, start: Date): string | null | { error: string } {
	switch (state.preset) {
		case "none":
			return null;
		case "daily":
			return "FREQ=DAILY";
		case "weekly":
			return "FREQ=WEEKLY";
		case "monthly":
			return "FREQ=MONTHLY";
		case "yearly":
			return "FREQ=YEARLY";
		case "weekdays":
			return `FREQ=WEEKLY;BYDAY=${to_utc_day_codes([1, 2, 3, 4, 5], start).join(",")}`;
		case "custom": {
			if (!Number.isInteger(state.interval) || state.interval < 1 || state.interval > 99) {
				return { error: "Repeat every must be between 1 and 99." };
			}
			const parts = [`FREQ=${state.unit}`];
			if (state.interval > 1) parts.push(`INTERVAL=${state.interval}`);
			if (state.unit === "WEEKLY") {
				const days = state.days.length > 0 ? state.days : [start.getDay()];
				parts.push(`BYDAY=${to_utc_day_codes(days, start).join(",")}`);
			}
			if (state.ends === "on") {
				if (!state.until) return { error: "Pick the date the repeats end." };
				if (state.until < local_date_string(start)) {
					return { error: "The end date has to be after the first event." };
				}
				parts.push(`UNTIL=${state.until}`);
			} else if (state.ends === "after") {
				if (!Number.isInteger(state.count) || state.count < 1 || state.count > 999) {
					return { error: "Number of occurrences must be between 1 and 999." };
				}
				parts.push(`COUNT=${state.count}`);
			}
			return parts.join(";");
		}
	}
}

