import {
  add_availability_date,
  list_availability_for_user,
  remove_availability_date,
} from '../db/queries/availability.queries';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function assert_valid_date_format(date: string): void {
  if (!DATE_PATTERN.test(date)) {
    throw new Error('date is required and must be in YYYY-MM-DD format');
  }
  // A string like "2026-02-31" matches the pattern but isn't a real
  // calendar date - Date.parse normalizes it forward (into March)
  // instead of rejecting it, so round-trip through UTC components and
  // compare rather than trusting Number.isNaN(parsed.getTime()) alone.
  const [year, month, day] = date.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  const round_trips =
    parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day;
  if (!round_trips) {
    throw new Error('date is not a valid calendar date');
  }
}

function today_utc_date_string(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function list_availability(user_id: string): Promise<string[]> {
  return list_availability_for_user(user_id);
}

export async function add_availability(user_id: string, date: string): Promise<string> {
  assert_valid_date_format(date);

  // Marking a past day "available" doesn't mean anything - only today
  // and future days are addable. Removing a stale day (see below) isn't
  // restricted the same way, since un-marking something should always
  // be allowed.
  if (date < today_utc_date_string()) {
    throw new Error('date must be today or in the future');
  }

  return add_availability_date(user_id, date);
}

export async function remove_availability(user_id: string, date: string): Promise<void> {
  assert_valid_date_format(date);
  await remove_availability_date(user_id, date);
}
