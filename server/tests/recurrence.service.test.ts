import assert from 'node:assert/strict';
import {
  calculate_next_occurrence,
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
