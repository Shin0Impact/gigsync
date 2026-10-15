// Recurrence rules. Two formats are accepted:
//   - legacy:   "WEEKLY" | "MONTHLY"
//   - Google-calendar style, an RFC-5545-like subset:
//       FREQ=DAILY|WEEKLY|MONTHLY|YEARLY
//       [;INTERVAL=n]            every n days/weeks/months/years (default 1)
//       [;BYDAY=MO,TU,...]       WEEKLY only; weekdays are UTC weekdays
//       [;UNTIL=YYYY-MM-DD]      last day an occurrence may start (inclusive)
//       [;COUNT=n]               total number of occurrences, incl. the first
//     UNTIL and COUNT are mutually exclusive. Omit both for "never ends".
export type RecurringRule = string;

export type RecurringFreq = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

export interface ParsedRecurringRule {
	freq: RecurringFreq;
	interval: number;
	byDay: number[]; // 0 = Sunday ... 6 = Saturday (UTC)
	until: string | null;
	count: number | null;
}

const DAY_CODES = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
const MAX_RULE_LENGTH = 100;

export function parse_recurring_rule(rule: unknown): ParsedRecurringRule {
	if (typeof rule !== "string" || rule.length === 0 || rule.length > MAX_RULE_LENGTH) {
		throw new Error("Invalid recurring rule");
	}

	if (rule === "WEEKLY" || rule === "MONTHLY") {
		return { freq: rule, interval: 1, byDay: [], until: null, count: null };
	}

	const parts = new Map<string, string>();
	for (const part of rule.split(";")) {
		const [key, value, ...extra] = part.split("=");
		if (!key || value === undefined || extra.length > 0 || parts.has(key)) {
			throw new Error("Invalid recurring rule");
		}
		parts.set(key, value);
	}

	for (const key of parts.keys()) {
		if (!["FREQ", "INTERVAL", "BYDAY", "UNTIL", "COUNT"].includes(key)) {
			throw new Error("Invalid recurring rule");
		}
	}

	const freq = parts.get("FREQ");
	if (freq !== "DAILY" && freq !== "WEEKLY" && freq !== "MONTHLY" && freq !== "YEARLY") {
		throw new Error("Invalid recurring rule");
	}

	const interval = parts.has("INTERVAL") ? Number(parts.get("INTERVAL")) : 1;
	if (!Number.isInteger(interval) || interval < 1 || interval > 99) {
		throw new Error("Recurring interval must be between 1 and 99");
	}

	let byDay: number[] = [];
	if (parts.has("BYDAY")) {
		if (freq !== "WEEKLY") {
			throw new Error("BYDAY is only valid for weekly rules");
		}
		byDay = (parts.get("BYDAY") as string).split(",").map((code) => DAY_CODES.indexOf(code));
		if (byDay.length === 0 || byDay.some((d) => d < 0)) {
			throw new Error("Invalid recurring rule");
		}
		byDay = Array.from(new Set(byDay)).sort();
	}

	if (parts.has("UNTIL") && parts.has("COUNT")) {
		throw new Error("A recurring rule can end by date or by count, not both");
	}

	let until: string | null = null;
	if (parts.has("UNTIL")) {
		until = parts.get("UNTIL") as string;
		if (!/^\d{4}-\d{2}-\d{2}$/.test(until) || Number.isNaN(Date.parse(`${until}T00:00:00Z`))) {
			throw new Error("Invalid recurring end date");
		}
	}

	let count: number | null = null;
	if (parts.has("COUNT")) {
		count = Number(parts.get("COUNT"));
		if (!Number.isInteger(count) || count < 1 || count > 999) {
			throw new Error("Recurring count must be between 1 and 999");
		}
	}

	return { freq, interval, byDay, until, count };
}

export interface NextOccurrence {
	startAt: Date;
	endAt: Date;
}

function next_start(startAt: Date, rule: ParsedRecurringRule): Date {
	switch (rule.freq) {
		case "DAILY":
			return add_days(startAt, rule.interval);

		case "WEEKLY": {
			if (rule.byDay.length === 0) {
				return add_days(startAt, 7 * rule.interval);
			}
			// Walk forward to the next selected weekday that falls in a week
			// that is a multiple of `interval` weeks after the start week.
			const startWeek = week_index(startAt);
			for (let offset = 1; offset <= 7 * rule.interval + 7; offset += 1) {
				const candidate = add_days(startAt, offset);
				if (
					rule.byDay.includes(candidate.getUTCDay()) &&
					(week_index(candidate) - startWeek) % rule.interval === 0
				) {
					return candidate;
				}
			}
			throw new Error("Could not compute next occurrence");
		}

		case "MONTHLY":
			return add_months_clamped(startAt, rule.interval);

		case "YEARLY":
			return add_months_clamped(startAt, 12 * rule.interval);
	}
}

// Monday-based week number (1970-01-01 was a Thursday).
function week_index(date: Date): number {
	const days = Math.floor(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / 86_400_000);
	return Math.floor((days + 3) / 7);
}

/**
 * Next occurrence for a series, or null when the series has ended.
 * `occurrenceNumber` is the 1-based position of the occurrence that
 * `startAt`/`endAt` describe (needed for COUNT).
 */
export function calculate_next_occurrence_in_series(
	startAt: Date,
	endAt: Date,
	rawRule: RecurringRule,
	occurrenceNumber = 1,
): NextOccurrence | null {
	const rule = parse_recurring_rule(rawRule);
	const duration = endAt.getTime() - startAt.getTime();

	if (duration <= 0) {
		throw new Error("Event end time must be after start time");
	}

	if (rule.count !== null && occurrenceNumber >= rule.count) {
		return null;
	}

	const nextStartAt = next_start(startAt, rule);

	if (rule.until !== null && nextStartAt.toISOString().slice(0, 10) > rule.until) {
		return null;
	}

	return {
		startAt: nextStartAt,
		endAt: new Date(nextStartAt.getTime() + duration),
	};
}

export function calculate_next_occurrence(
	startAt: Date,
	endAt: Date,
	rule: RecurringRule,
): NextOccurrence {
	const next = calculate_next_occurrence_in_series(startAt, endAt, rule);

	if (next === null) {
		throw new Error("Recurring series has ended");
	}

	return next;
}

function add_days(date: Date, days: number): Date {
	const result = new Date(date);

	result.setUTCDate(result.getUTCDate() + days);

	return result;
}

function add_months_clamped(date: Date, months: number): Date {
	const result = new Date(date);
	const originalDay = result.getUTCDate();

	// Move to the first day before changing the month.
	// This prevents JavaScript from overflowing dates such as
	// January 31 -> March 3 when trying to create February 31.
	result.setUTCDate(1);
	result.setUTCMonth(result.getUTCMonth() + months);

	const lastDayOfMonth = new Date(
		Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0),
	).getUTCDate();

	result.setUTCDate(Math.min(originalDay, lastDayOfMonth));

	return result;
}
