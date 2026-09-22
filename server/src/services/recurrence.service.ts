export type RecurringRule = 'WEEKLY' | 'MONTHLY';

export interface NextOccurrence {
  startAt: Date;
  endAt: Date;
}

export function calculate_next_occurrence(
  startAt: Date,
  endAt: Date,
  rule: RecurringRule,
): NextOccurrence {
  const duration = endAt.getTime() - startAt.getTime();

  if (duration <= 0) {
    throw new Error('Event end time must be after start time');
  }

  let nextStartAt: Date;

  switch (rule) {
    case 'WEEKLY':
      nextStartAt = add_days(startAt, 7);
      break;

    case 'MONTHLY':
      nextStartAt = add_months_clamped(startAt, 1);
      break;
  }

  return {
    startAt: nextStartAt,
    endAt: new Date(nextStartAt.getTime() + duration),
  };
}

function add_days(date: Date, days: number): Date {
  const result = new Date(date);

  result.setDate(result.getDate() + days);

  return result;
}

function add_months_clamped(date: Date, months: number): Date {
  const result = new Date(date);
  const originalDay = result.getDate();

  // Move to the first day before changing the month.
  // This prevents JavaScript from overflowing dates such as
  // January 31 -> March 3 when trying to create February 31.
  result.setDate(1);
  result.setMonth(result.getMonth() + months);

  const lastDayOfMonth = new Date(
    result.getFullYear(),
    result.getMonth() + 1,
    0,
  ).getDate();

  result.setDate(Math.min(originalDay, lastDayOfMonth));

  return result;
}
