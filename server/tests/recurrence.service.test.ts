import assert from 'node:assert/strict';
import {
  calculate_next_occurrence,
  calculate_next_occurrence_in_series,
  parse_recurring_rule,
} from '../src/services/recurrence.service';

// -----------------------------------------------------------------------------
// Weekly recurrence
// -----------------------------------------------------------------------------

{
  const start = new Date('2026-09-23T20:00:00Z');
  const end = new Date('2026-09-23T23:00:00Z');

  const next = calculate_next_occurrence(
    start,
    end,
    'WEEKLY',
  );

  assert.equal(
    next.startAt.toISOString(),
    '2026-09-30T20:00:00.000Z',
  );

  assert.equal(
    next.endAt.toISOString(),
    '2026-09-30T23:00:00.000Z',
  );
}

// -----------------------------------------------------------------------------
// Monthly recurrence
// -----------------------------------------------------------------------------

{
  const start = new Date('2026-09-23T20:00:00Z');
  const end = new Date('2026-09-23T23:00:00Z');

  const next = calculate_next_occurrence(
    start,
    end,
    'MONTHLY',
  );

  assert.equal(
    next.startAt.toISOString(),
    '2026-10-23T20:00:00.000Z',
  );

  assert.equal(
    next.endAt.toISOString(),
    '2026-10-23T23:00:00.000Z',
  );
}

// -----------------------------------------------------------------------------
// Monthly recurrence: January 31 -> February 28
// Non-leap year
// -----------------------------------------------------------------------------

{
  const start = new Date('2026-01-31T20:00:00Z');
  const end = new Date('2026-01-31T23:00:00Z');

  const next = calculate_next_occurrence(
    start,
    end,
    'MONTHLY',
  );

  assert.equal(
    next.startAt.toISOString(),
    '2026-02-28T20:00:00.000Z',
  );

  assert.equal(
    next.endAt.toISOString(),
    '2026-02-28T23:00:00.000Z',
  );
}

// -----------------------------------------------------------------------------
// Monthly recurrence: January 31 -> February 29
// Leap year
// -----------------------------------------------------------------------------

{
  const start = new Date('2028-01-31T20:00:00Z');
  const end = new Date('2028-01-31T23:00:00Z');

  const next = calculate_next_occurrence(
    start,
    end,
    'MONTHLY',
  );

  assert.equal(
    next.startAt.toISOString(),
    '2028-02-29T20:00:00.000Z',
  );

  assert.equal(
    next.endAt.toISOString(),
    '2028-02-29T23:00:00.000Z',
  );
}

// -----------------------------------------------------------------------------
// Weekly recurrence preserves event duration
// -----------------------------------------------------------------------------

{
  const start = new Date('2026-09-23T18:30:00Z');
  const end = new Date('2026-09-23T21:45:00Z');

  const next = calculate_next_occurrence(
    start,
    end,
    'WEEKLY',
  );

  const originalDuration =
    end.getTime() - start.getTime();

  const nextDuration =
    next.endAt.getTime() - next.startAt.getTime();

  assert.equal(nextDuration, originalDuration);

  assert.equal(
    next.startAt.toISOString(),
    '2026-09-30T18:30:00.000Z',
  );

  assert.equal(
    next.endAt.toISOString(),
    '2026-09-30T21:45:00.000Z',
  );
}

// -----------------------------------------------------------------------------
// Monthly recurrence preserves event duration
// -----------------------------------------------------------------------------

{
  const start = new Date('2026-09-23T18:30:00Z');
  const end = new Date('2026-09-23T21:45:00Z');

  const next = calculate_next_occurrence(
    start,
    end,
    'MONTHLY',
  );

  const originalDuration =
    end.getTime() - start.getTime();

  const nextDuration =
    next.endAt.getTime() - next.startAt.getTime();

  assert.equal(nextDuration, originalDuration);

  assert.equal(
    next.startAt.toISOString(),
    '2026-10-23T18:30:00.000Z',
  );

  assert.equal(
    next.endAt.toISOString(),
    '2026-10-23T21:45:00.000Z',
  );
}

// -----------------------------------------------------------------------------
// Invalid event duration
// -----------------------------------------------------------------------------

