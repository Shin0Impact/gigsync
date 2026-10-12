import { useMemo } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import {
	useAddAvailabilityDateMutation,
	useGetAvailabilityQuery,
	useRemoveAvailabilityDateMutation,
} from "../availabilityApi";
import styles from "./AvailabilityCalendar.module.css";

interface AvailabilityCalendarProps {
	userId: string;
	isOwnProfile: boolean;
}

// "YYYY-MM-DD" <-> Date, both using LOCAL calendar fields rather than
// UTC ones. `new Date("2026-03-01")` parses as UTC midnight, which reads
// back as Feb 28th in any timezone behind UTC - exactly the kind of
// off-by-one that'd make an artist's own tap on March 1st save as Feb
// 28th. Going through local Y/M/D both ways means the date that renders
// under the user's tap is the date that round-trips to the server.
function parse_date_only(value: string): Date {
	const [year, month, day] = value.split("-").map(Number);
	return new Date(year, month - 1, day);
}

function format_date_only(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

function start_of_today(): Date {
	const now = new Date();
	return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

// Card #26 - the availability calendar on an artist's profile. Owners
// get an interactive react-day-picker in "multiple" mode (tap a day to
// toggle it); everyone else gets the same calendar read-only, with
// marked days highlighted, so an organizer can tell at a glance when an
// artist is free without needing an account.
export function AvailabilityCalendar({ userId, isOwnProfile }: AvailabilityCalendarProps) {
	const { data, isLoading, error } = useGetAvailabilityQuery(userId);
	const [addAvailabilityDate, { isLoading: isAdding }] = useAddAvailabilityDateMutation();
	const [removeAvailabilityDate, { isLoading: isRemoving }] = useRemoveAvailabilityDateMutation();

	const availableDates = useMemo(() => (data?.dates ?? []).map(parse_date_only), [data]);
	const isMutating = isAdding || isRemoving;

	if (isLoading) {
		return <div className={styles.status}>Loading availability…</div>;
	}

	if (error) {
		return <div className={styles.status}>Something went wrong loading availability.</div>;
	}

	if (!isOwnProfile) {
		return (
			<div className={styles.calendarWrapper}>
				<DayPicker
					animate
					modifiers={{ available: availableDates }}
					modifiersClassNames={{ available: styles.availableDay }}
					className={styles.rdp}
				/>
				<p className={styles.legend}>
					<span className={styles.legendSwatch} /> Available
				</p>
				{availableDates.length === 0 && <p className={styles.emptyText}>No availability marked yet.</p>}
			</div>
		);
	}

	// react-day-picker's "multiple" onSelect hands back the whole new
	// selected array AND the single day that was actually clicked
	// (triggerDate) - comparing whether that day ended up in the new
	// array tells us add vs. remove, without having to diff two arrays
	// ourselves.
	function handleSelect(selected: Date[] | undefined, triggerDate: Date) {
		if (isMutating) return;
		const date = format_date_only(triggerDate);
		const wasAdded = (selected ?? []).some((d) => format_date_only(d) === date);

		if (wasAdded) {
			addAvailabilityDate({ userId, date });
		} else {
			removeAvailabilityDate({ userId, date });
		}
	}

	return (
		<div className={styles.calendarWrapper}>
			<DayPicker
				animate
				mode="multiple"
				selected={availableDates}
				onSelect={handleSelect}
				disabled={isMutating ? () => true : { before: start_of_today() }}
				className={styles.rdp}
			/>
			<p className={styles.hint}>Tap a day to mark yourself available. Tap it again to remove it.</p>
		</div>
	);
}

export default AvailabilityCalendar;