{
  const start = new Date('2026-09-23T20:00:00Z');
  const end = new Date('2026-09-23T20:00:00Z');

  assert.throws(
    () =>
      calculate_next_occurrence(
        start,
        end,
        'WEEKLY',
      ),
    {
      message: 'Event end time must be after start time',
    },
  );
}

// -----------------------------------------------------------------------------
// Invalid event duration: end before start
// -----------------------------------------------------------------------------

{
  const start = new Date('2026-09-23T23:00:00Z');
  const end = new Date('2026-09-23T20:00:00Z');

  assert.throws(
    () =>
      calculate_next_occurrence(
        start,
        end,
        'MONTHLY',
      ),
    {
      message: 'Event end time must be after start time',
    },
  );
}

console.log('Recurrence calculation tests passed');

// -----------------------------------------------------------------------------
// Google-style rules
// -----------------------------------------------------------------------------

{
  const start = new Date('2026-10-15T18:00:00Z'); // Thursday
  const end = new Date('2026-10-15T20:00:00Z');

  // Daily
  assert.equal(
    calculate_next_occurrence(start, end, 'FREQ=DAILY').startAt.toISOString(),
    '2026-10-16T18:00:00.000Z',
  );

  // Every 2 weeks
  assert.equal(
    calculate_next_occurrence(start, end, 'FREQ=WEEKLY;INTERVAL=2').startAt.toISOString(),
    '2026-10-29T18:00:00.000Z',
  );

  // Yearly (leap-day clamp)
  assert.equal(
    calculate_next_occurrence(
      new Date('2028-02-29T10:00:00Z'),
      new Date('2028-02-29T11:00:00Z'),
      'FREQ=YEARLY',
    ).startAt.toISOString(),
    '2029-02-28T10:00:00.000Z',
  );

  // Every weekday: Thursday -> Friday -> Monday
  const weekdays = 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR';
  const fri = calculate_next_occurrence(start, end, weekdays);
  assert.equal(fri.startAt.toISOString(), '2026-10-16T18:00:00.000Z');
  const mon = calculate_next_occurrence(fri.startAt, fri.endAt, weekdays);
  assert.equal(mon.startAt.toISOString(), '2026-10-19T18:00:00.000Z');

  // Mon/Wed every 2 weeks: Wed (same week) -> Mon two weeks after the start week
  const mw = 'FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE';
  const monStart = new Date('2026-10-12T18:00:00Z');
  const monEnd = new Date('2026-10-12T19:00:00Z');
  const wed = calculate_next_occurrence(monStart, monEnd, mw);
  assert.equal(wed.startAt.toISOString(), '2026-10-14T18:00:00.000Z');
  const nextMon = calculate_next_occurrence(wed.startAt, wed.endAt, mw);
  assert.equal(nextMon.startAt.toISOString(), '2026-10-26T18:00:00.000Z');

  // UNTIL is inclusive
  assert.equal(
    calculate_next_occurrence_in_series(start, end, 'FREQ=DAILY;UNTIL=2026-10-16')?.startAt.toISOString(),
    '2026-10-16T18:00:00.000Z',
  );
  assert.equal(calculate_next_occurrence_in_series(start, end, 'FREQ=DAILY;UNTIL=2026-10-15'), null);

  // COUNT includes the first occurrence
  assert.ok(calculate_next_occurrence_in_series(start, end, 'FREQ=DAILY;COUNT=3', 2));
  assert.equal(calculate_next_occurrence_in_series(start, end, 'FREQ=DAILY;COUNT=3', 3), null);
}

// Validation
for (const bad of ['', 'DAILY', 'FREQ=HOURLY', 'FREQ=DAILY;INTERVAL=0', 'FREQ=DAILY;BYDAY=MO',
  'FREQ=WEEKLY;BYDAY=XX', 'FREQ=DAILY;UNTIL=2026-10-16;COUNT=2', 'FREQ=DAILY;UNTIL=nope', 'FREQ=DAILY;FOO=1']) {
  assert.throws(() => parse_recurring_rule(bad), undefined, bad);
}
assert.deepEqual(parse_recurring_rule('WEEKLY').freq, 'WEEKLY');

console.log('recurrence.service tests passed');
